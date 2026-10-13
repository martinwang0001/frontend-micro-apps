/**
 * 样式隔离演示页(Shadow DOM 方案)
 * ---------------------------------------------------------------
 * 【职责】讲解本应用被主应用以 strictStyleIsolation(Shadow DOM)挂载的原理与代价:
 *   1. 原理:主应用开启 strictStyleIsolation 后,qiankun 会把本应用整个 DOM 树
 *      挂到一个 Shadow Root 内。Shadow DOM 是浏览器原生样式边界,内部样式不影响
 *      外部,外部样式也不影响内部 —— 隔离是"完全"的,不是前缀 hack。
 *   2. 代价(必须向开发者明示):
 *      - 第三方弹窗(Modal/Message/Tooltip)若 teleport 到 document.body,
 *        会"飞出" Shadow DOM,样式丢失、层级错乱,需要改为 Shadow Root 内挂载;
 *      - 全局字体(@font-face)在 Shadow DOM 内默认不生效,需要在外部加载字体文件
 *        后,在 Shadow DOM 内部再声明一次或使用 font-display: swap 等策略;
 *      - iconfont 的 <symbol> 引用、use xlink:href 在 Shadow DOM 内无法跨边界解析;
 *      - 主应用想覆盖子应用样式(主题换肤)时,需要借助 CSS 自定义属性穿透,
 *        或提供"主题变量注入"接口。
 *   3. 与 scoped(experimentalStyleIsolation)对比:
 *      - scoped 是"选择器前缀改写",隔离是"逻辑上"的,存在穿透与覆盖风险;
 *      - strictStyleIsolation 是"浏览器原生隔离",强但带来上述生态适配成本。
 *      选择依据:子应用技术栈越杂、第三方组件库越多,越倾向 scoped + 规范约束;
 *      对样式纯净度要求极高(如金融级后台),再考虑 strictStyleIsolation。
 *
 * 【坑点】
 * 1. Shadow DOM 内无法直接使用 :root / html / body 选择器,应挂应用根类;
 * 2. 事件会穿透 Shadow DOM 冒泡,但 event.target 会被重定向为 Shadow Host,
 *    依赖精确 target 的第三方库可能行为异常;
 * 3. CSS Modules 在本应用内依然使用,作为 Shadow DOM 内的"第二层编译期隔离",
 *    防止同一 Shadow Root 内多个微应用片段同名类冲突。
 */
import styles from './StylePage.module.css'

export default function StylePage() {
  return (
    <div>
      <h2 className={styles.title}>样式隔离演示(Shadow DOM)</h2>

      {/* 原理说明 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>本应用的挂载方式:strictStyleIsolation</h3>
        <p className={styles.desc}>
          主应用在 <code>registerMicroApps</code> 中为本应用配置
          <code>sandbox: {'{ strictStyleIsolation: true }'}</code>,
          我们的整个 DOM 树被插入一个 Shadow Root。你可以打开 DevTools 查看:
          主应用容器内是一个 <code>#shadow-root</code> 节点,内部才是本应用的 HTML。
        </p>
        <p className={styles.desc}>
          Shadow DOM 是浏览器原生样式边界,内部样式不会泄漏,外部样式也无法侵入,
          隔离强度高于任何运行时前缀改写方案。
        </p>
      </section>

      {/* 代价清单 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>完全隔离的代价</h3>
        <ul className={styles.list}>
          <li>第三方弹窗 teleport 到 body 会"飞出" Shadow DOM,样式丢失</li>
          <li>@font-face / iconfont 在 Shadow DOM 内默认失效,需特殊处理</li>
          <li>主应用想统一换肤时,不能直接覆盖子应用类名,需 CSS 变量穿透</li>
          <li>event.target 在边界处被重定向为 Shadow Host,部分库行为异常</li>
        </ul>
      </section>

      {/* 方案对比表 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>scoped vs Shadow DOM 对比</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>维度</th>
              <th>experimentalStyleIsolation(scoped)</th>
              <th>strictStyleIsolation(Shadow DOM)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>隔离原理</td>
              <td>运行时给选择器加 div[data-qiankun] 前缀</td>
              <td>浏览器原生 Shadow Root 边界</td>
            </tr>
            <tr>
              <td>隔离强度</td>
              <td>逻辑隔离,可能被高优先级选择器穿透</td>
              <td>物理隔离,天然无法穿透</td>
            </tr>
            <tr>
              <td>第三方组件库适配</td>
              <td>基本无感</td>
              <td>弹窗/字体/图标需特殊处理</td>
            </tr>
            <tr>
              <td>主应用主题覆盖</td>
              <td>可直接覆盖</td>
              <td>需 CSS 变量穿透或注入接口</td>
            </tr>
            <tr>
              <td>适用场景</td>
              <td>技术栈杂、组件库多的企业应用</td>
              <td>样式纯净度要求极高的金融级后台</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 结论 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>结论</h3>
        <p className={styles.desc}>
          Shadow DOM 提供最强隔离,但生态适配成本最高。qiankun 默认关闭,
          需要主应用显式开启。本应用作为"教学示例"展示该模式,
          实际项目应根据团队规范与组件库兼容性权衡选择。
        </p>
      </section>
    </div>
  )
}
