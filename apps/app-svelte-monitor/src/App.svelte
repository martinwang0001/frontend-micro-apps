<!--
  监控告警根组件
  ---------------------------------------------------------------
  【职责】
  - widgetMode = false(路由挂载):显示顶部页签导航,本地状态切换 业务/通信演示/样式演示;
  - widgetMode = true(ID 容器挂载):只渲染精简 Widget 组件,供主应用聚合页嵌入。

  【微前端友好点 —— Svelte 无路由】
  Svelte 没有官方路由库,本应用用本地 activeTab + {#if} 切换页签。
  好处:子应用不触碰浏览器 URL,与主应用路由零冲突,也无需区分
  history/memory 路由与 base 路径(Vue/React 子应用的经典坑在这里天然不存在)。

  【样式说明】
  <style> 中的样式由 Svelte 编译期自动 scoped(追加 svelte-xxx 哈希),
  类名仍统一 monitor- 前缀,作为沙箱失效时的第二道防线。
-->
<script>
  import Monitor from './components/Monitor.svelte'
  import Comm from './components/Comm.svelte'
  import Style from './components/Style.svelte'
  import Widget from './components/Widget.svelte'

  /**
   * widgetMode:主应用聚合页通过 loadMicroApp 以 ID 容器挂载本应用时置 true,
   * 此时隐藏子应用自身导航,以"卡片"形态嵌入。
   * @type {boolean}
   */
  export let widgetMode = false

  /** 当前激活页签(本地状态,非路由) */
  let activeTab = 'monitor'

  /** 页签配置:驱动导航渲染,新增页只需加一项 */
  const tabs = [
    { key: 'monitor', label: '监控业务' },
    { key: 'comm', label: '通信演示' },
    { key: 'style', label: '样式演示' }
  ]
</script>

<div class="monitor-app">
  {#if !widgetMode}
    <!-- 页签导航:纯本地状态切换,不修改 URL,避免与主应用路由冲突 -->
    <nav class="monitor-nav">
      <span class="monitor-nav__brand">📈 监控告警 <em>Svelte + Vite</em></span>
      {#each tabs as tab}
        <button
          class="monitor-nav__tab"
          class:monitor-nav__tab--active={activeTab === tab.key}
          on:click={() => (activeTab = tab.key)}
        >
          {tab.label}
        </button>
      {/each}
    </nav>
    <main class="monitor-main">
      {#if activeTab === 'monitor'}
        <Monitor />
      {:else if activeTab === 'comm'}
        <Comm />
      {:else}
        <Style />
      {/if}
    </main>
  {:else}
    <!-- Widget 模式:聚合页里只展示精简卡片 -->
    <Widget />
  {/if}
</div>

<style>
  /* scoped:Svelte 编译期为选择器追加 svelte-xxx 哈希,天然具备组件级样式隔离 */
  .monitor-app {
    font-family: 'Segoe UI', 'PingFang SC', sans-serif;
  }
  .monitor-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: linear-gradient(90deg, #5c2e0e, #b3541e);
    border-radius: 8px;
    margin-bottom: 12px;
  }
  .monitor-nav__brand {
    color: #fff;
    font-weight: 700;
    margin-right: 12px;
  }
  .monitor-nav__brand em {
    font-style: normal;
    font-size: 12px;
    opacity: 0.75;
  }
  .monitor-nav__tab {
    border: none;
    background: transparent;
    color: #ffe3c2;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 2px;
  }
  .monitor-nav__tab--active {
    color: #fff;
    border-bottom: 2px solid #ffd166;
  }
  .monitor-main {
    min-height: 300px;
  }
</style>
