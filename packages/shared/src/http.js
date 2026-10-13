/**
 * 轻量 HTTP 客户端(fetch 封装)
 * ---------------------------------------------------------------
 * 【企业级 API 层范式】
 * 每个应用的 src/api/ 都应基于本工厂创建自己的实例,而不是散写 fetch:
 *   - 统一 baseURL(配合部署环境变量注入)
 *   - 统一请求拦截器(自动携带 token、租户头等)
 *   - 统一响应拦截器(业务码归一化、错误格式化)
 *   - 统一错误拦截器(401 跳登录、5xx 上报监控)
 *
 * 本 demo 不连真实后端,但保留完整骨架,体现可落地的工程规范。
 */

/**
 * 创建 HTTP 客户端
 * @param {{
 *   baseURL?: string,
 *   timeout?: number,
 *   getToken?: () => string
 * }} options
 * @returns {{
 *   request(config: {url: string, method?: string, data?: any, headers?: object}): Promise<any>,
 *   get(url: string, headers?: object): Promise<any>,
 *   post(url: string, data?: any, headers?: object): Promise<any>,
 *   useRequestInterceptor(fn: Function): void,
 *   useResponseInterceptor(fn: Function): void,
 *   useErrorInterceptor(fn: Function): void
 * }}
 */
export function createHttpClient(options = {}) {
  const { baseURL = '', timeout = 10000, getToken = () => '' } = options

  /** 拦截器队列:按注册顺序依次执行 */
  const requestInterceptors = []
  const responseInterceptors = []
  const errorInterceptors = []

  /**
   * 核心请求方法
   * @param {{url: string, method?: string, data?: any, headers?: object}} config
   */
  async function request(config) {
    // 1. 依次执行请求拦截器(可改写 config,例如注入 token)
    let finalConfig = { headers: {}, ...config }
    for (const fn of requestInterceptors) {
      finalConfig = (await fn(finalConfig)) || finalConfig
    }

    // 2. 自动携带登录凭证
    const token = getToken()
    if (token) {
      finalConfig.headers = { ...finalConfig.headers, Authorization: `Bearer ${token}` }
    }

    // 3. 组装超时控制(AbortController)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const resp = await fetch(baseURL + finalConfig.url, {
        method: finalConfig.method || 'GET',
        headers: { 'Content-Type': 'application/json', ...finalConfig.headers },
        body: finalConfig.data ? JSON.stringify(finalConfig.data) : undefined,
        signal: controller.signal
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`)
      let data = await resp.json().catch(() => null)
      // 4. 依次执行响应拦截器
      for (const fn of responseInterceptors) {
        data = (await fn(data)) ?? data
      }
      return data
    } catch (err) {
      // 5. 依次执行错误拦截器(可用于上报/统一提示),最后仍向上抛出
      for (const fn of errorInterceptors) {
        await fn(err)
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    request,
    /** GET 快捷方法 */
    get: (url, headers) => request({ url, headers }),
    /** POST 快捷方法 */
    post: (url, data, headers) => request({ url, method: 'POST', data, headers }),
    /** 注册请求拦截器:fn(config) => config */
    useRequestInterceptor: (fn) => requestInterceptors.push(fn),
    /** 注册响应拦截器:fn(data) => data */
    useResponseInterceptor: (fn) => responseInterceptors.push(fn),
    /** 注册错误拦截器:fn(error) => void */
    useErrorInterceptor: (fn) => errorInterceptors.push(fn)
  }
}
