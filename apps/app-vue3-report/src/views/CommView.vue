<template>
  <div class="report-comm">
    <h2>跨应用通信演示</h2>
    <p class="report-comm__tip">
      本页同时使用三种通信机制,改动会同步到主应用与其它子应用。
    </p>

    <!-- ① 共享 Store:由主应用创建、经 qiankun props 下发的唯一实例 -->
    <section class="report-card report-comm__section">
      <h3>① 共享 Store(跨应用状态)</h3>
      <p>当前用户:<b>{{ state.user.name }}</b>({{ state.user.role }})</p>
      <p>全局主题:<b>{{ state.theme }}</b></p>
      <p>购物车数量:<b>{{ state.cartCount }}</b></p>
      <button class="report-btn" @click="actions.addCart(1)">加购 +1</button>
      <button class="report-btn report-btn--plain" @click="switchUser">切换用户</button>
    </section>

    <!-- ② qiankun 官方 GlobalState -->
    <section class="report-card report-comm__section">
      <h3>② qiankun GlobalState(官方 props 通信)</h3>
      <input v-model="msg" class="report-comm__input" placeholder="输入要广播的全局消息" />
      <button class="report-btn" @click="sendGlobalState">setGlobalState 广播</button>
      <p class="report-comm__echo">主应用及其它子应用均可 onGlobalStateChange 收到</p>
    </section>

    <!-- ③ 事件总线 -->
    <section class="report-card report-comm__section">
      <h3>③ 事件总线(发布订阅)</h3>
      <button class="report-btn" @click="sendNotify">emit('global:notify')</button>
      <p class="report-comm__echo">portal 消息中心与子应用日志页会实时收到该通知</p>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// 共享包只提供适配器与工厂;实例由主应用经 props 下发(模块多实例坑点,见 shared-context.js)
import { useSharedStore } from '@micro/shared/vue3'
import { GLOBAL_EVENTS, GLOBAL_STATE_KEYS } from '@micro/shared'
import { getSharedContext } from '../shared-context'

/** 共享上下文:store / eventBus / qiankun 能力 */
const ctx = getSharedContext()

/** ① 共享 Store:响应式桥接(组件卸载自动退订,见适配器注释) */
const { state, actions } = useSharedStore(ctx.store)

/** 待广播的消息 */
const msg = ref('来自 Vue3 报表中心的问候')

/** 切换用户:写入共享 store,九端同步 */
const switchUser = () => {
  actions.login({
    name: state.user.name === '张三' ? '李四' : '张三',
    role: state.user.role === 'admin' ? 'editor' : 'admin'
  })
}

/** ② 通过 qiankun 官方 GlobalState 广播 */
const sendGlobalState = () => {
  if (ctx.qiankun?.setGlobalState) {
    ctx.qiankun.setGlobalState({ [GLOBAL_STATE_KEYS.GLOBAL_MESSAGE]: msg.value })
  } else {
    // 独立运行时无 qiankun 环境,降级提示
    alert('当前为独立运行模式,无 qiankun GlobalState')
  }
}

/** ③ 通过事件总线发布全局通知 */
const sendNotify = () => {
  ctx.eventBus?.emit(GLOBAL_EVENTS.NOTIFY, { from: 'app-vue3-report', text: msg.value })
}
</script>

<style scoped>
.report-comm h2 {
  margin: 0 0 6px;
  color: #3b1d75;
}
.report-comm__tip {
  font-size: 12px;
  color: #8896a6;
  margin: 0 0 14px;
}
.report-comm__section {
  margin-bottom: 12px;
}
.report-comm__section h3 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #3b1d75;
}
.report-comm__input {
  padding: 6px 10px;
  border: 1px solid #d7ceee;
  border-radius: 6px;
  margin-right: 8px;
  width: 240px;
}
.report-comm__echo {
  font-size: 12px;
  color: #8896a6;
  margin: 8px 0 0;
}
.report-btn {
  margin-right: 8px;
}
</style>
