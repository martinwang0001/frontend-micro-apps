<template>
  <!-- 数据看板根组件:widgetMode 下隐藏应用内导航(聚合页里只展示内容区) -->
  <div class="dash-app">
    <nav v-if="!widgetMode" class="dash-nav">
      <span class="dash-nav__brand">📊 数据看板 <em>Vue3 + Vite</em></span>
      <!-- 子应用内部导航必须用 router-link,不能用 a 标签(会整页刷新跳出微前端) -->
      <router-link to="/">看板</router-link>
      <router-link to="/comm">通信演示</router-link>
      <router-link to="/style">样式演示</router-link>
    </nav>
    <main class="dash-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
/**
 * 根组件
 * widgetMode:主应用聚合页通过 loadMicroApp 以 ID 容器挂载本应用时置 true,
 * 此时隐藏子应用自身导航,以"卡片"形态嵌入。
 */
defineProps({
  widgetMode: { type: Boolean, default: false }
})
</script>

<style scoped>
/* scoped:编译后为选择器追加 data-v-xxx 属性,天然具备"组件级样式隔离" */
.dash-app {
  font-family: 'Segoe UI', 'PingFang SC', sans-serif;
}
.dash-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: linear-gradient(90deg, #0f3057, #1b5e8f);
  border-radius: 8px;
  margin-bottom: 12px;
}
.dash-nav__brand {
  color: #fff;
  font-weight: 700;
  margin-right: 12px;
}
.dash-nav__brand em {
  font-style: normal;
  font-size: 12px;
  opacity: 0.75;
}
.dash-nav a {
  color: #cfe8ff;
  text-decoration: none;
  font-size: 14px;
}
.dash-nav a.router-link-active {
  color: #fff;
  border-bottom: 2px solid #ffd166;
}
.dash-main {
  min-height: 300px;
}
</style>
