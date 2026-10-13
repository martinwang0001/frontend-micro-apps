<template>
  <div class="report-home">
    <h2>报表中心</h2>
    <p class="report-home__tip">
      点击「生成报表」会同时做两件事:① 更新<b>本地 Pinia</b>(仅本应用可见);
      ② 通过<b>事件总线</b>广播日志(日志中心实时收到)并向<b>共享 Store</b> 追加消息(九端同步)。
    </p>

    <!-- ============ 报表列表卡片(本地 Pinia 驱动) ============ -->
    <div class="report-home__grid">
      <div v-for="item in reportStore.reports" :key="item.id" class="report-card report-home__card">
        <div class="report-home__name">{{ item.name }}</div>
        <div class="report-home__period">推送节奏:{{ item.period }}</div>
        <div class="report-home__last">
          最近生成:{{ item.lastGeneratedAt || '尚未生成' }}
        </div>
        <!-- 生成动作:先走本地 Pinia,再走跨应用通信(见 script) -->
        <button class="report-btn" @click="onGenerate(item.id)">生成报表</button>
      </div>
    </div>

    <!-- ============ 本地状态 vs 共享状态 对比区 ============ -->
    <!--
      这一节是本页的教学重点:用两个并排的卡片直观展示两类状态的边界。
      左卡数据来自本地 Pinia(reportStore),右卡数据来自共享 Store(useSharedStore)。
      实验方式:
        1. 点「生成报表」→ 左卡计数 +1,切到其它应用再切回,左卡归零(Pinia 随 unmount 销毁);
           而日志中心能查到每一次生成记录(共享通道有迹可循)。
        2. 在其它应用里切换用户/加购 → 右卡立即变化,左卡纹丝不动。
    -->
    <div class="report-home__compare">
      <section class="report-card report-home__panel">
        <h3>本地 Pinia 状态<em>仅本应用可见</em></h3>
        <p>报表总数:<b>{{ reportStore.total }}</b></p>
        <p>本次挂载已生成:<b>{{ reportStore.generatedCount }}</b> 张</p>
        <p class="report-home__note">
          作用域:当前应用当前挂载实例;应用 unmount 即销毁。
          适合:本应用私有业务数据(报表列表、表单草稿等)。
        </p>
      </section>

      <section class="report-card report-home__panel">
        <h3>共享 Store 状态<em>九端同步</em></h3>
        <p>当前用户:<b>{{ sharedState.user.name }}</b>({{ sharedState.user.role }})</p>
        <p>购物车数量:<b>{{ sharedState.cartCount }}</b></p>
        <p class="report-home__note">
          作用域:整个微前端平台,由主应用创建经 qiankun props 下发。
          适合:登录态、主题、购物车等需要全局一致的数据。
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useSharedStore } from '@micro/shared/vue3'
import { GLOBAL_EVENTS } from '@micro/shared'
import { getSharedContext } from '../shared-context'
import { useReportStore } from '../store/report'

/** 共享上下文:store / eventBus / qiankun 能力(主应用下发,见 shared-context.js) */
const ctx = getSharedContext()

/**
 * 本地 Pinia:报表中心私有状态
 * 坑点:务必在 main.js 的 render 内 createPinia()(随应用实例销毁),
 * 若做成模块级单例,微应用反复挂载会残留上一次的状态。
 */
const reportStore = useReportStore()

/**
 * 共享 Store:响应式桥接主应用下发的全局 store
 * 适配器内部已用 onScopeDispose 自动退订,组件卸载不会泄漏订阅。
 */
const { state: sharedState, actions } = useSharedStore(ctx.store)

/**
 * 「生成报表」点击处理 —— 一次动作触达三条通道,分工明确:
 * 1. 本地 Pinia:更新报表的生成时间与本地计数(仅本应用可见);
 * 2. 事件总线:emit LOG_WRITE,日志中心子应用实时收到一条日志(一次性事件);
 * 3. 共享 Store:pushMessage 追加全局消息,portal 消息中心可见(可回放的状态)。
 * @param {number} id 报表 id
 */
const onGenerate = (id) => {
  // ① 本地状态更新
  const name = reportStore.generate(id)
  if (!name) return

  // ② 事件总线广播日志(事件名统一取 GLOBAL_EVENTS,杜绝魔法字符串)
  ctx.eventBus?.emit(GLOBAL_EVENTS.LOG_WRITE, {
    from: 'app-vue3-report',
    text: `生成报表:${name}`
  })

  // ③ 共享 Store 写全局消息(九端同步,portal 消息中心消费)
  actions.pushMessage({ from: 'app-vue3-report', text: `报表「${name}」已生成` })
}
</script>

<style scoped>
.report-home h2 {
  margin: 0 0 6px;
  color: #3b1d75;
}
.report-home__tip {
  font-size: 12px;
  color: #8896a6;
  margin: 0 0 14px;
}
.report-home__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.report-home__name {
  font-size: 15px;
  font-weight: 700;
  color: #3b1d75;
}
.report-home__period {
  font-size: 12px;
  color: #8896a6;
  margin: 4px 0;
}
.report-home__last {
  font-size: 12px;
  color: #6d3fd1;
  margin-bottom: 10px;
}
.report-home__compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.report-home__panel h3 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #3b1d75;
}
.report-home__panel h3 em {
  font-style: normal;
  font-size: 11px;
  color: #8896a6;
  font-weight: 400;
  margin-left: 8px;
}
.report-home__note {
  font-size: 12px;
  color: #8896a6;
  line-height: 1.7;
  margin: 8px 0 0;
}
</style>
