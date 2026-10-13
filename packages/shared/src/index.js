/**
 * @micro/shared 共享包统一出口
 * ---------------------------------------------------------------
 * 【架构说明】
 * 本包是所有应用(主应用 portal + 8 个子应用)之间共享能力的唯一来源:
 *   1. createGlobalStore  —— 框架无关的响应式状态容器(跨应用 Store 的底层实现)
 *   2. createAppStore     —— 业务级全局 Store(内置 user/theme/cart/messages 领域状态与动作)
 *   3. createEventBus     —— 发布订阅事件总线(跨应用解耦通信)
 *   4. TokenManager       —— 鉴权凭证管理(跨应用登录态同步)
 *   5. createHttpClient   —— 带拦截器的 HTTP 封装(企业级 API 层范式)
 *   6. 常量               —— 全局事件名 / 存储 Key / 全局状态 Key(避免各应用魔法字符串漂移)
 *
 * 【关键坑点 —— 模块多实例问题】
 * 各子应用独立开发、独立构建、独立部署时,即便都 import 了 @micro/shared,
 * 浏览器里也会存在 N 份模块副本(每个源一份),此时"模块级单例"会失效:
 * A 应用写入的 store,B 应用读到的是另一份空对象。
 * => 正确姿势:由主应用创建唯一实例,通过 qiankun 的 props 下发给所有子应用,
 *    子应用仅在"独立运行(standalone)"模式下才自行 new 一份兜底。
 *    本包只导出"工厂函数"而不导出实例,正是为了强制这一约定。
 */

export { createGlobalStore, createAppStore } from './store.js'
export { createEventBus } from './event-bus.js'
export { TokenManager } from './auth.js'
export { createHttpClient } from './http.js'
export { GLOBAL_EVENTS, STORAGE_KEYS, GLOBAL_STATE_KEYS, THEMES } from './constants.js'
