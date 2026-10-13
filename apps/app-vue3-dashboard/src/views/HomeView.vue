<template>
  <div class="dash-home">
    <h2>实时数据看板</h2>
    <p class="dash-home__tip">
      模拟定时刷新指标。<b>坑点演示:</b>定时器必须在 unmount 时清理,
      否则应用切走后仍在后台空转(见 script 注释)。
    </p>

    <div class="dash-home__grid">
      <div v-for="card in cards" :key="card.label" class="dash-card dash-home__card">
        <div class="dash-home__label">{{ card.label }}</div>
        <div class="dash-home__value">{{ card.value }}</div>
        <div class="dash-home__trend" :class="{ 'is-down': card.trend < 0 }">
          {{ card.trend > 0 ? '▲' : '▼' }} {{ Math.abs(card.trend) }}%
        </div>
      </div>
    </div>

    <!-- 极简 SVG 柱状图:避免引入 echarts 重型依赖,保持子应用轻量 -->
    <div class="dash-card dash-home__chart">
      <h3>近 7 日访问量</h3>
      <svg viewBox="0 0 350 120" width="100%" height="120">
        <rect
          v-for="(v, i) in barData"
          :key="i"
          :x="i * 50 + 10"
          :y="110 - v"
          width="30"
          :height="v"
          rx="4"
          fill="#1b5e8f"
        />
        <text
          v-for="(v, i) in barData"
          :key="'t' + i"
          :x="i * 50 + 25"
          y="118"
          text-anchor="middle"
          font-size="9"
          fill="#8896a6"
        >
          D{{ i + 1 }}
        </text>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

/** 指标卡数据 */
const cards = ref([
  { label: '今日 PV', value: 12840, trend: 12.5 },
  { label: '今日 UV', value: 3521, trend: 8.2 },
  { label: '在线人数', value: 486, trend: -2.4 },
  { label: '转化率', value: '6.8%', trend: 1.7 }
])

/** 柱状图数据 */
const barData = ref([42, 68, 55, 90, 76, 100, 64])

/** 定时器句柄:必须在卸载时 clear,微前端场景的高频泄漏点 */
let timer = null

onMounted(() => {
  // 每 2s 模拟一次数据抖动
  timer = setInterval(() => {
    cards.value = cards.value.map((c) =>
      typeof c.value === 'number'
        ? { ...c, value: c.value + Math.round(Math.random() * 20 - 8) }
        : c
    )
    barData.value = barData.value.map((v) =>
      Math.max(20, Math.min(105, v + Math.round(Math.random() * 14 - 7)))
    )
  }, 2000)
})

onBeforeUnmount(() => {
  // 关键清理:qiankun unmount 时组件销毁,若不 clear,定时器持续持有旧应用作用域
  clearInterval(timer)
  timer = null
})
</script>

<style scoped>
.dash-home h2 {
  margin: 0 0 6px;
  color: #0f3057;
}
.dash-home__tip {
  font-size: 12px;
  color: #8896a6;
  margin: 0 0 14px;
}
.dash-home__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.dash-home__label {
  font-size: 12px;
  color: #8896a6;
}
.dash-home__value {
  font-size: 26px;
  font-weight: 700;
  color: #0f3057;
  margin: 4px 0;
}
.dash-home__trend {
  font-size: 12px;
  color: #2e9e5b;
}
.dash-home__trend.is-down {
  color: #d64545;
}
.dash-home__chart h3 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #0f3057;
}
</style>
