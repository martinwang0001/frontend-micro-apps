/**
 * 主应用入口
 * ---------------------------------------------------------------
 * 启动顺序(坑点):
 *  1. 先挂载基座 Vue 应用 —— 确保 #subapp-viewport 等容器已存在于文档中;
 *  2. 再 setupMicroApps —— registerMicroApps + start,
 *     若顺序颠倒,qiankun 激活子应用时可能找不到容器而报错。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { setupMicroApps } from './micro/setup'
import { useGlobalStore } from './store/global'
import './styles/index.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

// 基座 Pinia 与共享 Store 建立单向镜像同步
useGlobalStore().bindShared()

// 基座就绪后启动微前端运行时
setupMicroApps()
