---
external: false
title: "nodejs使用koa2-mongodb搭建一个功能健全的后台开发模板"
description: "文章将初步介绍用koa2来初步实现写接口和鉴权以及静态托管等。"
date: "2022-05-01"
---

我是一名前端小菜鸡，平日里写写页面，写写BUG，并乐此不疲，非常满足。当有一天，我突然想想，我如果自己要做一个完整的项目，那我就需要数据来帮忙呀，可是数据得要后端大佬们写接口给我才行，虽然我的程序员朋友还是有一米米，但大佬一般都忙呀，实在不好意思拉着，于是我就想，我是否可以自己来写接口呢？

于是我浏览万千网页，选择了一个不用太卷（主要是卷不动了😥），对前端友好的nodejs来做后台开发。不说太多废话，开整！

**1、安装mongodb**

地址：[MongoDB Community Download | MongoDB](https://www.mongodb.com/try/download/enterprise)

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5638e11148d3416dbeb216f8f0e1eafb~tplv-k3u1fbpfcp-watermark.image?)

**2、下载依赖**

![package.json依赖.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c87484c359934d78b3a0d9ef05d13ecd~tplv-k3u1fbpfcp-watermark.image?)

**3、对依赖进行配置（我统一放在了setting目录下）**

jwt

```js
const jwt = require("koa-jwt");
module.exports = jwt({
  secret: process.env.JWT_SECRET,
}).unless({ path: [/^\/public/, /\/login/, /\/web/] }); //token鉴权忽略public和login、web开头的接口
//koa-jwt默认配置下 前端axios的请求拦截的headers里面这样设置 config.headers["authorization"] = `Bearer ${token}`; 其中token是登录接口生成的
```

koa-body

```js
const koaBody = require("koa-body");
const path = require("path");
const setting = {
  multipart: true, // 支持文件上传
  formidable: {
    maxFieldsSize: 30 * 1024 * 1024, // 文件上传大小限制30M
  },
};
module.exports = koaBody(setting);
```

koa-static

```js
const koaStatic = require("koa-static");
module.exports = koaStatic(process.cwd());
```

koa-cors

```js
const cors = require("koa2-cors");
const setting = {
  origin: process.env.KOA_CORS_ORIGIN, //只允许这个域名的请求
  maxAge: 5, //指定本次预检请求的有效期，单位为秒。
  credentials: true, //是否允许发送Cookie
  allowMethods: ["GET", "POST", "PUT", "DELETE"], //设置所允许的HTTP请求方法
  allowHeaders: ["Content-Type", "Authorization", "Accept"], //设置服务器支持的所有头信息字段
  exposeHeaders: ["WWW-Authenticate", "Server-Authorization"], //设置获取其他自定义字段
};

module.exports = cors(setting);
```

mongoose

```js
const mongoose = require("mongoose");
let connectUrl = process.env.MONGODB_DB;
mongoose.connect(connectUrl, (err) => {
  if (err) {
    console.log("数据库连接失败：" + err);
  } else {
    console.log("数据库成功连接到：" + connectUrl);
  }
});

module.exports = mongoose;
```

**4、封装其他中间件（也是放在了setting）**

errHandle---处理异常

```js
const errHandle = async (ctx, next) =>
  //全局异常处理 如果接口调用时有错误发生 但是真正逻辑处遗漏了对该异常的处理 就会到这里来执行
  next().catch((err) => {
    console.log("err信息", err);
    if (err.status === 401) {
      ctx.fail("没有权限访问", 401); //处理jwt的token鉴权
    } else {
      ctx.fail(err.message); //处理主要是接口调用产生的错误
    }
  });

module.exports = errHandle;
```

htmlHistory---兼容前端托管的静态页面的history模式 hash模式不需要

```js
const fs = require("fs");
const htmlHistory = async (ctx, next) => {
  // history 中间件
  const path = "/web/"; // 需要判断的路径
  await next(); // 等待请求执行完毕
  if (ctx.response.status === 404 && ctx.request.url.includes(path)) {
    // 判断是否符合条件
    ctx.type = "text/html; charset=utf-8"; // 修改响应类型
    ctx.body = fs.readFileSync("." + path + "index.html"); // 修改响应体
  }
};
module.exports = htmlHistory;
```

