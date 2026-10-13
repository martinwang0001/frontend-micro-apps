/**
 * Vue2 适配器(Options API,mixin 形式)
 * ---------------------------------------------------------------
 * 老项目(Vue2.7)以 Options API 为主,因此提供 mixin 而不是 composable,
 * 更贴近存量代码的接入方式:
 *
 *   import { createSharedStoreMixin } from '@micro/shared/vue2'
 *   import { getSharedContext } from '../shared-context'
 *   export default {
 *     mixins: [createSharedStoreMixin(getSharedContext().store)],
 *     ...
 *   }
 *   // 模板中直接访问 this.shared.user / this.shared.theme ...
 *
 * 【坑点 —— 卸载退订】
 * mixin 在 beforeDestroy 中自动退订,防止微应用反复挂载导致监听器叠加。
 */

/**
 * 创建"共享 store 同步" mixin
 * @param {object | (() => object)} storeOrGetter 共享 store 实例,或延迟取值的 getter
 *        【为什么支持 getter】Vue2 组件的 mixins 在模块顶层求值,而 store 是
 *        mount 时才经 qiankun props 下发的,顶层直接传实例拿到的是 null;
 *        传 getter(() => getSharedContext().store)则延迟到组件 created 时求值。
 * @param {string} [key] 挂载到组件 data 上的属性名,默认 'shared'
 * @returns {object} Vue2 mixin 配置对象
 */
export function createSharedStoreMixin(storeOrGetter, key = 'shared') {
  /** 统一为取值函数 */
  const resolve = () => (typeof storeOrGetter === 'function' ? storeOrGetter() : storeOrGetter)
  return {
    data() {
      // 初始快照:保证模板首次渲染就有值
      return { [key]: { ...resolve().getState() } }
    },
    created() {
      // 订阅全局状态;注意保存退订函数供销毁钩子使用
      this.__microSharedUnsub = resolve().subscribe((next) => {
        // Vue2 的响应式基于 defineProperty,整体替换新对象即可触发视图更新
        this[key] = { ...next }
      })
    },
    beforeDestroy() {
      // 微应用卸载时组件销毁,必须退订,否则重进应用后消息被重复消费
      if (this.__microSharedUnsub) this.__microSharedUnsub()
    }
  }
}

/**
 * 创建"事件订阅" mixin:自动在组件销毁时退订
 * @param {object | (() => object)} busOrGetter 共享事件总线实例或 getter(原因同上)
 * @param {string} event 事件名(取 GLOBAL_EVENTS)
 * @param {string} methodName 组件 methods 中的处理方法名
 * @returns {object} Vue2 mixin 配置对象
 */
export function createGlobalEventMixin(busOrGetter, event, methodName) {
  const resolve = () => (typeof busOrGetter === 'function' ? busOrGetter() : busOrGetter)
  return {
    created() {
      // 把 handler 绑定到组件实例,保证 off 时引用一致
      const handler = (payload) => this[methodName] && this[methodName](payload)
      this.__microEventOffs = this.__microEventOffs || []
      this.__microEventOffs.push(resolve().on(event, handler))
    },
    beforeDestroy() {
      // 统一退订本组件注册的所有事件
      ;(this.__microEventOffs || []).forEach((off) => off())
      this.__microEventOffs = []
    }
  }
}
