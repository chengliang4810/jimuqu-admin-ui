## 置顶说明

当前分支只适配**后端v6版本** v5版本前往[gitee地址](https://gitee.com/dapppp/ruoyi-plus-vben5)

当前并没有release 底层可能大改 不要用于实际项目

最低需要使用`node版本>22`

## 简介

基于 [vben5.7版本](https://github.com/vbenjs/vue-vben-admin)重构 使用[antdv-next](https://www.antdv-next.cn/index-cn)作为基础组件库

对应后端项目:

分布式 [RuoYi-Vue-Plus](https://gitee.com/dromara/RuoYi-Vue-Plus/tree/6.X/)

微服务 [RuoYi-Cloud-Plus](https://gitee.com/dromara/RuoYi-Cloud-Plus/tree/6.X/)

## 预览

admin 账号: admin admin123

[预览地址点这里](http://vben5.dapdap.top)

## 重构部分

- 由`monorepo`改为单仓 注意安装依赖需要`-w`参数
- 原`packages`已经拆分到src下
- 移除`shadcn`等headless组件库 使用`antdv-next`/适配器重构
- 重构原`designToken`生成逻辑 改为由`antdv-next`派生
- 偏好设置功能做精简 主题只保留一个(light dark支持)
- 原oxc部分改回来`eslint+prettier` oxc还不稳定
- 移除`vaditor`(markdown编辑) 会加载到首屏资源占用
- 移除`codemirror`(代码块着色) 只是代码生成预览会用到 同样占用资源
- 移除`useVbenForm` 使用原生代替
- 移除`useVbenVxeGrid` 使用原生vxe代替 表格搜索表单也改为原生
- 移除二次封装的`echarts`

## 提升

- 安装依赖(pnpm i)速度提升 由于移除很多依赖 现在安装依赖部分只需要原来50%时间
- 构建速度提升 改为纯vite构建 自测原24S 现8S内
- 首屏加载速度提升 在gzip场景下 首屏只需要加载1.1M资源 目前8M带宽服务器 首屏1.2S

## 待办

- modal/drawer bugfix
- 夜间模式适配(颜色不正常)
- menu除侧边模式 其他模式的支持

## 浏览器支持(dist)

由于使用了`tailwind v4` 只支持较新的浏览器

| 浏览器          | 最低版本要求                           |
| --------------- | -------------------------------------- |
| Google Chrome   | 111 (2023年3月发布)                    |
| Mozilla Firefox | 128 (2024年7月发布)                    |
| Apple Safari    | 16.4 (2023年3月发布)                   |
| Microsoft Edge  | 111 (基于Chromium，与Chrome版本号同步) |
