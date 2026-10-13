<!--
  日志中心根组件
  ---------------------------------------------------------------
  【职责】
  - widgetMode = false(路由挂载):显示顶部页签导航,本地状态切换 日志流/通信演示/样式演示;
  - widgetMode = true(ID 容器挂载):只渲染日志流组件(聚合页嵌入的精简形态)。

  【微前端友好点 —— Svelte 无路由】
  Svelte 没有官方路由库,本应用用本地 activeTab + {#if} 切换页签。
  好处:子应用不触碰浏览器 URL,与主应用路由零冲突,也无需区分
  history/memory 路由与 base 路径(Vue/React 子应用的经典坑在这里天然不存在)。

  【样式说明】
  <style> 中的样式由 Svelte 编译期自动 scoped(追加 svelte-xxx 哈希),
  类名仍统一 log- 前缀,作为沙箱失效时的第二道防线。
-->
<script>
  import LogList from './components/LogList.svelte'
  import Comm from './components/Comm.svelte'
  import Style from './components/Style.svelte'

  /**
   * widgetMode:主应用聚合页通过 loadMicroApp 以 ID 容器挂载本应用时置 true,
   * 此时隐藏子应用自身导航,以"卡片"形态嵌入。
   * @type {boolean}
   */
  export let widgetMode = false

  /** 当前激活页签(本地状态,非路由) */
  let activeTab = 'logs'

  /** 页签配置:驱动导航渲染,新增页只需加一项 */
  const tabs = [
    { key: 'logs', label: '日志流' },
    { key: 'comm', label: '通信演示' },
    { key: 'style', label: '样式演示' }
  ]
</script>

<div class="log-app">
  {#if !widgetMode}
    <!-- 页签导航:纯本地状态切换,不修改 URL,避免与主应用路由冲突 -->
    <nav class="log-nav">
      <span class="log-nav__brand">📜 日志中心 <em>Svelte + Vite</em></span>
      {#each tabs as tab}
        <button
          class="log-nav__tab"
          class:log-nav__tab--active={activeTab === tab.key}
          on:click={() => (activeTab = tab.key)}
        >
          {tab.label}
        </button>
      {/each}
    </nav>
    <main class="log-main">
      {#if activeTab === 'logs'}
        <LogList />
      {:else if activeTab === 'comm'}
        <Comm />
      {:else}
        <Style />
      {/if}
    </main>
  {:else}
    <!-- Widget 模式:聚合页里只展示日志流(不含导航与演示页) -->
    <LogList />
  {/if}
</div>

<style>
  /* scoped:Svelte 编译期为选择器追加 svelte-xxx 哈希,天然具备组件级样式隔离 */
  .log-app {
    font-family: 'Segoe UI', 'PingFang SC', sans-serif;
  }
  .log-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: linear-gradient(90deg, #07332b, #0e6b5c);
    border-radius: 8px;
    margin-bottom: 12px;
  }
  .log-nav__brand {
    color: #fff;
    font-weight: 700;
    margin-right: 12px;
  }
  .log-nav__brand em {
    font-style: normal;
    font-size: 12px;
    opacity: 0.75;
  }
  .log-nav__tab {
    border: none;
    background: transparent;
    color: #c9ece5;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 2px;
  }
  .log-nav__tab--active {
    color: #fff;
    border-bottom: 2px solid #ffd166;
  }
  .log-main {
    min-height: 300px;
  }
</style>
