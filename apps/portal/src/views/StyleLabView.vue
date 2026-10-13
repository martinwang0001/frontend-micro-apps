<template>
  <div>
    <!-- 隔离机制说明 -->
    <div class="pf-card">
      <h3>🎨 样式隔离实验室</h3>
      <table class="pf-table">
        <thead>
          <tr><th>手段</th><th>原理</th><th>本项目应用点</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="pf-tag pf-tag--orange">experimentalStyleIsolation</span></td>
            <td>
              qiankun 运行时给<b>子应用自己的样式表</b>选择器追加 div[data-qiankun] 前缀,实现 scoped 化<br>
              <b style="color:#e8890c">局限:</b>无法阻挡主应用/全局的<b>标签选择器</b>(p/h1/a…)穿透进来 —— 见下方污染实验
            </td>
            <td>除 react-cms 外的全部子应用</td>
          </tr>
          <tr>
            <td><span class="pf-tag pf-tag--red">strictStyleIsolation</span></td>
            <td>子应用整体挂载进 Shadow DOM,内外样式完全互不可见(弹窗类库需指定挂载点)<br><b style="color:#2e9e5b">优势:</b>唯一能阻断全局标签选择器穿透的方案</td>
            <td>app-react-cms(内容管理)</td>
          </tr>
          <tr>
            <td><span class="pf-tag">框架级 scoped / CSS Modules</span></td>
            <td>编译期生成唯一属性/哈希类名,组件级隔离</td>
            <td>Vue 全系(scoped)、React 商城(CSS Modules)</td>
          </tr>
          <tr>
            <td><span class="pf-tag pf-tag--green">工程规范</span></td>
            <td>BEM 命名 + 应用前缀;CSS 变量挂应用根类而非 :root;老项目全局样式收敛</td>
            <td>所有子应用 styles 目录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 污染对照实验(在基座自己身上演示,安全可控) -->
    <div class="pf-card">
      <h3>🧪 污染对照实验</h3>
      <p style="font-size: 13px">
        点击下方按钮,会向 <code>&lt;head&gt;</code> 注入一段
        <code>p { color: red !important; background: yellow }</code> 的全局污染样式 ——
        这正是"老项目无隔离接入"时的典型事故。再点一次移除。
      </p>
      <div style="font-size: 13px; background: var(--p-card-bg); border-left: 4px solid #e8890c; padding: 10px 14px; margin: 10px 0">
        <b>⚠️ 关键坑点 —— scoped 隔离挡不住「全局标签选择器」</b>
        <p style="margin: 6px 0 0; line-height: 1.8">
          <code>experimentalStyleIsolation</code> 只给<b>子应用自己的样式表</b>加
          <code>div[data-qiankun]</code> 前缀,但<b>主应用 head 中的全局标签选择器</b>
          (<code>p / h1 / a</code> 这类)不会被改写,子应用 DOM 又在普通文档树中,
          所以标签选择器 + <code>!important</code> 会直接穿透到子应用内部。
          这不是 bug,而是 scoped 隔离方案的天生短板。
        </p>
      </div>
      <p style="font-size: 13px; margin: 10px 0 6px">
        <b>正确对照方式(注入后逐个对比):</b>
      </p>
      <ul style="font-size: 13px; line-height: 1.9; margin: 0 0 10px; padding-left: 20px">
        <li>基座(本页)与 <b>scoped 隔离</b>子应用(数据看板/用户中心/积分商城/监控告警…) → 段落被污染变红黄 ❌</li>
        <li><b>Shadow DOM</b> 子应用 → <a href="/app-react-cms" target="_blank">内容管理(react-cms)</a> → 段落不受影响 ✅</li>
      </ul>
      <p style="font-size: 13px; color: var(--p-text-sub); margin: 0">
        结论:全局/标签选择器场景必须用 <code>strictStyleIsolation</code>(Shadow DOM) 才能真正阻断;
        <code>experimentalStyleIsolation</code> 只防"子应用样式泄漏出去",不防"全局样式灌进来"。
      </p>
      <button class="pf-btn pf-btn--primary" @click="togglePollution">
        {{ polluted ? '移除污染样式' : '注入污染样式' }}
      </button>
    </div>

    <!-- JS 沙箱说明 -->
    <div class="pf-card">
      <h3>🧊 JS 沙箱(qiankun snapshot sandbox)</h3>
      <p style="font-size: 13px; line-height: 1.9; margin: 0">
        子应用 mount 时对 window 打快照,运行期间对 window 的增删改被记录;
        unmount 时回滚快照,子应用写入的全局变量(如老项目常见的
        <code>window.$ / window.globalConfig</code>)随之蒸发,
        既不污染基座,也不影响下一个挂载的应用。
        用户中心(Vue2 老项目)演示了 <code>window.LEGACY_GLOBAL</code> 的写入与自动回收:
        进入用户中心 → 离开 → 在控制台访问 <code>window.LEGACY_GLOBAL</code> 为 undefined。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

/** 是否已注入污染样式 */
const polluted = ref(false)

/** 污染 style 节点 id(方便精确移除) */
const POLLUTION_ID = 'portal-pollution-demo'

/** 注入 / 移除全局污染样式 */
const togglePollution = () => {
  if (polluted.value) {
    document.getElementById(POLLUTION_ID)?.remove()
    polluted.value = false
    return
  }
  const style = document.createElement('style')
  style.id = POLLUTION_ID
  style.textContent = 'p { color: red !important; background: yellow !important; }'
  document.head.appendChild(style)
  polluted.value = true
}
</script>
