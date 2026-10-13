/**
 * 主应用路由表
 * ---------------------------------------------------------------
 * 基座自身页面:首页 / 聚合页 / 通信实验室 / 样式实验室;
 * 其余以 app- 开头的路径统一交给 SubappView(qiankun 容器页)。
 *
 * 【坑点】子应用内部跳转(如 /app-vue3-dashboard/comm)URL 会变化,
 * 基座路由必须能匹配到容器页,否则页面空白。这里用正则参数一次匹配全部。
 */
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WidgetHubView from '../views/WidgetHubView.vue'
import CommLabView from '../views/CommLabView.vue'
import StyleLabView from '../views/StyleLabView.vue'
import SubappView from '../views/SubappView.vue'

export const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: '架构总览' } },
    { path: '/hub', name: 'hub', component: WidgetHubView, meta: { title: '聚合页(ID 容器挂载)' } },
    { path: '/comm', name: 'comm', component: CommLabView, meta: { title: '通信实验室' } },
    { path: '/style', name: 'style', component: StyleLabView, meta: { title: '样式隔离实验室' } },
    // 微应用容器路由:匹配 /app-xxx 及其任意子路径(子应用内跳转自洽)
    {
      path: '/:appName(app-[a-z0-9-]+)/:subPath(.*)?',
      name: 'subapp',
      component: SubappView,
      meta: { title: '微应用' }
    }
  ]
})