routerResponse---统一请求返回体

```js
const option = {
  successCode: 0,
  successMsg: "接口调用成功",
  failCode: -1, //默认的异常码
  failMsg: "接口调用失败", //默认的异常消息
};

function routerResponse(option = {}) {
  return async function (ctx, next) {
    ctx.success = function (data, msg) {
      //接口成功时我们更期望得到接口调用成功后的数据，虽然成功调用后提示消息可能不是很重要，但是有时也需要，所以加上
      ctx.type = option.type || "json";
      ctx.body = {
        rsCode: option.successCode,
        rsCause: msg || option.successMsg,
        data: data || null,
      };
    };

    ctx.fail = function (msg, code) {
      //发生异常时前端期望得到异常信息描述和对应的状态码
      ctx.type = option.type || "json";
      ctx.body = {
        rsCode: code || option.failCode,
        rsCause: msg || option.failMsg,
        data: null,
      };
    };

    await next();
  };
}

module.exports = routerResponse(option);
```

这样处理了之后，在页面里面就可以这样用

```js
ctx.success(users, "获取所有用户成功");
```

或者这样

```js
ctx.fail(err.message);
```

前端拿到的返回体就是

```js
{
    rsCode:xxx,
    rsMessage:xxxx,
    data:xxx
}
```

**注意：以下代码都会用到这个封装的中间件 保证接口返回体统一**

5、最激动的写接口部分😘

登录获取token---login.js
(这里做示例，所以没有接参数，还是要接一下信息的，然后加入到token生成里面)

```js
const Router = require("koa-router");
const jwtToken = require("jsonwebtoken");
const router = new Router({
  prefix: "/login", //基本接口的前缀 前端调用时地址为'/login'  即会和下面的地址拼接
});
router.get("/", async (ctx) => {
  //payload中加入用户唯一信息 例如用户唯一id phoneNumber password等
  const token = jwtToken.sign({ uid: "123" }, process.env.JWT_SECRET, {
    expiresIn: "15d", //设置该token的过期时间
  });
  ctx.success(token, "获取token成功");
});

module.exports = router;
```

文件的上传和下载---file.js

```js
const Router = require("koa-router");
const sendfile = require("koa-sendfile");
const fs = require("fs");
const router = new Router({
  prefix: "/file",
});

// 上传文件
router.post("/upload", async (ctx) => {
  const { filepath, originalFilename } = ctx.request.files.file || {}; // 获取上传文件
  const reader = fs.createReadStream(filepath);
  let filePath = `upload/${Math.random().toString()}-${originalFilename}`; //储存在node服务中的upload文件夹下
  // 创建可写流
  const upStream = fs.createWriteStream(filePath);
  // 可读流通过管道写入可写流
  reader.pipe(upStream);
  const resData = {
    fileUrl: `${process.env.KOA_CORS_ORIGIN}/${filePath}`, //前面那个部分后期可以替换为其他可以访问的前缀 这里本地测试用
  };
  ctx.success(resData, "文件上传成功");
});

// 下载文件
router.get("/download", async (ctx) => {
  console.log("ctx.request.query", ctx.request.query);
  const { fileName } = ctx.request.query;
  const path = `upload/${fileName}`;
  console.log(path);
  ctx.attachment(decodeURI(path)); //url编码 转换容易引起歧义的字符 例如中文字符
  await sendfile(ctx, path); //前端页面需要对文件名进行decodeURIComponent解码 解码后能够拿到真正的名字
  //另外 前端需要从返回体中获取文件名给a标签 从里面的headers的content-disposition中截取获得---》》》 res.headers["content-disposition"]
});

module.exports = router;
```

基本上都会用到的user信息处理

1、我们先建个表，直接用代码建立

src/models/user.js

```js
const { Schema, model } = require("mongoose");

const CompletedSchema = new Schema(
  {
    name: { type: String, required: true },
    sex: { type: Number, enum: [0, 1], required: true },
    phone: { type: String, required: true },
  },
  { collection: "users", versionKey: false, timestamps: true },
);

export const UserForm = model("UserForm", CompletedSchema);
```

