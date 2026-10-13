<template>
  <div class="report-style">
    <h2>样式隔离演示</h2>

    <!-- scoped 样式说明卡 -->
    <section class="report-card report-style__section">
      <h3>本应用的隔离手段</h3>
      <ul class="report-style__list">
        <li>组件样式一律 <code>&lt;style scoped&gt;</code>(编译期追加 data-v 属性选择器)</li>
        <li>全局样式仅放设计变量与基础类,且统一 <code>report-</code> BEM 前缀</li>
        <li>CSS 变量挂在 <code>.report-app</code> 根类,而非 <code>:root</code>,避免变量互相覆盖</li>
        <li>主应用对本应用启用 <code>experimentalStyleIsolation</code>(运行时再加一道 scoped 前缀)</li>
      </ul>
      <p class="report-style__demo-text">
        这段文字的颜色来自 <code>scoped</code> 样式,即使其它应用定义了同名类也不会被污染。
      </p>
    </section>

    <!-- 污染对照实验 -->
    <section class="report-card report-style__section">
      <h3>污染对照实验</h3>
      <p class="report-style__bad">左侧:若我在全局写 <code>p { color: red }</code>(无沙箱时所有应用的段落都会变红)。</p>
      <p>右侧:实际开启了样式沙箱,我的全局样式不会泄漏到主应用与其它子应用。</p>
    </section>
  </div>
</template>

<script setup>
// 纯展示页,无逻辑;样式隔离的实际效果由主应用 sandbox 配置保证
</script>

<style scoped>
.report-style h2 {
  margin: 0 0 14px;
  color: #3b1d75;
}
.report-style__section {
  margin-bottom: 12px;
}
.report-style__section h3 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #3b1d75;
}
.report-style__list {
  margin: 0 0 10px;
  padding-left: 18px;
  line-height: 1.9;
  font-size: 13px;
}
.report-style__demo-text {
  color: #6d3fd1;
  font-weight: 600;
}
.report-style__bad {
  color: #d64545;
}
code {
  background: #f1edf9;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
