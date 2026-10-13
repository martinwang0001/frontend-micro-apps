/**
 * 路由表
 * ---------------------------------------------------------------
 * 注意:不要在模块顶层创建 router 实例 —— 微应用会反复 mount/unmount,
 * router 必须在每次 mount 时新建(见 main.js),这里只导出路由配置。
 * 否则上一次挂载的路由状态(history 栈、监听器)会泄漏到下一次挂载。
 */
import HomeView from '../views/HomeView.vue'
import CommView from '../views/CommView.vue'
import StyleView from '../views/StyleView.vue'
import WidgetView from '../views/WidgetView.vue'

export default [
  // 业务首页:报表中心(报表列表 + 生成报表 + 本地/共享状态对比)
  { path: '/', name: 'home', component: HomeView },
  // 跨应用通信演示
  { path: '/comm', name: 'comm', component: CommView },
  // 样式隔离演示
  { path: '/style', name: 'style', component: StyleView },
  // Widget 模式页:被主应用聚合页以 ID 容器方式挂载时展示(memory 路由直达)
  { path: '/widget', name: 'widget', component: WidgetView }
]
