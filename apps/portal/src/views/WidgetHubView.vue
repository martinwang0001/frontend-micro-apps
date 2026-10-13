<template>
  <div>
    <div class="pf-card">
      <h3>🧱 聚合页 —— 指定 ID 容器挂载(loadMicroApp)</h3>
      <p style="font-size: 13px; color: var(--p-text-sub); margin: 0">
        本页 URL 属于基座(<code>/hub</code>)。下方 4 个单元格各有固定 id,
        进入页面时通过 <code>loadMicroApp</code> 把 4 个子应用手动挂载进去,
        离开时统一 <code>unmount</code>。带路由的应用以 <code>widgetMode</code>(内存路由)运行。
      </p>
    </div>

    <!-- 聚合网格:每个单元格就是一个指定 ID 的挂载容器 -->
    <div class="pf-hub-grid">
      <div v-for="w in widgets" :key="w.containerId" class="pf-hub-cell">
        <div class="pf-hub-cell__head">
          <span>{{ w.title }}</span>
          <span class="pf-hub-cell__id">container: #{{ w.containerId }}</span>
        </div>
        <!-- 指定 ID 容器:qiankun 会把子应用渲染进这个 div -->
        <div :id="w.containerId"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 聚合页(ID 容器挂载演示)
 * ---------------------------------------------------------------
 * 【与路由挂载的差异】
 *  - 路由挂载:qiankun 监听 URL 变化,activeRule 命中后自动 mount 到注册容器;
 *  - ID 容器挂载:业务页面主动调用 loadMicroApp({ container: '#xxx' }),
 *    可同时挂载多个(singular:false),适合大盘/工作台类"一屏多应用"场景。
 *
 * 【坑点】
 *  1. 本页 URL 是 /hub,带 history 路由的子应用会 404 —— 必须以 widgetMode
 *     (memory 路由)挂载,见各子应用 main.js;
 *  2. 手动挂载的应用不会自动卸载,页面离开时必须逐个 unmount,
 *     否则定时器/订阅继续存活(泄漏);
 *  3. loadMicroApp 的 name 可与注册表一致,但两种挂载方式互不冲突。
 */
import { onMounted, onBeforeUnmount } from 'vue'
import { loadMicroApp } from 'qiankun'
import { appStore, eventBus } from '../micro/instances'

/** 聚合单元格配置:containerId 即"指定 ID 容器" */
const widgets = [
  { containerId: 'widget-dashboard', name: 'app-vue3-dashboard', entry: '//localhost:8083', title: '数据看板 · Vue3' },
  { containerId: 'widget-report', name: 'app-vue3-report', entry: '//localhost:8084', title: '报表中心 · Vue3' },
  { containerId: 'widget-cms', name: 'app-react-cms', entry: '//localhost:8086', title: '内容管理 · React(Shadow DOM)' },
  { containerId: 'widget-monitor', name: 'app-svelte-monitor', entry: '//localhost:8087', title: '监控告警 · Svelte' }
]

/** 已挂载的微应用实例句柄,卸载时需要 */
let mountedApps = []

onMounted(async () => {
  /**
   * 【并发挂载坑点 —— 必须串行】
   * vite-plugin-qiankun 在 dev 下通过「全局唯一插槽」window.proxy.qiankunName
   * 传递应用名来完成生命周期注册;同时 loadMicroApp 多个应用时,异步的入口模块
   * 执行会互相覆盖该插槽,导致生命周期张冠李戴(表象:bootstrap 超时 single-spa
   * #31 / Vue unmount 报 instances 读取异常)。
   * => 手动挂载多个 widget 时按 mountPromise 逐个串行挂载,等效于路由切换的
   *    天然串行,问题即解。生产构建(UMD)无此问题。
   * 同时用 try/catch 做单点隔离:一个 widget 失败不影响其余挂载。
   */
  for (const w of widgets) {
    try {
      const parcel = loadMicroApp(
        {
          name: w.name,
          entry: w.entry,
          container: `#${w.containerId}`,
          // 下发共享实例 + 告知 widget 模式(子应用据此切换 memory 路由 / 精简视图)
          props: { store: appStore, eventBus, widgetMode: true }
        },
        // 【坑点】widget 的 sandbox 按应用区分:
        // react-cms 用 strictStyleIsolation(Shadow DOM);其他用 experimentalStyleIsolation(scoped)
        // loadMicroApp 支持应用级 sandbox 配置(与 registerMicroApps 不同)
        { sandbox: w.name === 'app-react-cms' ? { strictStyleIsolation: true } : { experimentalStyleIsolation: true } }
      )
      mountedApps.push(parcel)
      // 关键:等待该 widget 完成挂载再挂下一个(串行化,见上方坑点说明)
      await parcel.mountPromise
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[portal] widget「${w.name}」挂载失败:`, err)
    }
  }
})

onBeforeUnmount(async () => {
  // 关键清理:手动挂载的应用必须手动卸载(坑点)
  await Promise.all(mountedApps.map((app) => app.unmount()))
  mountedApps = []
})
</script>
