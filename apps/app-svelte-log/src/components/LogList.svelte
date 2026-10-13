<!--
  日志流列表(日志中心业务页)
  ---------------------------------------------------------------
  【职责】
  - 实时日志流:订阅共享事件总线的 LOG_WRITE 事件,任何应用(含本应用
    通信演示页的「写入一条日志」按钮)emit 的日志都会实时 unshift 进列表;
  - 本地 mock 初始日志若干条;
  - 级别筛选:all / info / warn / error,级别 tag 上色。

  ★【核心坑点演示 —— 手动订阅必须手动退订】
  对比两种订阅方式:
    A. $shared(见 Comm.svelte):Svelte 编译器自动订阅/退订,零样板代码;
    B. eventBus.on(...)(本组件):这是"普通函数调用",Svelte 无法感知,
       返回值是退订函数,必须保存并在 onDestroy 中调用!
  微应用在 qiankun 中会反复 mount / unmount,若不退订:
    每重进一次本应用,总线上就多挂一个监听器 —— 同一条日志会被重复
    写入 N 次(N = 进入次数),这是微前端通信最高频的 bug 之一。
-->
<script>
  import { onMount, onDestroy } from 'svelte'
  import { asSvelteReadable } from '@micro/shared/svelte'
  import { GLOBAL_EVENTS } from '@micro/shared'
  import { getSharedContext } from '../shared-context'

  /** 共享上下文 */
  const ctx = getSharedContext()

  /** 共享 store:$ 自动订阅(方式 A,见文件头对比),顶部展示全局消息数 */
  const shared = asSvelteReadable(ctx.store)

  /** 日志列表:最新在前 */
  let logs = []

  /** 级别筛选:all | info | warn | error */
  let levelFilter = 'all'

  /** 级别筛选选项 */
  const LEVELS = ['all', 'info', 'warn', 'error']

  /**
   * 退订函数:eventBus.on 的返回值。
   * ★ 必须保存!onDestroy 中调用,否则重进应用后日志重复写入(见文件头)。
   * @type {null | (() => void)}
   */
  let offLogWrite = null

  /** 本地 mock 初始日志(应用独立运行时也有内容可看) */
  function seedMockLogs() {
    const now = Date.now()
    logs = [
      { time: new Date(now - 5000).toLocaleTimeString(), from: 'app-svelte-log', level: 'info', text: '日志中心启动完成' },
      { time: new Date(now - 8000).toLocaleTimeString(), from: 'mock-service', level: 'warn', text: '慢查询告警:orders 表查询耗时 1.2s' },
      { time: new Date(now - 12000).toLocaleTimeString(), from: 'mock-service', level: 'error', text: '支付回调验签失败(第 3 次重试)' },
      { time: new Date(now - 20000).toLocaleTimeString(), from: 'mock-gateway', level: 'info', text: '网关路由表热更新成功' }
    ]
  }

  /** 追加一条日志(Svelte 响应式:重新赋值数组即触发更新) */
  function appendLog(payload) {
    const log = {
      time: new Date().toLocaleTimeString(),
      level: 'info',
      from: 'unknown',
      ...payload
    }
    // 只保留最近 100 条,防止长会话内存膨胀
    logs = [log, ...logs].slice(0, 100)
  }

  /** 派生列表:按级别筛选(Svelte 的 $: 响应式语句,logs/levelFilter 变化自动重算) */
  $: filteredLogs = levelFilter === 'all' ? logs : logs.filter((l) => l.level === levelFilter)

  onMount(() => {
    seedMockLogs()
    // ★ 手动订阅事件总线 —— 返回值是退订函数,必须保存(见文件头"核心坑点演示")
    offLogWrite = ctx.eventBus?.on(GLOBAL_EVENTS.LOG_WRITE, appendLog) || null
  })

  onDestroy(() => {
    // ★ 必须退订!否则微应用反复挂载时监听器叠加,日志被重复写入 N 次
    offLogWrite?.()
    offLogWrite = null
  })
</script>

<div class="log-list">
  <h2>实时日志流</h2>
  <p class="log-list__tip">
    订阅事件总线 <code>log:write</code>;全局消息队列当前共 <b>{$shared.messages.length}</b> 条。
  </p>

  <!-- 级别筛选 -->
  <div class="log-list__filters">
    {#each LEVELS as lv}
      <button
        class="log-list__filter"
        class:log-list__filter--active={levelFilter === lv}
        on:click={() => (levelFilter = lv)}
      >
        {lv}
      </button>
    {/each}
    <span class="log-list__count">共 {filteredLogs.length} 条</span>
  </div>

  <!-- 日志区 -->
  <section class="log-card log-list__panel">
    {#if filteredLogs.length === 0}
      <p class="log-list__empty">当前级别下暂无日志</p>
    {:else}
      <ul class="log-list__items">
        {#each filteredLogs as log}
          <li class="log-list__item">
            <span class="log-list__time">{log.time}</span>
            <span class="log-list__from">[{log.from}]</span>
            <!-- 级别 tag:按级别上色 -->
            <span
              class="log-list__level"
              class:log-list__level--warn={log.level === 'warn'}
              class:log-list__level--error={log.level === 'error'}
            >
              {log.level}
            </span>
            <span class="log-list__text">{log.text}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  /* 以下样式编译期自动 scoped,不会泄漏到其它应用 */
  .log-list h2 {
    margin: 0 0 6px;
    color: #07332b;
  }
  .log-list__tip {
    font-size: 12px;
    color: #8896a6;
    margin: 0 0 12px;
  }
  .log-list__tip code {
    background: #e3f2ef;
    padding: 1px 6px;
    border-radius: 4px;
  }
  .log-list__filters {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .log-list__filter {
    border: 1px solid #cdd7e1;
    background: #fff;
    border-radius: 14px;
    padding: 2px 12px;
    font-size: 12px;
    cursor: pointer;
    color: #5b6b7c;
  }
  .log-list__filter--active {
    background: #0e6b5c;
    border-color: #0e6b5c;
    color: #fff;
  }
  .log-list__count {
    font-size: 12px;
    color: #8896a6;
    margin-left: auto;
  }
  .log-list__panel {
    padding: 8px 16px;
  }
  .log-list__empty {
    font-size: 13px;
    color: #8896a6;
    margin: 8px 0;
  }
  .log-list__items {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 380px;
    overflow-y: auto;
    font-family: 'Consolas', 'Courier New', monospace;
  }
  .log-list__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px dashed #eef1f5;
    font-size: 12px;
  }
  .log-list__time {
    color: #8896a6;
    flex-shrink: 0;
  }
  .log-list__from {
    color: #5b6b7c;
    flex-shrink: 0;
  }
  .log-list__level {
    padding: 0 8px;
    border-radius: 10px;
    font-size: 11px;
    background: #e3f2ef;
    color: #0e6b5c;
    flex-shrink: 0;
  }
  /* 级别上色:warn 黄 / error 红 */
  .log-list__level--warn {
    background: #fff4e0;
    color: #b3541e;
  }
  .log-list__level--error {
    background: #fde8e8;
    color: #d64545;
  }
  .log-list__text {
    color: #33404d;
    word-break: break-all;
  }
</style>
