/**
 * Svelte 适配器
 * ---------------------------------------------------------------
 * Svelte 的 store 契约非常简单:任何含有 subscribe(fn) 方法、且
 * subscribe 会立即调用一次 fn 并返回退订函数的对象,都可以在组件中
 * 用 `$store` 自动订阅/退订。
 *
 * 我们的 createGlobalStore 恰好满足该契约,因此这里只需要一个
 * 极简的桥接函数,并在组件中:
 *
 *   <script>
 *     import { asSvelteReadable } from '@micro/shared/svelte'
 *     import { getSharedContext } from '../shared-context'
 *     const shared = asSvelteReadable(getSharedContext().store)
 *   </script>
 *   <p>{$shared.user.name}</p>   <!-- 自动订阅,组件销毁自动退订 -->
 *
 * 【坑点】Svelte 的 $ 自动订阅只在组件顶层作用域可用;
 * 在函数/生命周期内部订阅时必须手动保存退订函数并在 onDestroy 调用。
 */

/**
 * 将共享 store 包装为 Svelte readable(本质是透出同一个 subscribe)
 * @param {ReturnType<import('../index.js').createAppStore>} store 共享 store(qiankun props 下发)
 * @returns {{ subscribe: (fn: (state: object) => void) => (() => void), actions: object }}
 */
export function asSvelteReadable(store) {
  return {
    // 直接复用 store.subscribe:签名已满足 Svelte store 契约
    subscribe: store.subscribe,
    // 动作方法一并透出,方便组件内调用 sharedActions.xxx
    actions: store.actions
  }
}
