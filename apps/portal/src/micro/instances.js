/**
 * 共享实例创建(仅主应用允许 new!)
 * ---------------------------------------------------------------
 * 【架构核心 —— 唯一数据源】
 * 全平台只允许 portal 创建共享 store / eventBus 的唯一实例,
 * 注册子应用时通过 qiankun 的 props 逐一下发,任何子应用不得自行创建
 * (独立运行模式除外,那时它本来就没有通信对象)。
 *
 * 这样做同时解决两大坑点:
 *  1. 模块多实例:不同源的 @micro/shared 模块各自 new 会得到互不相通的对象;
 *  2. 责任边界:状态所有权归基座,子应用是"消费方 + 受限写入方"。
 */
import { createAppStore, createEventBus, TokenManager } from '@micro/shared'

/** 全局共享 Store(user / theme / cartCount / messages) */
export const appStore = createAppStore()

/** 全局事件总线 */
export const eventBus = createEventBus()

/** 鉴权管理器(注入事件总线,登录态变化可广播) */
export const tokenManager = new TokenManager({ eventBus })
