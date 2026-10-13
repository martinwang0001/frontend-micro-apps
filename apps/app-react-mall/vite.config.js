/**
 * 积分商城子应用 Vite 配置(React 版)
 * ---------------------------------------------------------------
 * 【qiankun + Vite 的接入要点(与 Vue3 子应用完全同构)】
 * 1. vite-plugin-qiankun:把入口模块包装成 qiankun 约定的 UMD 生命周期
 *    { bootstrap, mount, unmount };useDevMode: true 使开发模式下也能被
 *    主应用以 ES Module 方式加载(否则 dev 时 qiankun 拉取入口会失败)。
 * 2. server.origin:开发模式下 Vite 产出的资源路径默认是相对路径,
 *    被主应用加载时会错误地拼到主应用域名下,必须显式指定源,
 *    保证 JS/CSS/图片都从 8085 拉取(经典坑点)。
 * 3. cors + headers:qiankun 通过 fetch 拉取子应用入口 HTML 与静态资源,
 *    不允许跨域则入口 HTML 直接被浏览器拦截。
 * 4. strictPort:端口被占用时直接报错退出,避免悄悄换端口导致主应用
 *    registerMicroApps 中配置的 entry 失效而难以排查。
 * 5. base:生产环境部署到 CDN / 子路径时通过 VITE_BASE 注入,保证可部署性。
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import qiankun from 'vite-plugin-qiankun'

/** 子应用名称:必须与主应用 registerMicroApps 中的 name 严格一致 */
const appName = 'app-react-mall'

export default defineConfig({
  // 生产环境可通过 VITE_BASE 注入 CDN 前缀(如 https://cdn.xxx.com/app-react-mall/)
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    // 关键插件:让本应用暴露 qiankun 可识别的生命周期钩子
    qiankun(appName, { useDevMode: true })
  ],
  server: {
    port: 8085,
    // 端口占用即失败,不自动顺延(坑点:顺延会导致主应用 entry 指向失效端口)
    strictPort: true,
    // 允许主应用跨域拉取资源
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    // 显式声明源,修复 dev 模式下静态资源路径拼接错误(经典坑点)
    origin: 'http://localhost:8085',
    /**
     * 【关键坑点修复 —— React + qiankun + Vite 三方整合】
     * @vitejs/plugin-react 在 dev 下会向 index.html 注入一段内联 module script:
     *   import { injectIntoGlobalHook } from "/@react-refresh"; ...
     * 问题 1:裸路径 "/@react-refresh" 相对「当前站点源」解析 —— 被主应用加载时
     *         指向主应用源(8000)而非本应用,404 返回 HTML,执行报
     *         SyntaxError: Unexpected token '<';
     * 问题 2:qiankun 的 import-html-entry 以 eval 方式执行内联脚本,
     *         ESM import 语句在 eval 上下文报 SyntaxError: Cannot use import
     *         statement outside a module;
     * 问题 3:前导脚本失败导致 window.$RefreshSig$ 缺失,插件运行时再抛
     *         "can't detect preamble" 错误,整条 bootstrap 链崩溃。
     * 解法:plugin-react 内部判定 `hmr === false` 时 skipFastRefresh,
     *       前导脚本与模块刷新包装双双不再注入,一劳永逸。
     * 代价:本应用 dev 无热更新(保存后整页刷新),对微前端子应用是可接受取舍。
     */
    hmr: false
  },
  build: {
    // 与老式浏览器兼容;老项目整合场景常见
    target: 'es2015'
  }
})
