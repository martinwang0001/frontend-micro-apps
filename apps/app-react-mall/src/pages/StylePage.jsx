/**
 * 样式隔离演示页(CSS Modules 方案)
 * ---------------------------------------------------------------
 * 【职责】展示 React 子应用的"双层样式防护":
 *   第一层(编译期):CSS Modules —— *.module.css 的类名在构建时被哈希化,
 *     例如 .panel -> ._panel_8f3k2_1,其它应用就算写了同名 .panel 也碰不到我;
 *   第二层(运行时):qiankun 沙箱 —— 主应用对本应用开启
 *     experimentalStyleIsolation 时,会为子应用所有选择器自动追加
 *     div[data-qiankun] 属性前缀,子应用样式无法泄漏出去。
 *
 * 【对照实验设计】
 *   本页同时引入两份"同名类"样式:
 *   - styles.module.css  → import styles from ...,类名被哈希,隔离生效;
 *   - styles-global.css  → import '...'(非 module),类名原样进入全局,
 *     是否有泄漏风险完全取决于 qiankun 运行时沙箱。
 *   页面上直接把编译后的哈希类名渲染出来,肉眼可见隔离结果。
 *
 * 【坑点】
 * 1. CSS Modules 文件必须命名为 *.module.css,否则 Vite 按全局 CSS 处理;
 * 2. JS 里必须通过 styles.xxx 引用类名,写死字符串 'panel' 命中的是全局类;
 * 3. 全局 CSS 依然必要(基础样式/第三方库),但要统一前缀、交给运行时沙箱兜底。
 */
import styles from './styles.module.css'
// 同名全局样式:与 styles.module.css 中类名完全一致(panel/title/desc),
// 但不会被哈希化,作为"未隔离"对照组
import './styles-global.css'

export default function StylePage() {
  return (
    <div>
      <h2 className={styles.pageTitle}>样式隔离演示(CSS Modules)</h2>

      {/* 隔离原理说明卡 */}
      <section className={styles.panel}>
        <h3 className={styles.title}>本应用的隔离手段</h3>
        <ul className={styles.list}>
          <li>组件样式一律 <code>*.module.css</code>(编译期类名哈希化)</li>
          <li>全局样式仅放设计变量与基础类,且统一 <code>mall-</code> BEM 前缀</li>
          <li>CSS 变量挂在应用根类 <code>.mallApp</code>,而非 <code>:root</code>,避免变量互相覆盖</li>
          <li>主应用对本应用启用 <code>experimentalStyleIsolation</code>(运行时再加一道 scoped 前缀)</li>
        </ul>
      </section>

      {/* 对照实验:同名类,两种命运 */}
      <section className={styles.panel}>
        <h3 className={styles.title}>对照实验:同名类的两种命运</h3>
        <div className={styles.compareRow}>
          {/* 左:CSS Modules 编译后哈希类名(隔离) */}
          <div className={styles.panel}>
            <h4 className={styles.title}>CSS Modules(编译期隔离)</h4>
            <p className={styles.desc}>我的类名编译后是:</p>
            <code className={styles.hashName}>{styles.panel}</code>
            <code className={styles.hashName}>{styles.title}</code>
            <p className={styles.desc}>哈希后缀保证全局唯一,任何应用都无法意外命中。</p>
          </div>
          {/* 右:全局 CSS 同名类(未隔离,依赖运行时沙箱) */}
          <div className="panel">
            <h4 className="title">全局 CSS(依赖运行时隔离)</h4>
            <p className="desc">我的类名就是字面上的:</p>
            <code className="hash-name">panel</code>
            <code className="hash-name">title</code>
            <p className="desc">
              若主应用未开启样式沙箱,我的 .panel/.title 会泄漏到全局;
              开启 experimentalStyleIsolation 后被改写为 div[data-qiankun] .panel。
            </p>
          </div>
        </div>
      </section>

      {/* 结论 */}
      <section className={styles.panel}>
        <h3 className={styles.title}>结论:双层防护</h3>
        <p className={styles.desc}>
          CSS Modules 解决"我不想被别人污染"(编译期,确定性最强);
          qiankun 沙箱解决"我不想污染别人"(运行时,覆盖全局 CSS 与第三方库)。
          两者职责互补,企业级微前端应同时启用。
        </p>
      </section>
    </div>
  )
}
