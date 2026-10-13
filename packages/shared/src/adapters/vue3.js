/**
 * Vue3 适配器(Composition API)
 * ---------------------------------------------------------------
 * 用法(在 setup 中):
 *   import { useSharedStore } from '@micro/shared/vue3'
 *   import { getSharedContext } from '../shared-context'
 *   const { state, actions } = useSharedStore(getSharedContext().store)
 *
 * 【坑点 —— 卸载退订】
 * 微应用会被 qiankun 反复 mount/unmount,订阅必须在组件卸载时取消,
 * 否则每次重进应用监听器 +1,最终一条消息被消费 N 次(内存泄漏 + 重复执行)。
 * 本适配器内部使用 onScopeDispose 自动退订,使用方无感知。
 */
import { reactive, readonly, onScopeDispose } from 'vue'

/**
 * 将框架无关 store 桥接为 Vue3 响应式状态
 * @param {ReturnType<import('../index.js').createAppStore>} store 共享 store 实例(由 qiankun props 下发)
 * @returns {{ state: Readonly<object>, store: object, actions: object }}
 */
export function useSharedStore(store) {
  // 用 reactive 包一层本地镜像,订阅回调里做同步,触发 Vue 的依赖更新
  const state = reactive({ ...store.getState() })

  const unsubscribe = store.subscribe((next) => {
    // 浅层同步:逐 key 赋值,保持 state 引用不变,避免依赖它的 computed 失效
    Object.keys(next).forEach((key) => {
      state[key] = next[key]
    })
  })

  // setup 语法下 onScopeDispose 会在组件卸载时执行 —— 这是防泄漏的关键
  onScopeDispose(() => unsubscribe())

  return { state: readonly(state), store, actions: store.actions }
}

/**
 * 订阅事件总线(自动在组件卸载时退订)
 * @param {import('../event-bus.js')} eventBus 共享事件总线
 * @param {string} event 事件名(取 GLOBAL_EVENTS)
 * @param {(payload: any) => void} handler 回调
 */
export function useGlobalEvent(eventBus, event, handler) {
  const off = eventBus.on(event, handler)
  onScopeDispose(() => off())
}