如代码所示，表示我们创建了一个名为users的数据表，每一个user喃，他有三个基本信息，分别是姓名，性别和电话，其中呢，name和phone都是字符串，sex只能取0和1，熟悉Typescript的大佬应该感觉很亲切，这不就是枚举嘛，限制只能取这两个值。require表示这个字段需要有值。其他的就不多说啦。mongoose详细的使用可以参考这个大佬写的文章：[你真的了解mongoose吗？ - 掘金 (juejin.cn)](https://juejin.cn/post/6844904054196273159)

2、开始写关于user的接口(作参考，不一定是最好的写法，但运行结果肯定是正确的哈😂)

src/api/user.js

```js
const Router = require("koa-router");
const router = new Router({
  prefix: "/user",
});
import { UserForm } from "../models/user"; //将我们刚刚的表产生的model拿过来,通过他我们实现对数据库的操作。

router.get("/", async (ctx) => {
  let users = await UserForm.find(); //查询表中所有数据
  ctx.success(users, "获取所有用户成功");
});

router.get("/getUserInfo", async (ctx) => {
  const { id } = ctx.params;
  ctx.success(`获取id为${id}的用户`);
});

router.post("/add", async (ctx) => {
  //
  await UserForm.create(ctx.request.body); //向表中插入数据
  ctx.success(ctx.request.body, "用户信息提交成功");
});

router.put("/:id", async (ctx) => {
  const { id } = ctx.params;
  ctx.success(`修改id为${id}的用户`);
});

router.del("/:id", async (ctx) => {
  const { id } = ctx.params;
  ctx.success(`删除id为${id}的用户`);
});

module.exports = router;
```

最后附上我们程序的运行的基石——app.js

```js
const Koa = require("koa");
const mongoose = require("./src/setting/mongoose");
const cors = require("./src/setting/koa2-cors");
const jwt = require("./src/setting/jwt");
const koaBody = require("./src/setting/koa-body");
const koaStatic = require("./src/setting/koa-static");
const htmlHistory = require("./src/setting/html-history");
const routerResponse = require("./src/setting/routerResponse");
const errHandle = require("./src/setting/error-handle");
const app = new Koa();

//api部分
const user = require("./src/api/user");
const login = require("./src/api/login");
const file = require("./src/api/file");

//基础部分
app.use(cors).use(koaBody).use(routerResponse).use(errHandle).use(jwt);
//api部分
app.use(user.routes()).use(login.routes()).use(file.routes());
//静态页面托管
app.use(htmlHistory).use(koaStatic); //因为前端打包的页面文件放在了web文件夹下 前端需要将项目publicPath修改为'/web/' 再打包放入 我这里前端用的是vue-router的history模式
app.listen(9000);
console.log("app started at port 9000...");
```

顺便看看package.json

```js
{
  "name": "nodejs-koa2",
  "version": "0.7.8",
  "description": "nodejs for network",
  "main": "app.js",
  "scripts": {
    "dev": "nodemon scripts/development.js",
    "test": "nodemon scripts/test.js",
    "prod": "nodemon scripts/production.js"
  },
  "devDependencies": {
    "babel-plugin-transform-es2015-modules-commonjs": "^6.26.2",
    "babel-register": "^6.26.0",
    "dotenv": "^16.0.0",
    "jsonwebtoken": "^8.5.1",
    "koa": "^2.13.4",
    "koa-body": "^5.0.0",
    "koa-jwt": "^4.0.3",
    "koa-router": "^10.1.1",
    "koa-sendfile": "^3.0.0",
    "koa-static": "^5.0.0",
    "koa2-cors": "^2.0.6",
    "mongoose": "^6.3.1",
    "nodemon": "^2.0.15",
    "prettier": "^2.6.2"
  }
}
```

至此，完美撒花，感谢你宝贵的几分钟，哈哈哈哈🤗。

哦，对了，最后附上一个项目代码地址，[laoer536/nodejs-koa2: for nodejs network (github.com)](https://github.com/laoer536/nodejs-koa2)。
