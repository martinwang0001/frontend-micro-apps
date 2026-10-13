<template>
  <!-- 报表中心根组件:widgetMode 下隐藏应用内导航(聚合页里只展示内容区) -->
  <div class="report-app">
    <nav v-if="!widgetMode" class="report-nav">
      <span class="report-nav__brand">📈 报表中心 <em>Vue3 + Vite + Pinia</em></span>
      <!-- 子应用内部导航必须用 router-link,不能用 a 标签(会整页刷新跳出微前端) -->
      <router-link to="/">报表</router-link>
      <router-link to="/comm">通信演示</router-link>
      <router-link to="/style">样式演示</router-link>
    </nav>
    <main class="report-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
/**
 * 根组件
 * widgetMode:主应用聚合页通过 loadMicroApp 以 ID 容器挂载本应用时置 true,
 * 此时隐藏子应用自身导航,以"卡片"形态嵌入。
 * 该 prop 由 main.js 在 createApp 时从 qiankun props 透传而来。
 */
defineProps({
  widgetMode: { type: Boolean, default: false }
})
</script>

<style scoped>
/* scoped:编译后为选择器追加 data-v-xxx 属性,天然具备"组件级样式隔离" */
.report-app {
  font-family: 'Segoe UI', 'PingFang SC', sans-serif;
}
.report-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: linear-gradient(90deg, #3b1d75, #6d3fd1);
  border-radius: 8px;
  margin-bottom: 12px;
}
.report-nav__brand {
  color: #fff;
  font-weight: 700;
  margin-right: 12px;
}
.report-nav__brand em {
  font-style: normal;
  font-size: 12px;
  opacity: 0.75;
}
.report-nav a {
  color: #e4dbff;
  text-decoration: none;
  font-size: 14px;
}
.report-nav a.router-link-active {
  color: #fff;
  border-bottom: 2px solid #ffd166;
}
.report-main {
  min-height: 300px;
}
</style>
