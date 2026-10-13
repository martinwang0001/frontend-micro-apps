/**
 * 内容管理根组件
 * ---------------------------------------------------------------
 * 【职责】
 * 1. 渲染应用内导航(widgetMode 下隐藏:聚合页里只展示内容区);
 * 2. children 是 <AppRoutes />;BrowserRouter/MemoryRouter 在 main.jsx 中
 *    根据 widgetMode 选择并包裹整个 App(本组件内的 NavLink 依赖 Router 上下文)。
 *
 * 【坑点】
 * 1. 子应用内部导航必须使用 react-router 的 <NavLink>,不能用原生 <a href>,
 *    后者会整页刷新、跳出微前端容器,共享状态全部丢失;
 * 2. 本应用被主应用以 strictStyleIsolation(Shadow DOM)挂载,
 *    样式上 Shadow DOM 已天然隔离,但 JS 仍受 qiankun proxy 沙箱管控,
 *    不会因为 Shadow DOM 就放松对 window/document 的误操作警惕;
 * 3. 本应用也用 CSS Modules 做主要样式方案,与 Shadow DOM 隔离是"双层防护"。
 */
import { NavLink } from 'react-router-dom'
import styles from './App.module.css'

/**
 * @param {{ widgetMode: boolean, children: React.ReactNode }} props
 */
export default function App({ widgetMode, children }) {
  return (
    <div className={styles.cmsApp}>
      {/* widgetMode:嵌入主应用聚合页时不渲染导航,避免与主应用导航重复 */}
      {!widgetMode && (
        <nav className={styles.nav}>
          <span className={styles.brand}>
            📝 内容管理 <em>React 18 + Vite</em>
          </span>
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}>
            文章
          </NavLink>
          <NavLink to="/comm" className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}>
            通信演示
          </NavLink>
          <NavLink to="/style" className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}>
            样式演示
          </NavLink>
          <NavLink to="/widget" className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}>
            Widget
          </NavLink>
        </nav>
      )}
      <main className={styles.main}>{children}</main>
    </div>
  )
}
