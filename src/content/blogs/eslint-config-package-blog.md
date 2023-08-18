---
external: false
title: "通过引入eslint-config包的方式解决项目代码风格和规范"
description: "背景 大家好，我是前端老六。今天想提及一下项目代码规范这一块，平时我们在搭建一个前端项目的时候，项目代码规范是我们要考虑的，在如今多人开发一个项目的时候那更是不能疏忽。我们今天用引入包的方式来解决。"
date: "2023-02-17"
---

## 背景

大家好，我是前端老六。今天想提及一下项目代码规范这一块，平时我们在搭建一个前端项目的时候，项目代码规范是我们要考虑的，在如今多人开发一个项目的时候那更是不能疏忽。对于前端来说呢，我们常用的就是eslint+prettier，两者集成的方式，eslint负责监测我们的语法错误，而prettier对我们的代码风格进行规范。

## ESlint

ESLint 是一个开源的 JavaScript 代码检查工具，由 Nicholas C. Zakas 于2013年6月创建。代码检查是一种静态的分析，常用于寻找有问题的模式或者代码，并且不依赖于具体的编码风格。对大多数编程语言来说都会有代码检查，一般来说编译程序会内置检查工具。

JavaScript 是一个动态的弱类型语言，在开发中比较容易出错。因为没有编译程序，为了寻找 JavaScript 代码错误通常需要在执行过程中不断调试。像 ESLint 这样的可以让程序员在编码的过程中发现问题而不是在执行的过程中。

Lint工具经历了JSLint、JSHint，最后是ESLint，ESLint 号称下一代的 JS Linter 工具，它的灵感来源于 PHP Linter，将源代码解析成 AST，然后检测 AST 来判断代码是否符合规则。ESLint 使用 esprima 将源代码解析吃成 AST，然后你就可以使用任意规则来检测 AST 是否符合预期，这也是 ESLint 高可扩展性的原因。

ES6 发布后，因为新增了很多语法，JSHint 短期内无法提供支持，而 ESLint 只需要有合适的解析器就能够进行 lint 检查。这时 babel 为 ESLint 提供了支持，开发了 babel-eslint，让ESLint 成为最快支持 ES6 语法的 lint 工具。

## ESlint可以做些什么

### 1. 避免低级bug，找出可能发生的语法错误

> 使用未声明变量、修改 const 变量……

### 2. 提示删除多余的代码

> 声明而未使用的变量、重复的 case ……

### 3. 确保代码遵循最佳实践

