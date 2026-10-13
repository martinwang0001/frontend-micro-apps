/**
 * 路由组件(复用)
 * ---------------------------------------------------------------
 * 【为什么抽离】
 * main.jsx 中 widgetMode 用 MemoryRouter,正常模式用 BrowserRouter,
 * 但 <Routes> 本身与路由模式无关,抽成 AppRoutes 避免重复书写,
 * 也便于单元测试时直接 mount 路由树。
 *
 * 【坑点】
 * 1. 使用 <Routes> 而非 <Switch>(React Router v6 移除了 Switch);
 * 2. path="/" 必须加 end,否则 /comm 也会被 Home 匹配(前缀匹配)。
 */
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import CommPage from './pages/CommPage.jsx'
import StylePage from './pages/StylePage.jsx'
import WidgetPage from './pages/WidgetPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/comm" element={<CommPage />} />
      <Route path="/style" element={<StylePage />} />
      <Route path="/widget" element={<WidgetPage />} />
    </Routes>
  )
}
