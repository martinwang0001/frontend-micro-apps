<template>
  <!-- 子应用容器页:所有路由挂载的微应用共享这一个容器 -->
  <div>
    <div class="pf-card" style="margin-bottom: 10px; padding: 10px 16px">
      <span class="pf-tag">{{ currentApp?.title }}</span>
      <span style="font-size: 12px; color: var(--p-text-sub); margin-left: 8px">
        {{ currentApp?.tech }} · entry: {{ currentApp?.entry }} · 沙箱:
        {{ sandboxDesc }}
      </span>
    </div>
    <!--
      双容器方案(企业级隔离策略):
      - #subapp-viewport:qiankun registerMicroApps 路由模式统一挂载点(scoped 隔离)
      - #subapp-cms-viewport:react-cms 专用(loadMicroApp 手动加载 + strictStyleIsolation Shadow DOM)
      【坑点】qiankun registerMicroApps 路由模式只读 start() 全局 sandbox,不读应用级 sandbox 字段,
      故 react-cms 的 Shadow DOM 隔离必须通过 loadMicroApp 手动加载实现(loadMicroApp 支持应用级配置)
    -->
    <div id="subapp-viewport" v-show="!isCms"></div>
    <div id="subapp-cms-viewport" v-show="isCms"></div>
  </div>
</template>

<script setup>
/**
 * 【坑点说明】
 * 1. 容器 id 必须与注册表 container 字段一致('#subapp-viewport');
 * 2. 同一个容器被所有路由应用复用,qiankun 会在切换时自动 unmount 上一个;
 * 3. 本组件只负责"提供容器",应用的装载/卸载完全由 qiankun 依据 activeRule 驱动;
 * 4. react-cms 是例外:它需要 Shadow DOM 隔离(strictStyleIsolation),但 registerMicroApps
 *    路由模式不读应用级 sandbox,所以在本组件中用 loadMicroApp 手动加载到独立容器。
 */
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { loadMicroApp } from 'qiankun'
import { microApps } from '../micro/registry'
import { appStore, eventBus } from '../micro/instances'

const route = useRoute()

/** 当前命中的子应用注册信息(顶部信息条展示) */
const currentApp = computed(() =>
  microApps.find((app) => route.path.startsWith(app.activeRule))
)

/** 是否当前路由命中 react-cms(需要 Shadow DOM 隔离的特殊应用) */
const isCms = computed(() => route.path.startsWith('/app-react-cms'))

/** 沙箱模式描述文案 */
const sandboxDesc = computed(() => {
  const sandbox = currentApp.value?.sandbox
  if (sandbox?.strictStyleIsolation) return 'Shadow DOM 严格隔离(loadMicroApp)'
  if (sandbox?.experimentalStyleIsolation) return 'scoped 样式隔离 + JS 快照沙箱'
  return '仅 JS 快照沙箱'
})

/**
 * react-cms 手动加载管理
 * ---------------------------------------------------------------
 * 【为什么需要手动加载?】
 * qiankun registerMicroApps 路由模式下,sandbox 配置只从 start() 全局读取,
 * registerMicroApps 中传入的应用级 sandbox 字段被忽略。因此:
 * - 其他 7 个应用:通过全局 start({ sandbox: { experimentalStyleIsolation } }) 启用 scoped 隔离
 * - react-cms:需要 strictStyleIsolation(Shadow DOM),只能用 loadMicroApp 手动加载
 *   (loadMicroApp 的第 2 参数支持应用级 sandbox 配置)
 */
const CMS_NAME = 'app-react-cms'
let cmsInstance = null

/** 加载 react-cms 到独立容器(带 Shadow DOM 隔离) */
async function ensureCmsMounted() {
  // 已加载则跳过(避免重复 mount)
  if (cmsInstance) return
  const app = microApps.find((a) => a.name === CMS_NAME)
  if (!app) return
  cmsInstance = loadMicroApp(
    {
      name: app.name,
      entry: app.entry,
      // 使用独立容器,不与 registerMicroApps 的 #subapp-viewport 冲突
      container: '#subapp-cms-viewport',
      props: { store: appStore, eventBus, appTitle: app.title }
    },
    // 【关键】loadMicroApp 第 2 参数支持应用级 sandbox 配置
    // strictStyleIsolation 会把子应用整体挂载进 Shadow DOM,内外样式完全互不可见
    { sandbox: { strictStyleIsolation: true } }
  )
}

/** 卸载 react-cms(离开路由时调用,清理 Shadow DOM 与 JS 实例) */
async function ensureCmsUnmounted() {
  if (!cmsInstance) return
  await cmsInstance.unmount()
  cmsInstance = null
}

// 首次挂载:如果直接进入 react-cms 路由(如刷新/分享链接),需要手动加载
onMounted(async () => {
  if (isCms.value) {
    await ensureCmsMounted()
  }
})

// 路由变化监听:进入 react-cms 时加载,离开时卸载
watch(isCms, async (cms) => {
  if (cms) {
    await ensureCmsMounted()
  } else {
    await ensureCmsUnmounted()
  }
})

// 组件销毁前清理(防泄漏)
onBeforeUnmount(() => {
  ensureCmsUnmounted()
})
</script>
