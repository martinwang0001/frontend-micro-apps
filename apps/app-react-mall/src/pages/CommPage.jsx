/**
 * 跨应用通信演示页(商城视角)
 * ---------------------------------------------------------------
 * 【职责】同页演示三种通信机制:
 *   ① 共享 Store(useSharedStore):状态型,九端同步、可回放;
 *   ② qiankun GlobalState(setGlobalState):官方 props 通信,适合主从广播;
 *   ③ 事件总线(eventBus + useGlobalEvent):一次性动作通知,发布订阅解耦。
 *
 * 【React 专属坑点 —— useGlobalEvent 的 handler 必须 useCallback】
 * useGlobalEvent 内部是 useEffect(..., [eventBus, event, handler]),
 * 若 handler 是内联箭头函数,每次渲染都生成新引用 → effect 反复执行
 * "退订旧 handler / 订阅新 handler",虽不至于漏消息,但属于无效抖动;
 * 用 useCallback 固定引用后,effect 只在挂载时订阅一次。
 */
import { useState, useCallback } from 'react'
import { useSharedStore, useGlobalEvent } from '@micro/shared/react'
import { GLOBAL_EVENTS, GLOBAL_STATE_KEYS } from '@micro/shared'
import { getSharedContext } from '../shared-context'
import styles from './CommPage.module.css'

export default function CommPage() {
  // 共享上下文:store / eventBus / qiankun 能力(主应用经 props 下发)
  const ctx = getSharedContext()

  // ① 共享 Store:返回最新状态快照,actions 直接挂在 store 上
  const state = useSharedStore(ctx.store)
  const { actions } = ctx.store

  /** 待广播的消息 */
  const [msg, setMsg] = useState('来自 React 积分商城的问候')
  /** 收到的 NOTIFY 事件列表(最多保留 10 条) */
  const [events, setEvents] = useState([])

  /**
   * ③ 订阅全局通知
   * 注意 useCallback:保持 handler 引用稳定,否则 effect 依赖变化,
   * 每次渲染都会退订再重订(见文件头注释)
   */
  const handleNotify = useCallback((payload) => {
    setEvents((prev) =>
      [{ time: new Date().toLocaleTimeString(), ...payload }, ...prev].slice(0, 10)
    )
  }, [])
  useGlobalEvent(ctx.eventBus, GLOBAL_EVENTS.NOTIFY, handleNotify)

  /** 切换用户:写入共享 store,九端同步 */
  const switchUser = () => {
    actions.login({
      name: state.user.name === '张三' ? '李四' : '张三',
      role: state.user.role === 'admin' ? 'editor' : 'admin'
    })
  }

  /** 切换主题:light / dark 互切,所有应用联动换肤 */
  const switchTheme = () => {
    actions.setTheme(state.theme === 'light' ? 'dark' : 'light')
  }

  /** ② 通过 qiankun 官方 GlobalState 广播 */
  const sendGlobalState = () => {
    if (ctx.qiankun?.setGlobalState) {
      ctx.qiankun.setGlobalState({ [GLOBAL_STATE_KEYS.GLOBAL_MESSAGE]: msg })
    } else {
      // 独立运行时无 qiankun 环境,降级提示
      alert('当前为独立运行模式,无 qiankun GlobalState')
    }
  }

  /** ③ 通过事件总线发布全局通知(本页自己也会收到并显示在下方列表) */
  const sendNotify = () => {
    ctx.eventBus.emit(GLOBAL_EVENTS.NOTIFY, { from: 'app-react-mall', text: msg })
  }

  return (
    <div>
      <h2 className={styles.title}>跨应用通信演示</h2>
      <p className={styles.tip}>本页同时使用三种通信机制,改动会同步到主应用与其它子应用。</p>

      {/* ① 共享 Store:由主应用创建、经 qiankun props 下发的唯一实例 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>① 共享 Store(跨应用状态)</h3>
        <p>当前用户:<b>{state.user.name}</b>({state.user.role})</p>
        <p>全局主题:<b>{state.theme}</b></p>
        <p>购物车数量:<b>{state.cartCount}</b></p>
        <button className={styles.btn} onClick={() => actions.addCart(1)}>加购 +1</button>
        <button className={styles.btnPlain} onClick={switchUser}>切换用户</button>
        <button className={styles.btnPlain} onClick={switchTheme}>切换主题</button>
      </section>

      {/* ② qiankun 官方 GlobalState */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>② qiankun GlobalState(官方 props 通信)</h3>
        <input
          className={styles.input}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="输入要广播的全局消息"
        />
        <button className={styles.btn} onClick={sendGlobalState}>setGlobalState 广播</button>
        <p className={styles.echo}>主应用及其它子应用均可 onGlobalStateChange 收到</p>
      </section>

      {/* ③ 事件总线:发布 + 订阅同页演示 */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>③ 事件总线(发布订阅)</h3>
        <button className={styles.btn} onClick={sendNotify}>emit('global:notify')</button>
        <p className={styles.echo}>portal 消息中心与本页下方列表会实时收到该通知</p>
        {/* 已收到的事件列表(含本应用与其它应用发来的) */}
        {events.length > 0 && (
          <ul className={styles.eventList}>
            {events.map((ev, i) => (
              <li key={i}>
                <span className={styles.eventTime}>{ev.time}</span>
                <span className={styles.eventFrom}>[{ev.from}]</span>
                {ev.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
