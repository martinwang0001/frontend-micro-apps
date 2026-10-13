/**
 * 基座全局状态(Pinia)
 * ---------------------------------------------------------------
 * 三层状态分工:
 *  1. sharedState —— 共享 Store 的只读镜像(供模板响应式渲染)
 *  2. qiankunState —— qiankun GlobalState 镜像
 *  3. eventLog / appStatus —— 基座自身运维数据(事件日志、应用挂载状态)
 */
import { defineStore } from 'pinia'
import { appStore } from '../micro/instances'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    /** 共享 Store 镜像:由 bindShared 中的订阅驱动更新 */
    sharedState: { ...appStore.getState() },
    /** qiankun GlobalState 最近一次快照 */
    qiankunState: {},
    /** 全局事件日志(通信实验室展示,最近 100 条) */
    eventLog: [],
    /** 各子应用挂载状态表 { [name]: 'mounting' | 'mounted' | 'unmounted' } */
    appStatus: {}
  }),
  actions: {
    /**
     * 订阅共享 Store 并同步到本地镜像
     * 在 main.js 启动时调用一次即可(基座常驻,无需退订)
     */
    bindShared() {
      appStore.subscribe((next) => {
        this.sharedState = { ...next }
      })
    },
    /** 更新 qiankun GlobalState 镜像 */
    setQiankunState(state) {
      this.qiankunState = { ...state }
    },
    /** 追加事件日志(环形保留最近 100 条) */
    appendEventLog(entry) {
      this.eventLog = [
        { time: new Date().toLocaleTimeString(), ...entry },
        ...this.eventLog
      ].slice(0, 100)
    },
    /** 记录子应用挂载状态 */
    markAppStatus(name, status) {
      this.appStatus = { ...this.appStatus, [name]: status }
    }
  }
})
