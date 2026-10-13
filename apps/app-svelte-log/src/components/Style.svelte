<!--
  样式隔离演示(日志中心侧)
  ---------------------------------------------------------------
  【职责】讲解本应用的样式双层防护:
    1. 编译期:Svelte 组件 <style> 默认 scoped —— 编译器为每个选择器
       追加 `svelte-xxx` 哈希类,组件间同名类天然不冲突(对比 Vue 需要
       手写 scoped 属性、React 需要 CSS Modules,Svelte 是默认行为);
    2. 运行时:qiankun experimentalStyleIsolation 为子应用样式再加一层
       属性选择器前缀,防止子应用全局样式污染主应用。

  【工程规范(第三道防线)】
  即使前两道防线都失效,统一 log- 前缀 + BEM 命名也能兜底;
  CSS 变量挂在 .log-app 根类而非 :root,避免变量名互相覆盖。
-->
<div class="log-style">
  <h2>样式隔离演示</h2>

  <!-- 隔离手段说明卡 -->
  <section class="log-card log-style__section">
    <h3>本应用的隔离手段</h3>
    <ul class="log-style__list">
      <li>组件样式写在 <code>&lt;style&gt;</code> 中,Svelte 编译期默认 scoped(自动追加 <code>svelte-xxx</code> 哈希类)</li>
      <li>全局样式仅放设计变量与基础类,且统一 <code>log-</code> BEM 前缀</li>
      <li>CSS 变量挂在 <code>.log-app</code> 根类,而非 <code>:root</code>,避免变量互相覆盖</li>
      <li>主应用对本应用启用 <code>experimentalStyleIsolation</code>(运行时再加一道前缀)</li>
    </ul>
    <p class="log-style__demo-text">
      这段文字的颜色来自 scoped 样式,即使其它应用定义了同名类也不会被污染。
    </p>
  </section>

  <!-- 污染对照实验 -->
  <section class="log-card log-style__section">
    <h3>污染对照实验</h3>
    <p class="log-style__bad">左侧:若我在全局写 <code>p {'{ color: red }'}</code>(无沙箱时所有应用的段落都会变红)。</p>
    <p>右侧:实际开启了样式沙箱 + Svelte 编译期 scoped,我的样式不会泄漏到主应用与其它子应用。</p>
  </section>
</div>

<style>
  .log-style h2 {
    margin: 0 0 14px;
    color: #07332b;
  }
  .log-style__section {
    margin-bottom: 12px;
  }
  .log-style__section h3 {
    margin: 0 0 10px;
    font-size: 15px;
    color: #07332b;
  }
  .log-style__list {
    margin: 0 0 10px;
    padding-left: 18px;
    line-height: 1.9;
    font-size: 13px;
  }
  .log-style__demo-text {
    color: #0e6b5c;
    font-weight: 600;
  }
  .log-style__bad {
    color: #d64545;
  }
  code {
    background: #e3f2ef;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
</style>
