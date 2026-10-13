<!--
  监控业务页:指标卡 + 滚动告警列表
  ---------------------------------------------------------------
  【职责】
  - 展示 CPU / 内存 / QPS / 错误率 4 个指标卡,每 1.5s 随机刷新(mock 实时采集);
  - 指标超过阈值时生成一条告警,unshift 进滚动告警列表。

  ★【核心坑点演示 —— 微前端下的定时器清理】
  onMount 里启动的 setInterval,必须在 onDestroy 里 clearInterval!
  微应用在 qiankun 中会反复 mount / unmount(用户每次进出本应用),
  若不清理:
    1. 定时器叠加:进 3 次应用就有 3 个定时器同时刷新,指标跳动 N 倍速;
    2. 内存泄漏:定时器回调持有旧组件实例的闭包,旧组件永远无法被 GC。
  这与框架无关(Vue/React 同样存在),是微前端最高频的资源泄漏点之一。
-->
<script>
  import { onMount, onDestroy } from 'svelte'

  /** 指标配置:key / 名称 / 单位 / 随机区间 / 告警阈值 / 越界方向 */
  const METRICS = [
    { key: 'cpu', name: 'CPU 使用率', unit: '%', min: 20, max: 95, threshold: 80, over: true },
    { key: 'mem', name: '内存占用', unit: '%', min: 30, max: 92, threshold: 85, over: true },
    { key: 'qps', name: 'QPS', unit: '', min: 800, max: 5000, threshold: 4000, over: true },
    { key: 'err', name: '错误率', unit: '%', min: 0, max: 8, threshold: 5, over: true }
  ]

  /** 当前指标值(对象字面量驱动模板,Svelte 重新赋值即触发更新) */
  let metrics = {}

  /** 告警列表:最新在前,只保留最近 8 条 */
  let alarms = []

  /** 定时器句柄:模块内局部变量,onDestroy 时必须清理 */
  let timer = null

  /** 生成一轮随机指标,并按阈值产出告警 */
  function refresh() {
    const next = {}
    const now = new Date().toLocaleTimeString()
    METRICS.forEach((m) => {
      // 在 [min, max] 区间内取随机整数值(QPS 保留整数,错误率保留 1 位小数)
      const raw = m.min + Math.random() * (m.max - m.min)
      const value = m.key === 'err' ? Number(raw.toFixed(1)) : Math.round(raw)
      next[m.key] = value
      // 超过阈值 -> 生成告警(此处 mock 越界即告警)
      if (m.over && value > m.threshold) {
        alarms = [
          {
            time: now,
            level: value > m.threshold * 1.1 ? 'critical' : 'warn',
            text: `${m.name} 达到 ${value}${m.unit},超过阈值 ${m.threshold}${m.unit}`
          },
          ...alarms
        ].slice(0, 8)
      }
    })
    metrics = next
  }

  onMount(() => {
    // 立即采集一次,避免首屏空白
    refresh()
    // ★ 启动定时采集 —— 见文件头"核心坑点演示"
    timer = setInterval(refresh, 1500)
  })

  onDestroy(() => {
    // ★ 必须清理!否则微应用反复挂载时定时器叠加、旧闭包常驻内存
    clearInterval(timer)
    timer = null
  })
</script>

<div class="monitor-biz">
  <h2>服务健康监控</h2>
  <p class="monitor-biz__tip">指标每 1.5s 自动刷新(mock);超过阈值自动生成告警。</p>

  <!-- 指标卡区域 -->
  <div class="monitor-biz__cards">
    {#each METRICS as m}
      <div
        class="monitor-card monitor-biz__metric"
        class:monitor-biz__metric--alarm={metrics[m.key] > m.threshold}
      >
        <span class="monitor-biz__metric-name">{m.name}</span>
        <span class="monitor-biz__metric-value">
          {metrics[m.key] ?? '-'}{m.unit}
        </span>
        <span class="monitor-biz__metric-threshold">阈值 {m.threshold}{m.unit}</span>
      </div>
    {/each}
  </div>

  <!-- 滚动告警列表 -->
  <section class="monitor-card monitor-biz__alarms">
    <h3>实时告警({alarms.length})</h3>
    {#if alarms.length === 0}
      <p class="monitor-biz__empty">暂无告警,服务运行正常 ✅</p>
    {:else}
      <ul class="monitor-biz__alarm-list">
        {#each alarms as alarm}
          <li class="monitor-biz__alarm-item">
            <span class="monitor-biz__alarm-time">{alarm.time}</span>
            <span
              class="monitor-biz__alarm-level"
              class:monitor-biz__alarm-level--critical={alarm.level === 'critical'}
            >
              {alarm.level === 'critical' ? '严重' : '警告'}
            </span>
            <span>{alarm.text}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  /* 以下样式编译期自动 scoped,不会泄漏到其它应用 */
  .monitor-biz h2 {
    margin: 0 0 6px;
    color: #5c2e0e;
  }
  .monitor-biz__tip {
    font-size: 12px;
    color: #8896a6;
    margin: 0 0 14px;
  }
  .monitor-biz__cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }
  .monitor-biz__metric {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .monitor-biz__metric-name {
    font-size: 12px;
    color: #8896a6;
  }
  .monitor-biz__metric-value {
    font-size: 24px;
    font-weight: 700;
    color: #b3541e;
  }
  .monitor-biz__metric-threshold {
    font-size: 11px;
    color: #b6c2cf;
  }
  /* 越阈值时整卡高亮为告警色 */
  .monitor-biz__metric--alarm {
    border-color: #d64545;
  }
  .monitor-biz__metric--alarm .monitor-biz__metric-value {
    color: #d64545;
  }
  .monitor-biz__alarms h3 {
    margin: 0 0 10px;
    font-size: 15px;
    color: #5c2e0e;
  }
  .monitor-biz__empty {
    font-size: 13px;
    color: #8896a6;
    margin: 0;
  }
  .monitor-biz__alarm-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 220px;
    overflow-y: auto;
  }
  .monitor-biz__alarm-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    border-bottom: 1px dashed #eef1f5;
    font-size: 13px;
  }
  .monitor-biz__alarm-time {
    color: #8896a6;
    font-size: 12px;
  }
  .monitor-biz__alarm-level {
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 11px;
    background: #fff4e0;
    color: #b3541e;
  }
  .monitor-biz__alarm-level--critical {
    background: #fde8e8;
    color: #d64545;
  }
</style>
