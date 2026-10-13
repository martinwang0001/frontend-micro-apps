<!--
  监控速览 Widget(精简卡片)
  ---------------------------------------------------------------
  【职责】
  供主应用聚合页以"指定 ID 容器 + loadMicroApp"方式挂载时展示的精简视图:
  - 4 个迷你指标(CPU / 内存 / QPS / 错误率,本地随机 mock 一次);
  - 共享 store 的 cartCount,验证 widgetMode 下跨应用状态依然同步。

  【要点】
  1. widgetMode 下共享 Store 仍由主应用经 props 下发(见 main.js),
     数据与路由挂载模式完全同源;
  2. 无路由(Svelte 本地状态),聚合页 URL 属于主应用,天然无路由冲突;
  3. 作为聚合卡片,不启动定时器(避免聚合页挂 N 个 widget 时定时器爆炸),
     只取一次快照 —— 这也是 widget 与完整业务页的职责分界。
-->
<script>
  import { onMount } from 'svelte'
  import { asSvelteReadable } from '@micro/shared/svelte'
  import { getSharedContext } from '../shared-context'

  /** 共享 store:$ 自动订阅,组件销毁自动退订 */
  const shared = asSvelteReadable(getSharedContext().store)

  /** 迷你指标快照(widget 模式只取一次,不启动定时器,见文件头要点 3) */
  let snapshot = { cpu: '-', mem: '-', qps: '-', err: '-' }

  onMount(() => {
    snapshot = {
      cpu: Math.round(20 + Math.random() * 75),
      mem: Math.round(30 + Math.random() * 62),
      qps: Math.round(800 + Math.random() * 4200),
      err: Number((Math.random() * 8).toFixed(1))
    }
  })
</script>

<div class="monitor-widget monitor-card">
  <h4>📈 监控速览 <span class="monitor-widget__tag">Widget 模式 · ID 容器挂载</span></h4>
  <div class="monitor-widget__row">
    <div class="monitor-widget__item">
      <span class="monitor-widget__num">{snapshot.cpu}%</span>
      <span class="monitor-widget__label">CPU</span>
    </div>
    <div class="monitor-widget__item">
      <span class="monitor-widget__num">{snapshot.mem}%</span>
      <span class="monitor-widget__label">内存</span>
    </div>
    <div class="monitor-widget__item">
      <span class="monitor-widget__num">{snapshot.qps}</span>
      <span class="monitor-widget__label">QPS</span>
    </div>
    <div class="monitor-widget__item">
      <span class="monitor-widget__num">{snapshot.err}%</span>
      <span class="monitor-widget__label">错误率</span>
    </div>
    <div class="monitor-widget__item">
      <span class="monitor-widget__num monitor-widget__num--shared">{$shared.cartCount}</span>
      <span class="monitor-widget__label">购物车(共享 Store)</span>
    </div>
  </div>
</div>

<style>
  .monitor-widget h4 {
    margin: 0 0 10px;
    color: #5c2e0e;
    font-size: 14px;
  }
  .monitor-widget__tag {
    font-size: 11px;
    color: #8896a6;
    font-weight: 400;
  }
  .monitor-widget__row {
    display: flex;
    gap: 18px;
  }
  .monitor-widget__item {
    display: flex;
    flex-direction: column;
  }
  .monitor-widget__num {
    font-size: 20px;
    font-weight: 700;
    color: #b3541e;
  }
  /* 共享 store 数据用强调色,便于在聚合页识别"跨应用同步"的效果 */
  .monitor-widget__num--shared {
    color: #1b5e8f;
  }
  .monitor-widget__label {
    font-size: 11px;
    color: #8896a6;
  }
</style>
