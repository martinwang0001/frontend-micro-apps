/**
 * 监控告警子应用(Svelte)Vite 配置
 * ---------------------------------------------------------------
 * 【qiankun + Vite 的接入要点】(与 app-vue3-dashboard 同构)
 * 1. vite-plugin-qiankun:让 Vite 应用暴露 qiankun 约定的 UMD 生命周期入口;
 *    useDevMode: true 使开发模式下也能被 qiankun 以 ES Module 方式加载。
 * 2. server.origin:开发模式下资源(JS/CSS)默认是相对路径,被主应用加载时
 *    会错误地拼到主应用域名下,必须显式指定源,保证资源从 8087 拉取。
 * 3. 跨域头:qiankun 通过 fetch 拉取子应用入口 HTML 与静态资源,必须允许跨域。
 * 4. base:生产环境部署在独立域名/子路径时,通过环境变量注入,保证可部署性。
 *
 * 【Svelte 特有坑点】
 * - 必须使用 @sveltejs/vite-plugin-svelte 编译 .svelte 文件;
 * - Svelte 组件样式默认编译期 scoped(自动追加 svelte-xxx 哈希类),
 *   与 qiankun 的 experimentalStyleIsolation 形成"编译期 + 运行时"双层防护。
 */
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import qiankun from 'vite-plugin-qiankun'

/** 子应用名称:必须与主应用 registerMicroApps 中的 name 严格一致 */
const appName = 'app-svelte-monitor'

export default defineConfig(({ mode }) => ({
  // 生产环境可通过 VITE_BASE 注入 CDN 前缀(如 https://cdn.xxx.com/app-svelte-monitor/)
  base: process.env.VITE_BASE || '/',
  plugins: [
    // Svelte 编译插件:负责模板编译、样式 scoped 处理
    svelte(),
    // 关键插件:把入口模块包装成 qiankun 可识别的 { bootstrap, mount, unmount }
    qiankun(appName, { useDevMode: mode === 'development' })
  ],
  server: {
    port: 8087,
    // 子应用独立开发时打开页面也不报错
    open: false,
    // 允许主应用跨域拉取资源(坑点:不配则入口 HTML 被浏览器拦截)
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    // 显式声明源,修复 dev 模式下静态资源路径拼接错误(经典坑点)
    origin: 'http://localhost:8087'
  },
  build: {
    // 与老式浏览器兼容;老项目整合场景常见
    target: 'es2015'
  }
}))
