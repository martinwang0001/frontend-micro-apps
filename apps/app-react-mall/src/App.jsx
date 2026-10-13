/**
 * 积分商城根组件
 * ---------------------------------------------------------------
 * 【职责】
 * 1. 渲染应用内导航(widgetMode 下隐藏:聚合页里只展示内容区);
 * 2. 声明子路由:/ 商品列表、/comm 通信演示、/style 样式隔离演示。
 *
 * 【坑点】
 * 1. 子应用内部导航必须用 <Link>/<NavLink>,不能用 <a href>,
 *    后者会整页刷新、跳出微前端容器,共享状态全部丢失;
 * 2. 样式方案:本应用一律使用 CSS Modules(*.module.css),
 *    类名经编译期哈希,天然具备组件级隔离(见 StylePage 演示);
 * 3. NavLink 的 active 类名要通过 className 函数拼哈希类名,
 *    不能写死字符串 'active'(已被 CSS Modules 哈希化)。
 */
import { Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import CommPage from './pages/CommPage.jsx'
import StylePage from './pages/StylePage.jsx'
import styles from './App.module.css'

/**
 * @param {{ widgetMode: boolean }} props
 * widgetMode:主应用聚合页以 ID 容器挂载本应用时置 true,隐藏自身导航
 */
export default function App({ widgetMode }) {
  return (
    <div className={styles.mallApp}>
      {/* widgetMode:嵌入主应用聚合页时不渲染导航,避免与主应用导航重复 */}
      {!widgetMode && (
        <nav className={styles.nav}>
          <span className={styles.brand}>
            🛍️ 积分商城 <em>React 18 + Vite</em>
          </span>
          {/* NavLink 命中当前路由时给 isActive,用于拼接高亮哈希类名 */}
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}>
            商品
          </NavLink>
          <NavLink to="/comm" className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}>
            通信演示
          </NavLink>
          <NavLink to="/style" className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}>
            样式演示
          </NavLink>
        </nav>
      )}
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/comm" element={<CommPage />} />
          <Route path="/style" element={<StylePage />} />
        </Routes>
      </main>
    </div>
  )
}
