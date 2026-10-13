/**
 * 文章列表页(首页)
 * ---------------------------------------------------------------
 * 【职责】
 * 1. mock 文章列表(标题/状态/更新时间),支持「发布/下线」状态切换;
 * 2. 文章状态保存在本地 useState(页面级私有状态,不需要跨应用共享);
 * 3. 「发布」动作同时 emit GLOBAL_EVENTS.LOG_WRITE 广播一条日志,
 *    portal 日志中心 / Svelte 日志子应用会实时收到 —— 演示"事件型通信"。
 *
 * 【坑点】
 * 1. 本地状态与共享状态的边界:文章列表是本应用私有数据,放 useState;
 *    需要跨应用共享的(用户/主题/购物车)才进共享 store,避免全局状态膨胀;
 * 2. 更新文章列表必须用不可变方式(map 生成新数组),直接改原数组
 *    React 感知不到引用变化,不会重渲染;
 * 3. 发布动作是"一次性动作",走 eventBus 而不是写共享 store(分工见共享包注释)。
 */
import { useState } from 'react'
import { GLOBAL_EVENTS } from '@micro/shared'
import { getSharedContext } from '../shared-context'
import styles from './HomePage.module.css'

/** 当前时间字符串(模拟更新时间) */
const now = () => new Date().toLocaleString()

/** mock 文章数据 */
const INITIAL_ARTICLES = [
  { id: 1, title: '微前端架构落地实践:从单体到 qiankun', status: 'published', updatedAt: '2026-10-10 09:30:00' },
  { id: 2, title: 'React 18 并发特性在子应用中的注意事项', status: 'draft', updatedAt: '2026-10-11 14:12:00' },
  { id: 3, title: 'CSS Modules 与 Shadow DOM 隔离方案对比', status: 'published', updatedAt: '2026-10-11 18:45:00' },
  { id: 4, title: '跨应用通信:Store / GlobalState / EventBus 怎么选', status: 'draft', updatedAt: '2026-10-12 10:05:00' },
  { id: 5, title: '主应用聚合页:loadMicroApp 手动挂载指南', status: 'offline', updatedAt: '2026-10-12 16:20:00' }
]

/** 状态文案与样式映射 */
const STATUS_META = {
  published: { text: '已发布', cls: styles.statusPublished },
  draft: { text: '草稿', cls: styles.statusDraft },
  offline: { text: '已下线', cls: styles.statusOffline }
}

export default function HomePage() {
  /** 文章列表:本应用私有状态,用 useState 管理 */
  const [articles, setArticles] = useState(INITIAL_ARTICLES)
  // 共享事件总线(主应用下发)
  const { eventBus } = getSharedContext()

  /**
   * 发布 / 下线切换
   * @param {number} id 文章 id
   * @param {'published' | 'offline'} next 目标状态
   */
  const toggleStatus = (id, next) => {
    // 不可变更新:map 返回新数组,React 依据引用变化触发重渲染
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: next, updatedAt: now() } : a))
    )
    // 发布动作广播日志:portal 日志中心与其它订阅方实时收到
    if (next === 'published') {
      const target = articles.find((a) => a.id === id)
      eventBus.emit(GLOBAL_EVENTS.LOG_WRITE, {
        from: 'app-react-cms',
        text: `文章「${target?.title}」已发布`,
        level: 'info'
      })
    }
  }

  return (
    <div>
      <h2 className={styles.title}>文章管理</h2>
      <p className={styles.tip}>
        「发布」动作会广播 log:write 事件,主应用日志中心实时收到;列表状态为页面私有 useState。
      </p>

      {/* 文章表格 */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>状态</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => {
            const meta = STATUS_META[a.status]
            return (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td className={styles.cellTitle}>{a.title}</td>
                <td>
                  <span className={`${styles.status} ${meta.cls}`}>{meta.text}</span>
                </td>
                <td className={styles.cellTime}>{a.updatedAt}</td>
                <td>
                  {/* 已发布 -> 可下线;草稿/已下线 -> 可发布 */}
                  {a.status === 'published' ? (
                    <button className={styles.btnPlain} onClick={() => toggleStatus(a.id, 'offline')}>
                      下线
                    </button>
                  ) : (
                    <button className={styles.btn} onClick={() => toggleStatus(a.id, 'published')}>
                      发布
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
