<template>
  <!-- 订单管理根组件(Vue2 老项目)
       * 根类名 .order-app 同时承担三个职责:
       * 1. 作为本应用 CSS 变量的挂载点(见 styles/index.css,避免挂 :root 污染全局);
       * 2. 配合 qiankun experimentalStyleIsolation 生成属性前缀作用域;
       * 3. 作为 scoped 之外的全局样式兜底命名空间。 -->
  <div class="order-app">
    <!-- 应用内导航:品牌区明确标注"Vue2 老项目",便于在整合演示中辨认技术栈 -->
    <nav class="order-nav">
      <span class="order-nav__brand">📦 订单管理 <em>Vue2 老项目</em></span>
      <!-- 坑点:子应用内部导航必须用 router-link,不能用 a 标签
           *(a 标签会触发整页刷新,直接跳出微前端容器,路由态全部丢失) -->
      <!-- 首页:订单列表(含 Vue2 filters 演示) -->
      <router-link to="/">订单列表</router-link>
      <!-- 通信演示:共享 Store / GlobalState / 事件总线 -->
      <router-link to="/comm">通信演示</router-link>
      <!-- 样式演示:BEM 前缀 + scoped + 沙箱双重防护 -->
      <router-link to="/style">样式演示</router-link>
    </nav>
    <!-- 路由出口:三个页面(订单列表 / 通信演示 / 样式演示)在此渲染 -->
    <main class="order-main">
      <router-view />
    </main>
  </div>
</template>

<script>
/**
 * 根组件(Options API)
 * ---------------------------------------------------------------
 * Vue2.7 老项目一律使用 Options API 编写,保持与存量代码风格一致;
 * 这里不放任何业务逻辑,只负责导航骨架与路由出口。
 * 注意:Vue2 的组件 name 选项在 keep-alive / 递归组件中有实际作用,建议保留。
 *
 * 【与 Vue3 示例应用的差异】
 *   - 没有 defineProps / <script setup>,Options API 一个 export default 搞定;
 *   - 根实例由 main.js 以 new Vue({ router, render: h => h(App) }) 创建,
 *     本组件无需感知 qiankun,挂载细节全部收敛在入口文件;
 *   - 老项目若已接入 Vuex 可原样保留 store 选项;
 *     本演示为突出"共享 store"通信机制,未引入 Vuex。
 */
export default {
  name: 'OrderApp'
}
</script>

<style scoped>
/* scoped:编译后为选择器追加 data-v-xxx 属性,天然具备"组件级样式隔离" */
/* 注意:scoped 只防"本组件泄漏",防不了"别家污染本组件" */
/* 因此 BEM 前缀(order-)与沙箱两道防线缺一不可(见样式演示页) */
/* 根容器:只设字体等基础属性,不写全局选择器 */
.order-app {
  font-family: 'Segoe UI', 'PingFang SC', sans-serif;
}
/* 导航条:深色渐变底,与应用主题色一致 */
/* 兼容提示:gap 是 flex 布局的较新语法,若需兼容老式浏览器可回退为 margin 方案 */
.order-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: linear-gradient(90deg, #5c3d12, #b07d2b);
  border-radius: 8px;
  margin-bottom: 12px;
}
/* 品牌区文字 */
.order-nav__brand {
  color: #fff;
  font-weight: 700;
  margin-right: 12px;
}
/* 品牌区的技术栈标注("Vue2 老项目") */
.order-nav__brand em {
  font-style: normal;
  font-size: 12px;
  opacity: 0.75;
}
/* 导航链接默认色 */
.order-nav a {
  color: #f5e6c8;
  text-decoration: none;
  font-size: 14px;
}
/* 当前路由高亮:router-link 自动追加 router-link-active 类 */
.order-nav a.router-link-active {
  color: #fff;
  border-bottom: 2px solid #ffd166;
}
/* 内容区:给个最小高度,避免切换页面时容器高度剧烈跳动 */
.order-main {
  min-height: 300px;
}
</style>
