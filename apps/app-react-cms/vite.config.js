/**
 * 内容管理子应用 Vite 配置(React 版)
 * ---------------------------------------------------------------
 * 【qiankun + Vite 的接入要点(与商城子应用同构)】
 * 1. vite-plugin-qiankun:把入口模块包装成 qiankun 约定的 UMD 生命周期
 *    { bootstrap, mount, unmount };useDevMode: true 使开发模式下也能被
 *    主应用以 ES Module 方式加载。
 * 2. server.origin:dev 模式下资源路径默认相对,被主应用加载时会错误地
 *    拼到主应用域名下,必须显式指定源,保证资源从 8086 拉取(经典坑点)。
 * 3. cors + headers:qiankun 通过 fetch 拉取入口 HTML 与静态资源,必须允许跨域。
 * 4. strictPort:端口占用即报错退出,避免悄悄换端口导致主应用 entry 失效。
 * 5. 本应用被主应用以 strictStyleIsolation(Shadow DOM)挂载(见 StylePage),
 *    该配置在"主应用侧",此处无需也无法声明。
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import qiankun from 'vite-plugin-qiankun'

/** 子应用名称:必须与主应用 registerMicroApps 中的 name 严格一致 */
const appName = 'app-react-cms'

export default defineConfig({
  // 生产环境可通过 VITE_BASE 注入 CDN 前缀
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    // 关键插件:让本应用暴露 qiankun 可识别的生命周期钩子
    qiankun(appName, { useDevMode: true })
  ],
  server: {
    port: 8086,
    // 端口占用即失败,不自动顺延
    strictPort: true,
    // 允许主应用跨域拉取资源
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    // 显式声明源,修复 dev 模式下静态资源路径拼接错误(经典坑点)
    origin: 'http://localhost:8086',
    /**
     * 【关键坑点修复 —— React + qiankun + Vite 三方整合】
     * plugin-react 在 dev 下注入的内联 react-refresh 前导脚本含裸路径
     * "/@react-refresh" 与 ESM import,被 qiankun 加载时会 404 + eval 报
     * SyntaxError,导致 bootstrap 崩溃。plugin-react 内部在 hmr === false 时
     * skipFastRefresh(前导脚本与刷新包装均不注入),故关闭 hmr 一劳永逸。
     * 代价:本应用 dev 无热更新(保存后整页刷新)。
     */
    hmr: false
  },
  build: {
    // 与老式浏览器兼容;老项目整合场景常见
    target: 'es2015'
  }
})
