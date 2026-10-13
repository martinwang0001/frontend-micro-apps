/**
 * 路由表
 * ---------------------------------------------------------------
 * 注意:不要在模块顶层创建 router 实例 —— 微应用会反复 mount/unmount,
 * router 必须在每次 mount 时新建(见 main.js),这里只导出路由配置。
 */
import HomeView from '../views/HomeView.vue'
import CommView from '../views/CommView.vue'
import StyleView from '../views/StyleView.vue'

export default [
  // 业务首页:用户列表
  { path: '/', name: 'home', component: HomeView },
  // 跨应用通信演示
  { path: '/comm', name: 'comm', component: CommView },
  // 样式隔离演示
  { path: '/style', name: 'style', component: StyleView }
]
