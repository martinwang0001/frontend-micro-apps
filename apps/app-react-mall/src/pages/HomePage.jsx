/**
 * 商品列表页(首页)
 * ---------------------------------------------------------------
 * 【职责】
 * 1. mock 6 件积分兑换商品,网格卡片展示;
 * 2. 页面顶部展示共享 store 的 cartCount 角标 —— 加购动作产生的数量,
 *    主应用顶栏与其它子应用(Vue/Svelte 看板)会同步显示,这就是
 *    "一份 store 九端共享"的最直观体现;
 * 3. 「加购」按钮同时做两件事:
 *    a. store.actions.addCart(1)  —— 写共享状态(状态型通信,可回放);
 *    b. eventBus.emit(CART_SYNC)  —— 发事件通知(事件型通信,一次性动作)。
 *
 * 【坑点】
 * 1. useSharedStore 基于 useSyncExternalStore:store.getState() 返回的
 *    快照引用在 setState 前保持稳定,因此不会无限重渲染(共享包适配器注释);
 * 2. 图片地址为 AI 生图接口,prompt 必须 URL 编码,否则中文提示词 404;
 * 3. 本页样式全部来自 *.module.css,类名编译期哈希,不怕与其它应用撞名。
 */
import { useSharedStore } from '@micro/shared/react'
import { GLOBAL_EVENTS } from '@micro/shared'
import { getSharedContext } from '../shared-context'
import styles from './HomePage.module.css'

/** AI 生图接口:prompt 必须 URL 编码,image_size=square 产出方图 */
const img = (prompt) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`

/** mock 商品数据:简约风商品图 */
const PRODUCTS = [
  { id: 1, name: '简约陶瓷马克杯', points: 1200, image: img('简约风白色陶瓷马克杯商品图,纯白背景,电商摄影,柔光') },
  { id: 2, name: '北欧原木台灯', points: 3600, image: img('简约风北欧原木台灯商品图,纯白背景,电商摄影,柔光') },
  { id: 3, name: '极简帆布袋', points: 800, image: img('简约风米色帆布袋商品图,纯白背景,电商摄影,柔光') },
  { id: 4, name: '机械键盘', points: 5200, image: img('简约风白色机械键盘商品图,纯白背景,电商摄影,柔光') },
  { id: 5, name: '桌面绿植盆栽', points: 1500, image: img('简约风桌面绿植小盆栽商品图,纯白背景,电商摄影,柔光') },
  { id: 6, name: '不锈钢保温杯', points: 2400, image: img('简约风磨砂不锈钢保温杯商品图,纯白背景,电商摄影,柔光') }
]

export default function HomePage() {
  // 共享上下文:store / eventBus 由主应用经 qiankun props 下发(见 main.jsx)
  const { store, eventBus } = getSharedContext()
  // 订阅共享 store:其它应用修改 cartCount 时本组件自动重渲染
  const state = useSharedStore(store)

  /**
   * 加购:写共享 store + 发同步事件
   * @param {object} product 商品
   */
  const handleAdd = (product) => {
    // ① 状态型通信:cartCount +1,主应用顶栏角标同步更新
    store.actions.addCart(1)
    // ② 事件型通信:广播一次性动作,portal 消息中心可消费
    eventBus.emit(GLOBAL_EVENTS.CART_SYNC, {
      from: 'app-react-mall',
      count: store.getState().cartCount,
      product: product.name
    })
  }

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>积分兑换专区</h2>
        {/* 购物车角标:数据来自共享 store,主应用顶栏同步显示同一数值 */}
        <span className={styles.cartBadge}>
          🛒 购物车 <b>{state.cartCount}</b>
        </span>
      </div>
      <p className={styles.tip}>
        点击「加购」会写入共享 Store 并广播 cart:sync 事件,主应用顶栏与其它子应用同步更新。
      </p>

      {/* 商品网格 */}
      <div className={styles.grid}>
        {PRODUCTS.map((p) => (
          <div key={p.id} className={styles.card}>
            <img className={styles.image} src={p.image} alt={p.name} loading="lazy" />
            <div className={styles.name}>{p.name}</div>
            <div className={styles.points}>{p.points} 积分</div>
            <button className={styles.addBtn} onClick={() => handleAdd(p)}>
              加购
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
