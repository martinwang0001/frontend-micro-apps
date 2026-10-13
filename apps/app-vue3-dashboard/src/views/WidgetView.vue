<template>
  <!-- Widget 形态:被主应用聚合页以指定 ID 容器挂载时展示的精简视图 -->
  <div class="dash-widget dash-card">
    <h4>📊 看板速览 <span class="dash-widget__tag">Widget 模式 · ID 容器挂载</span></h4>
    <div class="dash-widget__row">
      <div class="dash-widget__item">
        <span class="dash-widget__num">{{ state.cartCount }}</span>
        <span class="dash-widget__label">购物车(共享 Store)</span>
      </div>
      <div class="dash-widget__item">
        <span class="dash-widget__num">{{ state.theme }}</span>
        <span class="dash-widget__label">全局主题</span>
      </div>
      <div class="dash-widget__item">
        <span class="dash-widget__num">{{ state.user.name }}</span>
        <span class="dash-widget__label">当前用户</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Widget 模式说明:
 * 聚合页的 URL 属于主应用,因此本应用在该模式下使用 memory 路由直达本页
 * (见 main.js),同时共享 Store 依然通过 props 下发,数据与路由模式完全同步。
 */
import { useSharedStore } from '@micro/shared/vue3'
import { getSharedContext } from '../shared-context'

const { state } = useSharedStore(getSharedContext().store)
</script>

<style scoped>
.dash-widget h4 {
  margin: 0 0 10px;
  color: #0f3057;
  font-size: 14px;
}
.dash-widget__tag {
  font-size: 11px;
  color: #8896a6;
  font-weight: 400;
}
.dash-widget__row {
  display: flex;
  gap: 18px;
}
.dash-widget__item {
  display: flex;
  flex-direction: column;
}
.dash-widget__num {
  font-size: 20px;
  font-weight: 700;
  color: #1b5e8f;
}
.dash-widget__label {
  font-size: 11px;
  color: #8896a6;
}
</style>
