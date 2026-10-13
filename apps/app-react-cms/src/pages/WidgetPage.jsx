/**
 * Widget 页面(聚合页精简卡片)
 * ---------------------------------------------------------------
 * 【职责】
 * 被主应用聚合页以指定 ID 容器挂载(loadMicroApp + widgetMode)时展示:
 *   - 待审文章数(本应用私有 mock 数据);
 *   - 共享 store 的当前用户与购物车数量。
 *
 * 【坑点】
 * 1. 该页面必须在 MemoryRouter 下使用,因为 URL 属于主应用;
 *    main.jsx 中 widgetMode 时 initialEntries=['/widget'] 直接命中本页;
 * 2. 共享 store 依然通过 qiankun props 下发,数据与路由模式完全同步;
 * 3. 卡片内容要极简,避免在聚合页中喧宾夺主;
 * 4. 本页不渲染导航(由 App.jsx 统一控制)。
 */
import { useSharedStore } from '@micro/shared/react'
import { getSharedContext } from '../shared-context'
import styles from './WidgetPage.module.css'

/** mock 待审文章数(实际场景从 API 拉取) */
const PENDING_COUNT = 3

export default function WidgetPage() {
  const { store } = getSharedContext()
  const state = useSharedStore(store)

  return (
    <div className={styles.widget}>
      <h4 className={styles.title}>
        📝 CMS 速览 <span className={styles.tag}>Widget 模式 · ID 容器挂载</span>
      </h4>
      <div className={styles.row}>
        <div className={styles.item}>
          <span className={styles.num}>{PENDING_COUNT}</span>
          <span className={styles.label}>待审文章</span>
        </div>
        <div className={styles.item}>
          <span className={styles.num}>{state.user.name}</span>
          <span className={styles.label}>当前用户</span>
        </div>
        <div className={styles.item}>
          <span className={styles.num}>{state.cartCount}</span>
          <span className={styles.label}>购物车(共享 Store)</span>
        </div>
      </div>
    </div>
  )
}
