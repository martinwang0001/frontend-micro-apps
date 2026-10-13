/**
 * 主应用(portal)Vite 配置
 * ---------------------------------------------------------------
 * 主应用本身不需要 qiankun 插件(它是加载方,不是被加载方)。
 * 关键点:
 *  - 固定端口 8000,子应用注册表中的 entry 都指向各自端口;
 *  - 主应用是基座,负责:应用注册 / 生命周期编排 / 沙箱配置 /
 *    共享实例(store、eventBus)创建与下发 / 全局导航与皮肤。
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8000,
    open: false
  },
  build: {
    target: 'es2015'
  }
})
