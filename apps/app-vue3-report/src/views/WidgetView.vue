<template>
  <!-- Widget 形态:被主应用聚合页以指定 ID 容器挂载时展示的精简视图 -->
  <div class="report-widget report-card">
    <h4>📈 报表速览 <span class="report-widget__tag">Widget 模式 · ID 容器挂载</span></h4>
    <div class="report-widget__row">
      <!-- 本地 Pinia:报表总数(本应用私有数据,widget 下依然可用) -->
      <div class="report-widget__item">
        <span class="report-widget__num">{{ reportStore.total }}</span>
        <span class="report-widget__label">报表总数(本地 Pinia)</span>
      </div>
      <!-- 共享 Store:与路由模式同源,数据完全同步 -->
      <div class="report-widget__item">
        <span class="report-widget__num">{{ state.user.name }}</span>
        <span class="report-widget__label">当前用户(共享 Store)</span>
      </div>
      <div class="report-widget__item">
        <span class="report-widget__num">{{ state.cartCount }}</span>
        <span class="report-widget__label">购物车(共享 Store)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Widget 模式说明:
 * 聚合页的 URL 属于主应用,因此本应用在该模式下使用 memory 路由直达本页
 * (见 main.js);共享 Store 依然通过 props 下发,数据与路由模式完全同步。
 * 本地 Pinia 也照常可用 —— widget 只是"挂载形态"不同,应用内部能力无损。
 */
import { useSharedStore } from '@micro/shared/vue3'
import { getSharedContext } from '../shared-context'
import { useReportStore } from '../store/report'

/** 共享 Store:主应用下发的全局状态(九端同步) */
const { state } = useSharedStore(getSharedContext().store)

/** 本地 Pinia:报表中心私有状态(仅本应用可见) */
const reportStore = useReportStore()
</script>

<style scoped>
.report-widget h4 {
  margin: 0 0 10px;
  color: #3b1d75;
  font-size: 14px;
}
.report-widget__tag {
  font-size: 11px;
  color: #8896a6;
  font-weight: 400;
}
.report-widget__row {
  display: flex;
  gap: 18px;
}
.report-widget__item {
  display: flex;
  flex-direction: column;
}
.report-widget__num {
  font-size: 20px;
  font-weight: 700;
  color: #6d3fd1;
}
.report-widget__label {
  font-size: 11px;
  color: #8896a6;
}
</style>
