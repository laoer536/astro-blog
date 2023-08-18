---
external: false
title: "基于scss开发一个scss工具库"
description: "使用fast-scss库来扩展你项目中的sass，提升开发效率。包含默认样式重置，调色板，scss工具函数等模块。文章将探索在项目中使用fast-scss，以及构建一个样式包的发布的代码框架。"
date: "2023-02-16"
---

## 背景

大家好，我是前端老六，这段时间我一直想开发一些有趣的库，比如说什么js工具库啊，但是自己没什么想法，我在想那开源库，那全是什么nodejs，什么底层封装，那太多了，你能想到的，别人可能都做出来了，哈哈哈😆。于是我决定换个方向，样式的库怎么样？嗯。。。现在也不少，比如说什么tailwindcss很火，自己也有用过，但直接写在html好像最后代码看起来有点那啥，最后我在想，还是最初的好，那么整一个样式的库吧，css的使用有语法限制，我自己平时scss用得多，那么就用scss来搞一个，封装一些常用的样式块和函数。

## 开始

- vue3+vite构建项目，用于测试fast-scss包。
- 使用`pnpm workspace` 将我们的fast-scss包作为子package[工作空间（Workspace） | pnpm](https://pnpm.io/zh/workspaces)，外部的vue3项目可以直接下载工作区的包，建立连接，workspace的fast-scss打包代码改动会在项目中生效，这样就不用频繁的发包到npm测试了。
- scss打包，使用`postcss-cli`，并集成`postcss-scss`(识别scss语法)，`autoprefixer`（自动前缀处理），`cssnano`压缩样式代码，`sass-migrator`（规范scss代码风格）。
- 编写打包的打包和发布的的script，发布版本号自动处理使用了`standard-version`。

```js
/* postcss.config.js 用于postcss-cli打包  */
module.exports = {
  syntax: 'postcss-scss',
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('autoprefixer')({ cascade: false }),
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('cssnano')({ preset: 'default' }),
  ],
}
```

```json
/* 编写打包和发布的scripits */
"scripts": {
  "build": "pnpm standard:scss && postcss src --base src --dir dist",
  "standard:scss": "sass-migrator --migrate-deps module src/**/*.scss",
  "release": "pnpm build && standard-version && git push --follow-tags && pnpm publish"
},
```

- 项目代码风格采用eslint+prettier`code-style-lint-vue3-ts`[点击查看](https://github.com/laoer536/code-style-lint/tree/main/packages/code-style-lint-vue3-ts)
- 测试fast-scss代码是否能够正常工作。

```ts
//vite.config.ts
export default defineConfig({
  plugins: [vue(), Pages()],
  base: curEnv.VITE_PUBLIC_PATH,
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "fast-scss" as *;`, //引入fast-scss库
      },
    },
  },
  build: {
    outDir: 'docs',
  },
})
```

```vue
//*.vue
//demo
<style lang="scss">
@use 'sass:map';
/* The following are the shortcuts provided by fast-scss */
p {
  @include more-line-ellipsis(1); /* It works. */
  background-color: get-color($rose, 500, 0.3);
  color: map.get($orange, 600);
}
</style>
```

## fast-scss目前所有功能介绍

1. 全局样式的重置，一旦项目应用了这个库，他会帮你清除浏览器默认样式，并对部分标签在不同浏览器的做了样式统一。
2. 🎨调色板，多风格颜色任你选，还可以为颜色设置透明度，满足更多要求。~~灵感~~(抄)来自tailwindcss。调色板所有支持的颜色可以[点击这里](https://tailwindcss.com/docs/customizing-colors)查看。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f6045561b4fa4e59bf552a277fc96820~tplv-k3u1fbpfcp-watermark.image?) 4. text部分的mixin（不断增加中）5. scss工具函数（不断增加中）

```scss
$namespace: "fast";
/*
 join var name
  join-var-name(('button', 'text-color')) => '--#{namespace}-button-text-color'
 */
@function join-var-name($list) {
  $name: "--" + $namespace;
  @each $item in $list {
    @if $item != "" {
      $name: $name + "-" + $item;
    }
  }
  @return $name;
}

/*
 get-css-var('button', 'text-color') => var(--#{namespace}-button-text-color)
 */
@function get-css-var($args...) {
  @return var(#{join-var-name($args)});
}

/*
 get-css-var-name(('button', 'text-color')) => '--#{namespace}-button-text-color'
 */
@function get-css-var-name($args...) {
  @return join-var-name($args);
}

/*
 @include set-css-var-from-map($colors)
 */
@mixin set-css-var-from-map($map, $prefix: "") {
  @each $key, $value in $map {
    #{get-css-var-name($prefix, $key)}: #{$value};
  }
}
```

6. 其他部分（媒体、布局、高级样式...）正在迭代。

## 结语

编写这个库最终想解决的问题，有的样式代码在项目中我们会经常使用，每次粘贴复制会很麻烦，而且还不一定是标准的写法，我在想可以把标准的常用的样式块集合起来，直接运用于项目，岂不是爽哉哉。恰好scss提供了mixin和函数，样式代码的灵活度将进一步提高。scss还有更多强大的功能，期待后续能基于它，来用`fast-scss`创造出更多的生产力。期待小伙伴们来一起共建。

部分灵感感谢：[tailwindcss](https://tailwindcss.com/docs/installation)、[云游君](https://github.com/YunYouJun)

源码：[`fast-scss`](https://github.com/laoer536/fast-scss)

（job&other）联系我：laoer536@163.com
