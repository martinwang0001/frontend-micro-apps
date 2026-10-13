<template>
  <div>
    <!-- 架构示意:纯 CSS 绘制,零图片依赖 -->
    <div class="pf-card">
      <h3>🏗️ 平台架构(qiankun 微前端)</h3>
      <div class="arch">
        <div class="arch__box arch__box--portal">
          <b>主应用 portal :8000</b>
          <span>Vue3 + qiankun · 应用注册 / 沙箱 / 共享实例下发 / 基座导航</span>
        </div>
        <div class="arch__arrow">▼ 注册 & props 下发(store / eventBus / qiankunActions)</div>
        <div class="arch__grid">
          <div v-for="app in microApps" :key="app.name" class="arch__box">
            <b>{{ app.title }}</b>
            <span>{{ app.tech }}</span>
            <span class="arch__port">{{ app.entry }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 注册表:单一事实来源 -->
    <div class="pf-card">
      <h3>📋 子应用注册表(共 {{ microApps.length }} 个)</h3>
      <table class="pf-table">
        <thead>
          <tr>
            <th>应用</th><th>技术栈</th><th>路由挂载</th><th>ID 容器挂载</th><th>样式沙箱</th><th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in microApps" :key="app.name">
            <td>{{ app.title }}<br /><small style="color: var(--p-text-sub)">{{ app.name }}</small></td>
            <td>{{ app.tech }}</td>
            <td><span class="pf-tag">{{ app.activeRule }}</span></td>
            <td>
              <span v-if="app.widget" class="pf-tag pf-tag--green">支持(聚合页)</span>
              <span v-else class="pf-tag">仅路由</span>
            </td>
            <td>
              <span v-if="app.sandbox.strictStyleIsolation" class="pf-tag pf-tag--red">Shadow DOM</span>
              <span v-else class="pf-tag pf-tag--orange">scoped 隔离</span>
            </td>
            <td>
              <span class="pf-tag" :class="statusClass(app.name)">{{ statusText(app.name) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 坑点清单 -->
    <div class="pf-card">
      <h3>⚠️ 本项目覆盖的微前端坑点</h3>
      <table class="pf-table">
        <thead><tr><th>坑点</th><th>本项目对策</th><th>代码位置</th></tr></thead>
        <tbody>
          <tr>
            <td>样式污染(全局 CSS / CSS 变量互相覆盖)</td>
            <td>scoped 隔离 / Shadow DOM / BEM 前缀 / 变量挂应用根类</td>
            <td>registry.js sandbox 配置 + 各应用 styles</td>
          </tr>
          <tr>
            <td>全局标签选择器穿透 scoped 隔离(p/h1/a + !important)</td>
            <td>experimentalStyleIsolation 挡不住;用 strictStyleIsolation(Shadow DOM)阻断,或工程规范禁用标签选择器</td>
            <td>样式隔离实验室污染对照实验 + react-cms(Shadow DOM)</td>
          </tr>
          <tr>
            <td>模块多实例(各应用各自 new store 互不相通)</td>
            <td>主应用创建唯一实例,qiankun props 下发</td>
            <td>micro/instances.js → setup.js props</td>
          </tr>
          <tr>
            <td>路由 base 冲突(history 模式 404)</td>
            <td>qiankun 模式 base=activeRule;widget 模式用 memory 路由</td>
            <td>各子应用 main.js</td>
          </tr>
          <tr>
            <td>子应用 vue-router 与基座共享 history API → replaceState 冲突 + 导航卡死</td>
            <td>qiankun 模式下子应用一律用 memory/abstract 路由,不操作 history;standalone 保留 web history;unmount 调 router.destroy()</td>
            <td>各子应用 main.js 路由模式分流 + unmount</td>
          </tr>
          <tr>
            <td>registerMicroApps 不读应用级 sandbox 字段(只读 start() 全局配置)</td>
            <td>全局 start({ sandbox: { experimentalStyleIsolation } }) 给多数应用 scoped 隔离;Shadow DOM 应用用 loadMicroApp 手动加载(支持应用级 sandbox)</td>
            <td>setup.js start 配置 + SubappView loadMicroApp</td>
          </tr>
          <tr>
            <td>定时器/监听器泄漏(反复挂载叠加)</td>
            <td>unmount 统一清理;适配器自动退订</td>
            <td>各应用 unmount + @micro/shared 适配器</td>
          </tr>
          <tr>
            <td>静态资源路径错误(dev 模式拼到主应用域名)</td>
            <td>vite server.origin 显式声明 + 跨域头</td>
            <td>各子应用 vite.config.js</td>
          </tr>
          <tr>
            <td>首屏切换白屏</td>
            <td>start({ prefetch: 'all' }) 空闲预取</td>
            <td>micro/setup.js</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 实时挂载状态 -->
    <div class="pf-card">
      <h3>🚦 应用挂载状态(qiankun 生命周期钩子驱动)</h3>
      <div class="arch__status">
        <span v-for="app in microApps" :key="app.name" class="pf-tag" :class="statusClass(app.name)">
          {{ app.title }}:{{ statusText(app.name) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { microApps } from '../micro/registry'
import { useGlobalStore } from '../store/global'

const { appStatus } = storeToRefs(useGlobalStore())

/** 状态文案:未进入过为"待挂载" */
const statusText = (name) => {
  const s = appStatus.value[name]
  return { mounting: '挂载中', mounted: '运行中', unmounted: '已卸载' }[s] || '待挂载'
}

/** 状态配色 */
const statusClass = (name) => {
  const s = appStatus.value[name]
  if (s === 'mounted') return 'pf-tag--green'
  if (s === 'mounting') return 'pf-tag--orange'
  return ''
}
</script>

<style scoped>
.arch {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.arch__box {
  border: 1px solid var(--p-border);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--p-text-sub);
  background: var(--p-card-bg);
}
.arch__box b {
  color: var(--p-text);
  font-size: 13px;
}
.arch__box--portal {
  border-color: var(--p-primary);
  border-width: 2px;
}
.arch__arrow {
  text-align: center;
  font-size: 12px;
  color: var(--p-text-sub);
}
.arch__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.arch__port {
  font-family: monospace;
  font-size: 11px;
  color: var(--p-primary);
}
.arch__status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
