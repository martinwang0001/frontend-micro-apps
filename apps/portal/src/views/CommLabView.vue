<template>
  <div>
    <!-- 三种通信机制实操面板 -->
    <div class="pf-card">
      <h3>📡 通信实验室(基座侧)</h3>
      <p style="font-size: 13px; color: var(--p-text-sub); margin: 0 0 12px">
        进入任意子应用的「通信演示」页,与本页同时操作,观察双向同步效果。
      </p>

      <div class="comm-grid">
        <!-- ① 共享 Store -->
        <section class="comm-panel">
          <h4>① 共享 Store(跨应用状态容器)</h4>
          <p>用户:<b>{{ sharedState.user.name }}</b>({{ sharedState.user.role }})</p>
          <p>购物车:<b>{{ sharedState.cartCount }}</b> 件</p>
          <button class="pf-btn pf-btn--primary" @click="appStore.actions.addCart(1)">基座加购 +1</button>
          <button class="pf-btn" @click="switchUser">切换用户</button>
          <button class="pf-btn" @click="appStore.actions.resetCart()">清空购物车</button>
        </section>

        <!-- ② qiankun GlobalState -->
        <section class="comm-panel">
          <h4>② qiankun GlobalState(官方通道)</h4>
          <input v-model="msg" class="comm-input" placeholder="广播给所有子应用" />
          <button class="pf-btn pf-btn--primary" @click="sendGlobalMessage">setGlobalState</button>
          <p class="comm-snapshot">最近快照:{{ qiankunStateText }}</p>
        </section>

        <!-- ③ 事件总线 -->
        <section class="comm-panel">
          <h4>③ 事件总线(发布订阅)</h4>
          <button class="pf-btn pf-btn--primary" @click="emitNotify">emit('global:notify')</button>
          <button class="pf-btn" @click="emitLog">emit('log:write')</button>
          <p class="comm-snapshot">子应用日志中心(Svelte)在监听 log:write</p>
        </section>
      </div>
    </div>

    <!-- 消息中心(共享 Store messages) -->
    <div class="pf-card">
      <h3>
        🔔 消息中心
        <button class="pf-btn" style="float: right" @click="appStore.actions.clearMessages()">清空</button>
      </h3>
      <div class="pf-log">
        <div v-if="!sharedState.messages.length" style="color: var(--p-text-sub)">暂无消息</div>
        <div v-for="(m, i) in sharedState.messages" :key="i" class="pf-log__item">
          <span class="pf-tag">{{ m.from }}</span>
          <span style="margin: 0 6px">{{ m.time }}</span>{{ m.text }}
        </div>
      </div>
    </div>

    <!-- 事件日志(事件总线流经记录) -->
    <div class="pf-card">
      <h3>📜 事件日志(总线流经记录,最近 100 条)</h3>
      <div class="pf-log">
        <div v-if="!eventLog.length" style="color: var(--p-text-sub)">暂无事件</div>
        <div v-for="(e, i) in eventLog" :key="i" class="pf-log__item">
          <span class="pf-tag pf-tag--orange">{{ e.type }}</span>
          <span style="margin: 0 6px">{{ e.time }}</span>
          {{ JSON.stringify(e.payload) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { appStore, eventBus } from '../micro/instances'
import { useGlobalStore } from '../store/global'
import { GLOBAL_EVENTS, GLOBAL_STATE_KEYS } from '@micro/shared'
import { qiankunActions } from '../micro/actions-holder'

const global = useGlobalStore()
const { sharedState, eventLog, qiankunState } = storeToRefs(global)

/** 待广播文本 */
const msg = ref('主应用广播:今晚 24 点全站发版')

/** 切换用户(演示 Store 九端同步) */
const switchUser = () => {
  const isAdmin = sharedState.value.user.role === 'admin'
  appStore.actions.login({ name: isAdmin ? '王五' : '赵六', role: isAdmin ? 'viewer' : 'admin' })
}

/** ② 通过 qiankun 官方通道广播(子应用在 mount props 中拿到 setGlobalState) */
const sendGlobalMessage = () => {
  qiankunActions.setGlobalState({ [GLOBAL_STATE_KEYS.GLOBAL_MESSAGE]: msg.value })
}

/** ③ 事件总线:通知类事件 */
const emitNotify = () => {
  eventBus.emit(GLOBAL_EVENTS.NOTIFY, { from: 'portal', text: msg.value })
}

/** ③ 事件总线:日志类事件(日志中心子应用监听) */
const emitLog = () => {
  eventBus.emit(GLOBAL_EVENTS.LOG_WRITE, { from: 'portal', text: `基座手动写入日志:${msg.value}` })
}

/** GlobalState 快照展示 */
const qiankunStateText = computed(() => JSON.stringify(qiankunState.value))
</script>

<style scoped>
.comm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.comm-panel {
  border: 1px solid var(--p-border);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
}
.comm-panel h4 {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--p-primary);
}
.comm-panel p {
  margin: 6px 0;
}
.comm-panel button {
  margin: 4px 6px 0 0;
}
.comm-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--p-border);
  border-radius: 6px;
  margin-bottom: 8px;
  background: transparent;
  color: var(--p-text);
}
.comm-snapshot {
  font-size: 11px;
  color: var(--p-text-sub);
  word-break: break-all;
}
</style>
