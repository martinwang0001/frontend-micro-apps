<template>
  <!-- 根类名 user-style:BEM 命名空间,本页所有私有类都挂在它下面 -->
  <div class="user-style">
    <h2>样式隔离演示(老项目的样式债务治理)</h2>
    <!-- 阅读动线:债务清单 -> 双重防护 -> 沙箱回收验证,
         * 三个 section 按"提出问题 -> 给出方案 -> 实验验证"展开 -->

    <!-- 老项目样式债务说明卡:先讲清"病"在哪里 -->
    <!-- 以下债务清单均来自真实老项目评审记录,非虚构 -->
    <section class="user-card user-style__section">
      <h3>老项目的样式债务</h3>
      <ul class="user-style__list">
        <!-- 债务一:裸标签/裸类选择器,全局命中 -->
        <li>历史全局样式无命名规范,大量 <code>p {}</code> / <code>.btn {}</code> 裸选择器</li>
        <!-- 债务二:优先级军备竞赛 -->
        <li>多代开发者叠加 <code>!important</code> 与超高优先级选择器互相压制</li>
        <!-- 债务三:全局变量污染 -->
        <li>全局变量挂在 <code>:root</code>,不同模块同名变量互相覆盖</li>
        <!-- 债务四:单应用思维在微前端下直接爆炸 -->
        <li>单应用时代"能跑就行",接入微前端后这些写法会直接污染主应用与其它子应用</li>
        <!-- 债务五:弹窗类组件挂载到 body,逃离应用容器,样式沙箱管不到 -->
        <li>弹窗/浮层挂载在 <code>body</code> 下,样式易与应用容器脱节</li>
      </ul>
    </section>

    <!-- 本应用的隔离手段:双重防护(自律 + 他律) -->
    <!-- experimentalStyleIsolation 的实现:给每条 CSS 规则加属性选择器前缀 -->
    <!-- 两道防线设计哲学:规范防"无意",沙箱防"万一" -->
    <section class="user-card user-style__section">
      <h3>本应用的隔离手段(双重防护)</h3>
      <ul class="user-style__list">
        <!-- 第一道:代码规范层面的自律 -->
        <li>
          <b>第一道(自律):</b>全局样式统一 <code>user-</code> BEM 前缀,
          组件内一律 <code>&lt;style scoped&gt;</code>;
          CSS 变量挂在 <code>.user-app</code> 根类而非 <code>:root</code>,
          即使沙箱完全失效也不会冲掉别家应用
        </li>
        <!-- 第二道:qiankun 沙箱层面的他律(注册表 sandbox 配置) -->
        <li>
          <b>第二道(他律):</b>主应用注册本应用时开启了
          <code>experimentalStyleIsolation</code>,qiankun 运行时会给本应用
          所有样式选择器追加 <code>div[data-qiankun-app-vue2-user]</code>
          属性前缀,从机制上杜绝样式泄漏
        </li>
      </ul>
      <!-- 对照文字:颜色来自本组件 scoped 样式 -->
      <!-- 可在 devtools 中检查本段文字的 class,能看到 data-v-xxx 属性 -->
      <p class="user-style__demo-text">
        这段文字的颜色来自 scoped 样式,即使其它应用定义了同名类也不会被污染。
      </p>
    </section>

    <!-- JS 快照沙箱与全局污染回收(呼应 HomeView 的 LEGACY_GLOBAL 演示) -->
    <!-- 快照沙箱原理:mount 拍快照 -> 运行期记录变更 -> unmount 恢复 -->
    <!-- 本节与「用户列表」页联动讲解,建议先访问列表页再回来看结论 -->
    <section class="user-card user-style__section">
      <h3>延伸:JS 快照沙箱与全局变量回收</h3>
      <p class="user-style__para">
        本应用「用户列表」页在 created 中写入了
        <code>window.LEGACY_GLOBAL</code> —— 这是老项目最典型的全局污染。
        qiankun 的 JS 快照沙箱会在本应用 <code>unmount</code> 时把 window
        恢复到挂载前的状态,该变量随之被回收:
      </p>
      <!-- 验证步骤:切走本应用 -> 控制台执行 window.LEGACY_GLOBAL -> undefined -->
      <p class="user-style__bad">
        验证方式:从主应用切到其它应用后,控制台执行
        <code>window.LEGACY_GLOBAL</code>,结果为 <code>undefined</code>。
      </p>
      <!-- 结论段:沙箱兜底 ≠ 可以乱写 -->
      <!-- 治理建议:新代码走规范,旧代码靠沙箱,逐步重构而非一次性重写 -->
      <p class="user-style__para">
        结论:沙箱兜住了老项目的债务,但新代码仍应通过共享上下文传值,
        不要再往 window 上挂东西。
      </p>
    </section>
  </div>
</template>

<script>
/**
 * 样式隔离演示页(Options API)
 * ---------------------------------------------------------------
 * 纯展示页,无业务逻辑;样式隔离的实际效果由两道防护共同保证:
 *   1. 本应用的样式规范(user- 前缀 + scoped + 根类变量);
 *   2. 主应用注册时配置的 experimentalStyleIsolation 沙箱。
 * 本页同时承担"JS 快照沙箱回收全局污染"的讲解,与 HomeView 的
 * window.LEGACY_GLOBAL 演示形成呼应。
 *
 * 【沙箱能力边界(老项目最关心)】
 *   - 能兜住:本应用的全局样式泄漏、window 新增全局属性(快照回收);
 *   - 兜不住:往 document.head 动态插入的 <link> CDN 样式、
 *     挂到 :root 的 CSS 变量、以及挂载到 body 下的弹窗 DOM。
 *   结论:沙箱是底线,规范才是上限。
 */
export default {
  // 纯展示组件:无 data / methods,仅靠模板与样式完成讲解
  name: 'UserStyleView'
}
</script>

<style scoped>
/* 本页样式全部 scoped:与全局样式(styles/index.css)互不干扰 */
/* 页标题 */
.user-style h2 {
  margin: 0 0 14px;
  color: #3b2f63;
}
/* ---- 布局 ---- */
/* 区块间距:三个 section 节奏一致,阅读体验更平稳 */
.user-style__section {
  margin-bottom: 12px;
}
/* 区块小标题 */
.user-style__section h3 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #3b2f63;
}
/* ---- 内容 ---- */
/* 说明列表 */
.user-style__list {
  margin: 0;
  padding-left: 18px;
  line-height: 1.9;
  font-size: 13px;
}
/* 段落说明文字 */
.user-style__para {
  font-size: 13px;
  line-height: 1.9;
  margin: 0 0 8px;
}
/* ---- 对照文字 ---- */
/* demo-text(紫) 与 bad(红) 构成"安全/危险"的色觉对照 */
/* 对照文字:scoped 防护演示(紫色 = 本组件私有) */
.user-style__demo-text {
  color: #6a4c93;
  font-weight: 600;
  margin: 10px 0 0;
}
/* 对照文字:污染风险提示(红色,与"危险操作"语义绑定) */
.user-style__bad {
  color: #d64545;
  font-size: 13px;
}
/* ---- 通用 ---- */
/* 行内代码样式:浅紫底与应用主色系一致 */
code {
  background: #f0ebf8;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
