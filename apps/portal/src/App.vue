<template>
  <!-- 基座布局:侧边导航 + 顶栏 + 内容区(基座页面与子应用容器) -->
  <div class="pf-shell">
    <!-- 侧边导航:菜单由注册表派生,新增应用自动出现 -->
    <aside class="pf-sidebar">
      <div class="pf-sidebar__logo">🧩 微前端整合平台</div>

      <div class="pf-sidebar__group">基座功能</div>
      <router-link to="/">🏠 架构总览</router-link>
      <router-link to="/hub">🧱 聚合页(Widget)</router-link>
      <router-link to="/comm">📡 通信实验室</router-link>
      <router-link to="/style">🎨 样式隔离实验室</router-link>

      <div class="pf-sidebar__group">微应用(路由挂载)</div>
      <router-link
        v-for="app in microApps"
        :key="app.name"
        :to="app.activeRule"
      >
        <span>{{ app.title }}</span>
        <span class="pf-sidebar__tech">{{ shortTech(app.tech) }}</span>
      </router-link>
    </aside>

    <div class="pf-body">
      <!-- 顶栏:全局主题切换 / 消息中心 / 当前用户(均来自共享 Store) -->
      <header class="pf-header">
        <span class="pf-header__title">{{ route.meta.title || '微前端平台' }}</span>
        <span class="pf-header__spacer"></span>

        <!-- 主题切换:写共享 Store + qiankun GlobalState,双通道同步 -->
        <button class="pf-btn" @click="toggleTheme">
          {{ sharedState.theme === 'light' ? '🌙 暗色' : '☀️ 亮色' }}
        </button>

        <!-- 消息中心入口(数量来自共享 Store messages) -->
        <span class="pf-header__badge" title="消息中心" @click="clearMessages">
          🔔
          <i v-if="sharedState.messages.length" class="pf-header__count">
            {{ sharedState.messages.length }}
          </i>
        </span>

        <!-- 购物车角标(React 商城加购后这里同步) -->
        <span class="pf-header__badge" title="购物车">🛒
          <i v-if="sharedState.cartCount" class="pf-header__count">{{ sharedState.cartCount }}</i>
        </span>

        <span class="pf-header__user">
          当前用户:<b>{{ sharedState.user.name }}</b>({{ sharedState.user.role }})
        </span>
      </header>

      <main class="pf-content">
        <!-- 基座页面 & 子应用容器路由出口 -->
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { microApps } from './micro/registry'
import { appStore } from './micro/instances'
import { useGlobalStore } from './store/global'
import { THEMES } from '@micro/shared'

const route = useRoute()
const global = useGlobalStore()
// sharedState 是共享 Store 的响应式镜像(见 store/global.js)
const { sharedState } = storeToRefs(global)

/** 技术栈短标签(菜单右侧展示) */
const shortTech = (tech) => {
  if (tech.includes('Vue 2')) return 'Vue2'
  if (tech.includes('Vue 3')) return 'Vue3'
  if (tech.includes('React')) return 'React'
  return 'Svelte'
}

/** 切换全局主题:共享 Store 是唯一数据源,GlobalState 由 setup.js 自动回写对齐 */
const toggleTheme = () => {
  const next = sharedState.value.theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
  appStore.actions.setTheme(next)
}

/** 清空消息中心 */
const clearMessages = () => appStore.actions.clearMessages()

// 主题变化应用到基座皮肤(html[data-theme])
watch(
  () => sharedState.value.theme,
  (theme) => {
    document.documentElement.dataset.theme = theme
  },
  { immediate: true }
)
</script>
