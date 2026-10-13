/**
 * 框架无关的响应式状态容器 + 业务级全局 Store
 * ---------------------------------------------------------------
 * 【设计目标】
 * 微前端架构下,各子应用技术栈异构(Vue2 / Vue3 / React / Svelte),
 * 不能依赖任何一个框架的响应式体系,因此这里用"发布订阅 + 不可变更新"
 * 实现一个最小化的状态容器,再在各框架侧用适配器(见 adapters/)接入。
 *
 * 【subscribe 的契约】
 * subscribe(fn) 会"立即"以当前 state 调用一次 fn,并返回取消订阅函数。
 * 该签名与 Svelte store 规范完全兼容,Svelte 组件可直接 `$store` 使用;
 * React 侧可配合 useSyncExternalStore;Vue 侧配合 reactive 同步即可。
 */

/**
 * 创建一个框架无关的通用状态容器
 * @template T
 * @param {T} initialState 初始状态对象
 * @returns {{
 *   getState: () => T,
 *   setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
 *   subscribe: (fn: (state: T) => void) => (() => void)
 * }} 状态容器实例
 */
export function createGlobalStore(initialState = {}) {
  /** 内部状态:始终以"浅拷贝替换"的方式更新,保证引用变化可被各框架感知 */
  let state = { ...initialState }
  /** 订阅者集合:用 Set 保证同一回调不会重复注册,且退订为 O(1) */
  const listeners = new Set()

  /**
   * 读取当前状态(返回的是当前快照的引用,调用方不应直接修改它)
   * @returns {T}
   */
  const getState = () => state

  /**
   * 更新状态(浅合并)
   * 支持两种入参:
   *   1. 对象字面量:      setState({ theme: 'dark' })
   *   2. 函数(基于旧值):  setState(prev => ({ cartCount: prev.cartCount + 1 }))
   * @param {Partial<T> | ((state: T) => Partial<T>)} partial
   */
  const setState = (partial) => {
    const patch = typeof partial === 'function' ? partial(state) : partial
    // 不可变更新:生成新对象,引用变化是各框架触发重渲染/响应的信号
    state = { ...state, ...patch }
    // 逐个通知;单个订阅者抛错不应阻断其它订阅者
    listeners.forEach((fn) => {
      try {
        fn(state)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[shared-store] 订阅回调执行异常:', err)
      }
    })
  }

  /**
   * 订阅状态变化
   * 注意:注册后会"立即"同步回调一次当前状态(与 Svelte store 契约一致),
   * 这样 UI 初始化时无需再手动 getState() 一次。
   * @param {(state: T) => void} fn 订阅回调
   * @returns {() => void} 取消订阅函数(组件卸载时必须调用,否则内存泄漏 —— 高频坑点)
   */
  const subscribe = (fn) => {
    listeners.add(fn)
    fn(state)
    return () => listeners.delete(fn)
  }

  return { getState, setState, subscribe }
}

/**
 * 创建业务级全局 Store(在通用容器之上内置领域状态与动作)
 * ---------------------------------------------------------------
 * 主应用 portal 启动时创建唯一实例,通过 qiankun props 下发给全部子应用,
 * 实现"一份状态,九端共享":
 *   - user      当前登录用户(任一应用登录,全局生效)
 *   - theme     全局主题(任一应用切换,所有应用联动换肤)
 *   - cartCount 购物车数量(React 商城加购,Vue/Svelte 应用同步展示角标)
 *   - messages  全局消息队列(portal 消息中心消费)
 * @returns {ReturnType<typeof createGlobalStore> & {
 *   actions: {
 *     login(user: {name: string, role: string}): void,
 *     logout(): void,
 *     setTheme(theme: string): void,
 *     addCart(n?: number): void,
 *     resetCart(): void,
 *     pushMessage(msg: {from: string, text: string, level?: string}): void,
 *     clearMessages(): void
 *   }
 * }}
 */
export function createAppStore() {
  const store = createGlobalStore({
    user: { name: '未登录', role: 'guest' },
    theme: 'light',
    cartCount: 0,
    messages: []
  })

  const actions = {
    /** 登录 / 切换用户(写入全局状态,九端同步) */
    login(user) {
      store.setState({ user })
    },
    /** 登出:恢复游客身份并清空业务数据 */
    logout() {
      store.setState({ user: { name: '未登录', role: 'guest' }, cartCount: 0 })
    },
    /** 切换全局主题 */
    setTheme(theme) {
      store.setState({ theme })
    },
    /** 购物车加购,默认 +1 */
    addCart(n = 1) {
      store.setState((prev) => ({ cartCount: prev.cartCount + n }))
    },
    /** 清空购物车 */
    resetCart() {
      store.setState({ cartCount: 0 })
    },
    /**
     * 追加一条全局消息
     * 消息结构带上时间与来源应用,便于 portal 消息中心做来源追踪
     */
    pushMessage(msg) {
      store.setState((prev) => ({
        messages: [
          ...prev.messages,
          { time: new Date().toLocaleTimeString(), level: 'info', ...msg }
        ].slice(-50) // 只保留最近 50 条,防止长会话内存膨胀
      }))
    },
    /** 清空消息 */
    clearMessages() {
      store.setState({ messages: [] })
    }
  }

  return { ...store, actions }
}
