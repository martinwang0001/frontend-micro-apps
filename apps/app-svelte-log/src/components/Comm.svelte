<!--
  跨应用通信演示(日志中心侧)
  ---------------------------------------------------------------
  【职责】同时演示微前端三种通信机制:
    ① 共享 Store(主应用创建、qiankun props 下发的唯一实例)
    ② qiankun 官方 GlobalState(setGlobalState 广播)
    ③ 事件总线(发布订阅,portal 消息中心消费)
  另加「写入一条日志」按钮:emit LOG_WRITE,验证本应用日志流页
  的自订阅(LogList.svelte 订阅了同一事件,切回日志流页即可看到)。

  ★【Svelte 专属亮点 —— $ 自动订阅契约】
  共享 store 的 subscribe(fn) 会"立即回调一次"并返回退订函数,
  恰好满足 Svelte store 契约。模板中 {$shared.xxx} 由编译器自动
  订阅/退订;但事件总线的手动订阅(LogList.svelte)必须自行管理
  退订函数 —— 两处代码对照看,是本应用的核心教学点。
-->
<script>
  // 共享包只提供适配器与工厂;实例由主应用经 props 下发(模块多实例坑点,见 shared-context.js)
  import { asSvelteReadable } from '@micro/shared/svelte'
  import { GLOBAL_EVENTS, GLOBAL_STATE_KEYS } from '@micro/shared'
  import { getSharedContext } from '../shared-context'

  /** 共享上下文:store / eventBus / qiankun 能力 */
  const ctx = getSharedContext()

  /**
   * ① 共享 Store:桥接为 Svelte readable
   * 模板中 $shared 即当前状态快照,actions 透出动作方法。
   * 订阅/退订由 Svelte 编译器自动完成(组件销毁自动退订,无泄漏)。
   */
  const shared = asSvelteReadable(ctx.store)

  /** 待广播的消息 */
  let msg = '来自 Svelte 日志中心的问候'

  /** 切换用户:写入共享 store,九端同步 */
  function switchUser() {
    // 注意:$shared 在 <script> 顶层也可直接使用,读取当前快照
    shared.actions.login({
      name: $shared.user.name === '张三' ? '李四' : '张三',
      role: $shared.user.role === 'admin' ? 'editor' : 'admin'
    })
  }

  /** ② 通过 qiankun 官方 GlobalState 广播 */
  function sendGlobalState() {
    if (ctx.qiankun?.setGlobalState) {
      ctx.qiankun.setGlobalState({ [GLOBAL_STATE_KEYS.GLOBAL_MESSAGE]: msg })
    } else {
      // 独立运行时无 qiankun 环境,降级提示
      alert('当前为独立运行模式,无 qiankun GlobalState')
    }
  }

  /** ③ 通过事件总线发布全局通知 */
  function sendNotify() {
    ctx.eventBus?.emit(GLOBAL_EVENTS.NOTIFY, { from: 'app-svelte-log', text: msg })
  }

  /**
   * ④ 写入一条日志(日志中心专属)
   * 本应用日志流页订阅了 LOG_WRITE;emit 后切回「日志流」页即可看到该条,
   * 同时其它订阅了该事件的应用(如 portal 审计页)也会收到。
   */
  function writeLog() {
    ctx.eventBus?.emit(GLOBAL_EVENTS.LOG_WRITE, {
      from: 'app-svelte-log',
      level: 'info',
      text: msg
    })
  }
</script>

<div class="log-comm">
  <h2>跨应用通信演示</h2>
  <p class="log-comm__tip">本页同时使用三种通信机制,改动会同步到主应用与其它子应用。</p>

  <!-- ① 共享 Store:$ 前缀自动订阅,组件销毁自动退订 -->
  <section class="log-card log-comm__section">
    <h3>① 共享 Store(跨应用状态)</h3>
    <p>当前用户:<b>{$shared.user.name}</b>({$shared.user.role})</p>
    <p>全局主题:<b>{$shared.theme}</b></p>
    <p>购物车数量:<b>{$shared.cartCount}</b></p>
    <button class="log-btn" on:click={() => shared.actions.addCart(1)}>加购 +1</button>
    <button class="log-btn log-btn--plain" on:click={switchUser}>切换用户</button>
  </section>

  <!-- ② qiankun 官方 GlobalState -->
  <section class="log-card log-comm__section">
    <h3>② qiankun GlobalState(官方 props 通信)</h3>
    <input bind:value={msg} class="log-comm__input" placeholder="输入要广播的全局消息" />
    <button class="log-btn" on:click={sendGlobalState}>setGlobalState 广播</button>
    <p class="log-comm__echo">主应用及其它子应用均可 onGlobalStateChange 收到</p>
  </section>

  <!-- ③ 事件总线 -->
  <section class="log-card log-comm__section">
    <h3>③ 事件总线(发布订阅)</h3>
    <button class="log-btn" on:click={sendNotify}>emit('global:notify')</button>
    <!-- ④ 日志中心专属:emit LOG_WRITE 验证日志流页自订阅 -->
    <button class="log-btn log-btn--plain" on:click={writeLog}>写入一条日志</button>
    <p class="log-comm__echo">「写入一条日志」会 emit('log:write'),切回日志流页可看到该条</p>
  </section>
</div>

<style>
  /* scoped:Svelte 编译期为选择器追加哈希,同名类也不冲突 */
  .log-comm h2 {
    margin: 0 0 6px;
    color: #07332b;
  }
  .log-comm__tip {
    font-size: 12px;
    color: #8896a6;
    margin: 0 0 14px;
  }
  .log-comm__section {
    margin-bottom: 12px;
  }
  .log-comm__section h3 {
    margin: 0 0 10px;
    font-size: 15px;
    color: #07332b;
  }
  .log-comm__input {
    padding: 6px 10px;
    border: 1px solid #cdd7e1;
    border-radius: 6px;
    margin-right: 8px;
    width: 240px;
  }
  .log-comm__echo {
    font-size: 12px;
    color: #8896a6;
    margin: 8px 0 0;
  }
</style>
