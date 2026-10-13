/**
 * 报表中心本地 Pinia Store
 * ---------------------------------------------------------------
 * 【职责边界 —— 本地状态 vs 共享状态】
 * 本 store 管理的是"报表中心自己的业务状态":报表列表、生成次数等。
 * 这些数据只对本应用有意义,其它应用(主应用/看板/商城)完全不关心,
 * 因此放本地 Pinia,不进入全局共享 store,避免污染九端共享的状态空间。
 *
 * 【与共享 store 的对比(详见 HomeView 的可视化对比区)】
 *   - 本地 Pinia(本文件):作用域 = 当前应用当前挂载实例;
 *     应用 unmount 后随之销毁;其它应用不可见。
 *   - 共享 Store(@micro/shared):作用域 = 整个微前端平台;
 *     由主应用创建、经 qiankun props 下发;任一应用写入,九端同步。
 *
 * 【坑点提示】
 * 1. Pinia 实例在 main.js 中随 app 一起创建(createPinia() 在 render 内),
 *    因此本 store 不会跨 mount 残留 —— 这是刻意的,微应用被卸载后
 *    其私有业务状态理应随之回收;
 * 2. 若确实有"应用重进后恢复本地状态"的需求,应自行持久化到 localStorage
 *    (注意加 STORAGE_KEYS 风格的应用前缀),而不是依赖 Pinia 单例驻留。
 */
import { defineStore } from 'pinia'

/**
 * 报表领域 Store
 * state: 报表列表 + 累计生成次数
 * actions: 生成报表(改变状态 + 返回报表名,便于页面层广播事件/写消息)
 */
export const useReportStore = defineStore('report', {
  state: () => ({
    /**
     * 报表列表(mock 数据)
     * status: ready 可生成 / generating 生成中
     * lastGeneratedAt: 最近一次生成时间(null 表示从未生成)
     */
    reports: [
      { id: 1, name: '经营日报', period: '每日 08:00', status: 'ready', lastGeneratedAt: null },
      { id: 2, name: '流量周报', period: '每周一 09:00', status: 'ready', lastGeneratedAt: null },
      { id: 3, name: '转化月报', period: '每月 1 日 10:00', status: 'ready', lastGeneratedAt: null },
      { id: 4, name: '渠道季报', period: '每季度首日', status: 'ready', lastGeneratedAt: null }
    ],
    /** 本应用本次挂载期间累计生成的报表数(纯本地计数,证明"仅本应用可见") */
    generatedCount: 0
  }),

  getters: {
    /** 报表总数(Widget 模式展示用) */
    total: (state) => state.reports.length
  },

  actions: {
    /**
     * 生成一张报表
     * 真实场景这里会调用后端接口;demo 中仅模拟状态流转并记录时间。
     * @param {number} id 报表 id
     * @returns {string|null} 报表名(供页面层做事件广播文案),未找到返回 null
     */
    generate(id) {
      const target = this.reports.find((r) => r.id === id)
      if (!target) return null
      // 本地状态更新:仅当前应用实例内生效,其它应用无感知
      target.status = 'ready'
      target.lastGeneratedAt = new Date().toLocaleTimeString()
      this.generatedCount += 1
      return target.name
    }
  }
})