> 可参考 [airbnb style](https://link.zhihu.com/?target=https%3A//github.com/airbnb/javascript)、[javascript standard](https://link.zhihu.com/?target=https%3A//github.com/standard/standard)

### 4. 统一团队的代码风格

> 加不加分号？使用 tab 还是空格？

## Prettier

prettier是一款强势武断的代码格式化工具，它几乎移除了编辑器本身所有的对代码的操作格式，然后重新显示。就是为了让所有用这套规则的人有完全相同的代码。在团队协作开发的时候更是体现出它的优势。与eslint，tslint等各种格式化工具不同的是，prettier只关心代码格式化，而不关心语法问题。
prettier 的优势也很明显，它支持

- JavaScript （包括实验性功能）
- [JSX](https://facebook.github.io/jsx/)
- [Angular](https://angular.io/)
- [Vue](https://vuejs.org/)
- [Flow](https://flow.org/)
- [TypeScript](https://www.typescriptlang.org/)
- CSS、[Less](http://lesscss.org/) 和 [SCSS](https://sass-lang.com/)
- [HTML](https://en.wikipedia.org/wiki/HTML)
- [JSON](https://json.org/)
- [GraphQL](https://graphql.org/)
- [Markdown](https://commonmark.org/)，包括 [GFM](https://github.github.com/gfm/) 和 [MDX](https://mdxjs.com/)
- [YAML](https://yaml.org/)

不少编辑器内置了prettier插件支持，可以启用在保存时自动格式化代码风格，例如，如果你用的是Webstorm，在项目下载了prettier的情况下可以这样这样设置一下

![eslint-hghgj.webp](https://s2.loli.net/2023/08/18/YC4IlGXpw6K2Pt1.webp)

使用Prettier在code review时不需要再讨论代码样式，节省了时间与精力。

## 搭配干活，快乐加倍

就如上述一样，基于eslint和prettier的各自特性，不少人就想那么把他们两个集合起来，快乐就加倍了，刚好就是一个负责监测语法，一个负责规范风格，一个是灵魂，一个是形体，嗯...绝妙！Nice\*1000...

## 随之而出现的问题

查阅ESlint文档以及平时所做的项目我们知道ESlint很多规则是需要在项目根目录创建配置文件来配置的，例如`.eslintrc`文件。我们需要在里面加入我们的配置规则，例如我这里有一个vue3+typescript，我需要配置规则来适配我们的项目

```json
{
  "extends": ["eslint:recommended", "plugin:vue/vue3-essential", "plugin:@typescript-eslint/recommended"],
  "overrides": [],
  "parser": "vue-eslint-parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "parser": "@typescript-eslint/parser"
  },
  "plugins": ["vue", "@typescript-eslint"],
  "rules": {}
}
```

prettier可以通过添加配置文件，来更改默认的prettier格式化代码的规则，就是说如果你使用prettier的默认规则，那么你不需要在根目录下创建配置文件，这里我是需要的，于是创建一个`.prettierrc`文件

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 120,
  "htmlWhitespaceSensitivity": "ignore",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

接下来我们需要把prettier集成进去，让eslint也能提示代码中不符合prettier的格式错误。这里需要安装两个插件。

- [eslint-plugin-prettier](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fprettier%2Feslint-plugin-prettier "https://github.com/prettier/eslint-plugin-prettier")： 基于 prettier 代码风格的 eslint 规则，即eslint使用pretter规则来格式化代码。
- [eslint-config-prettier](https://link.juejin.cn?target=https%3A%2F%2Fgithub.com%2Fprettier%2Feslint-config-prettier "https://github.com/prettier/eslint-config-prettier")： 禁用所有与格式相关的 eslint 规则，解决 prettier 与 eslint 规则冲突，**确保将其放在 extends 队列最后，这样它将覆盖其他配置**

```json
{
    "extends": [
        "eslint:recommended",
        "plugin:vue/vue3-essential",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended"  /*新增，必须放在最后面 */
    ],
    "overrides": [],
    "parser": "vue-eslint-parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "parser": "@typescript-eslint/parser",
    },
    "plugins": ["vue", "@typescript-eslint"],
    "rules": {},
};
```

大功告成，最后安装这些配置要用到的所有依赖，如下

```json
{
  "@typescript-eslint/eslint-plugin": "^5.50.0",
  "@typescript-eslint/parser": "^5.50.0",
  "eslint-plugin-vue": "^9.9.0",
  "eslint-config-prettier": "^8.6.0",
  "eslint-plugin-prettier": "^4.2.1",
  "eslint": "^8.33.0",
  "prettier": "^2.8.3"
}
```

这样之后一个支持vue3-ts的eslint+prettier集成就在你的项目中生效了，接下来就是愉快的敲代码了。

## 引发的思考

如果说我们每次开始配置一个项目的ESlint+prettier都这样操作是不是太麻烦了，又要创建配置文件配置好多，还要下载依赖，少了一个都要出问题，还要去翻之前是怎么配的，总之来说就是太麻烦了，像我这种记忆力又不好动作还慢的人来说，那不是光一个配置搞半天。嗯...不行，我身体上心理上都接受不了，难受。当时一时没有想到好的解决办法，这个问题就搁置了好久。

## 转机

在普通上班族的一天，这天公司技术leader让我研究一下nuxt3，把之前那套nuxt2的项目基础架构升级到nuxt3，以后的新项目用nuxt3写。那天我搞着搞着，渐渐的来到了Eslint的脚下，我发现好像我不会配它，之前都是vue3的插件和规则，这次来个核弹。于是我打开我的github找找解决方案，慌忙的寻找，直到我看到了一块神奇的代码

![eslint-ajshdja.webp](https://s2.loli.net/2023/08/18/PwQAqndhOCMUH4D.webp)

我在想，nuxt3项目可以这么方便去配置吗？

后来我去看了这个库的[源码](https://github.com/nuxt/eslint-config)，恍然大悟，原来配置项包括插件都是可以打成包分享的，那么我灵机一动，目前有那么多类型的前端项目，js的vue3、react、nuxt3等，ts的vue3、react、nuxt3等。github有没有一站式把所有基础eslint+prettier对应的各种各种项目的都配置好的库呢，几经寻找，我看到了这个库，`code-style-lint`，他把各种类型项目的eslint+prettier已经集成了，可以直接简便的在项目中运用，并且不影响你在项目中覆盖这个库原来的配置和扩展其他规则，在使用了过后，我的vue3+ts项目的eslint配置文件简化成了这样

```json
{
  "env": {
  "browser": true,
      "es2021": true,
      "node": true
},
  "extends": [
  "./.eslintrc-auto-import.json", /* vite-plugin-autoImport 插件的eslint规则 */
  "code-style-lint-vue3-ts"
],
    "rules": {
  "vue/multi-word-component-names": "off"
}
}
```

另外我也不用下载那么多的配置需要用到的依赖项了，

```json
{
  "@typescript-eslint/eslint-plugin": "^5.50.0",
  "@typescript-eslint/parser": "^5.50.0",
  "eslint-plugin-vue": "^9.9.0",
  "eslint-config-prettier": "^8.6.0",
  "eslint-plugin-prettier": "^4.2.1",
  "eslint": "^8.33.0",
  "prettier": "^2.8.3"
}
```

变成了，

```json
{
  "eslint-config-code-style-lint-vue3-ts": "^3.0.5",
  "eslint": "^8.33.0",
  "prettier": "^2.8.3"
}
```

## 结语

平时大家在做项目的时候项目配置这里会遇到一些问题，eslint+prettier又是比较常规常用的方案，希望这篇文章能够解决你的部分问题。感谢你的几分钟哟！Day day up ! QQQQQQ

提到的库：[`code-style-lint`](https://github.com/laoer536/code-style-lint), [`nuxt-eslint`](https://github.com/nuxt/eslint-config)

参考文章：[vue3+ts+vite项目中使用eslint+prettier+stylelint+husky指南 - 掘金 (juejin.cn)](https://juejin.cn/post/7118294114734440455)
