/**
 * 报表中心子应用 Vite 配置
 * ---------------------------------------------------------------
 * 【qiankun + Vite 的接入要点(与数据看板应用完全同构)】
 * 1. vite-plugin-qiankun:让 Vite 应用暴露 qiankun 约定的 UMD 生命周期入口;
 *    useDevMode: true 使开发模式下也能被 qiankun 以 ES Module 方式加载。
 *    坑点:不开 useDevMode 时,dev 模式下主应用 fetch 到的入口是 ESM,
 *    qiankun 无法执行其中的 import 语句,子应用会静默加载失败。
 * 2. server.origin:开发模式下资源(JS/CSS)默认是相对路径,被子应用加载时
 *    会错误地拼到主应用域名下(如 localhost:8080/src/main.js → 404),
 *    必须显式指定源,保证资源从本应用的 8084 拉取。
 * 3. 跨域头:qiankun 通过 fetch 拉取子应用入口 HTML 与静态资源,必须允许跨域,
 *    否则浏览器直接拦截,控制台报 CORS 错误。
 * 4. base:生产环境部署在独立域名/子路径时,通过环境变量注入,保证可部署性。
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

/** 子应用名称:必须与主应用 registerMicroApps 中的 name 严格一致(坑点:不一致则生命周期注册失败) */
const appName = 'app-vue3-report'

export default defineConfig(({ mode }) => ({
  // 生产环境可通过 VITE_BASE 注入 CDN 前缀(如 https://cdn.xxx.com/app-vue3-report/)
  base: process.env.VITE_BASE || '/',
  plugins: [
    vue(),
    // 关键插件:把入口模块包装成 qiankun 可识别的 { bootstrap, mount, unmount }
    qiankun(appName, { useDevMode: mode === 'development' })
  ],
  server: {
    // 本应用固定端口 8084(package.json 中 dev 脚本 --strictPort 与之对应)
    port: 8084,
    // 子应用独立开发时打开页面也不报错
    open: false,
    // 允许主应用跨域拉取资源(坑点:不配则入口 HTML 被浏览器拦截)
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    // 显式声明源,修复 dev 模式下静态资源路径拼接错误(经典坑点)
    origin: 'http://localhost:8084'
  },
  build: {
    // 与老式浏览器兼容;老项目整合场景常见
    target: 'es2015'
  }
}))
