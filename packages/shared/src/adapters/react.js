/**
 * React 适配器(Hooks)
 * ---------------------------------------------------------------
 * React 18 提供了官方的外部 store 订阅 Hook:useSyncExternalStore,
 * 它天然契合我们"getSnapshot + subscribe"的 store 契约:
 *
 *   import { useSharedStore } from '@micro/shared/react'
 *   const state = useSharedStore(store)        // state 变化自动触发重渲染
 *   const actions = store.actions              // 动作直接用
 *
 * 【坑点 —— getSnapshot 缓存】
 * useSyncExternalStore 会用 Object.is 比较快照,若 getSnapshot 每次返回新对象
 * 会造成无限重渲染。我们的 store 每次 setState 才生成新 state 对象,
 * 因此直接返回 store.getState() 的引用是安全的。
 */
import { useSyncExternalStore, useEffect } from 'react'

/**
 * 订阅共享 store,返回最新状态
 * @param {ReturnType<import('../index.js').createAppStore>} store 共享 store(qiankun props 下发)
 * @returns {object} 最新全局状态
 */
export function useSharedStore(store) {
  return useSyncExternalStore(
    // subscribe:React 需要"状态变化时通知我"的注册函数;store.subscribe 返回退订函数,正好匹配
    (onStoreChange) => store.subscribe(() => onStoreChange()),
    // getSnapshot:返回当前快照(引用稳定,只有 setState 后才变化)
    () => store.getState(),
    // getServerSnapshot:SSR 场景占位,纯前端直接复用 getSnapshot
    () => store.getState()
  )
}

/**
 * 订阅事件总线,组件卸载时自动退订
 * @param {ReturnType<import('../event-bus.js').createEventBus>} eventBus 共享事件总线
 * @param {string} event 事件名(取 GLOBAL_EVENTS)
 * @param {(payload: any) => void} handler 回调(建议用 useCallback 保持引用稳定)
 */
export function useGlobalEvent(eventBus, event, handler) {
  useEffect(() => {
    // effect 返回清理函数:卸载 / 依赖变化时自动退订,防止监听器叠加
    const off = eventBus.on(event, handler)
    return off
  }, [eventBus, event, handler])
}
