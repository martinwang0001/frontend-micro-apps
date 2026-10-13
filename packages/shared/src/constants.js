/**
 * 全局事件名常量表
 * ---------------------------------------------------------------
 * 所有跨应用事件必须使用这里定义的名称,禁止在业务代码中手写字符串,
 * 否则在 8+ 个应用联调时事件名拼写漂移将极难排查。
 */

export const GLOBAL_EVENTS = {
  /** 全局通知(任一应用触发后,portal 消息中心会收到) */
  NOTIFY: 'global:notify',
  /** 主题变更(light / dark) */
  THEME_CHANGE: 'theme:change',
  /** 购物车数量同步(商城应用产生,其它应用展示角标) */
  CART_SYNC: 'cart:sync',
  /** 日志写入(任意应用可向日志中心广播一条日志) */
  LOG_WRITE: 'log:write',
  /** 用户登录 / 切换 */
  USER_LOGIN: 'user:login',
  /** 用户登出 */
  USER_LOGOUT: 'user:logout'
}

/** localStorage 命名空间:统一加前缀,避免和子应用自身存储冲突(样式/数据污染同理) */
export const STORAGE_KEYS = {
  TOKEN: 'MICRO_DEMO_TOKEN',
  USER: 'MICRO_DEMO_USER',
  THEME: 'MICRO_DEMO_THEME'
}

/** qiankun initGlobalState 的字段名(主从应用双方必须一致) */
export const GLOBAL_STATE_KEYS = {
  THEME: 'theme',
  GLOBAL_MESSAGE: 'globalMessage',
  ONLINE_COUNT: 'onlineCount'
}

/** 支持的主题枚举 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}
