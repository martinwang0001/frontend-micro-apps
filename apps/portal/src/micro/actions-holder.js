/**
 * qiankun actions 持有者
 * ---------------------------------------------------------------
 * initGlobalState 返回的 actions 只能在 setupMicroApps 里创建一次,
 * 页面组件需要时再从这里取用(避免把 actions 塞进组件 props 层层传递)。
 */
import { ref } from 'vue'

/** qiankun GlobalState actions(setupMicroApps 启动后写入) */
export const qiankunActionsRef = ref(null)

/** 供模板/组合式函数直接使用的便捷引用 */
export const qiankunActions = {
  setGlobalState(...args) {
    qiankunActionsRef.value?.setGlobalState(...args)
  },
  onGlobalStateChange(...args) {
    qiankunActionsRef.value?.onGlobalStateChange(...args)
  }
}
