<template>
  <div class="order-comm">
    <h2>跨应用通信演示</h2>
    <!-- 页头说明:三种机制同页演示,便于对照 -->
    <!-- 三个 section 结构完全并列:状态(Store) / 官方通道(GlobalState) / 事件(Bus) -->
    <p class="order-comm__tip">
      本页同时使用三种通信机制,改动会同步到主应用与其它子应用。
    </p>

    <!-- ① 共享 Store:由主应用创建、经 qiankun props 下发的唯一实例 -->
    <section class="order-card order-comm__section">
      <h3>① 共享 Store(跨应用状态)</h3>
      <!-- shared 由 createSharedStoreMixin 注入到 data,store 变化自动刷新视图 -->
      <p>当前用户:<b>{{ shared.user.name }}</b>({{ shared.user.role }})</p>
      <p>全局主题:<b>{{ shared.theme }}</b></p>
      <p>购物车数量:<b>{{ shared.cartCount }}</b></p>
      <!-- 写入共享 store:所有挂载着该 store 的应用同步刷新 -->
      <button class="order-btn" @click="addCart">加购 +1</button>
      <!-- 切换登录用户:同样走共享 store 的 actions.login -->
      <button class="order-btn order-btn--plain" @click="switchUser">切换用户</button>
    </section>

    <!-- ② qiankun 官方 GlobalState -->
    <section class="order-card order-comm__section">
      <h3>② qiankun GlobalState(官方 props 通信)</h3>
      <!-- v-model 双向绑定输入框,老项目最常见的表单写法 -->
      <input v-model="msg" class="order-comm__input" placeholder="输入要广播的全局消息" />
      <button class="order-btn" @click="sendGlobalState">setGlobalState 广播</button>
      <p class="order-comm__echo">主应用及其它子应用均可 onGlobalStateChange 收到</p>
    </section>

    <!-- ③ 事件总线:发布 + 订阅同页演示 -->
    <section class="order-card order-comm__section">
      <h3>③ 事件总线(发布订阅)</h3>
      <!-- 点击发布:本页与 portal 消息中心都会收到(订阅见 mixins) -->
      <button class="order-btn" @click="sendNotify">emit('global:notify')</button>
      <p class="order-comm__echo">
        本页同时订阅了该事件;portal 消息中心与其它子应用也会实时收到
      </p>
      <!-- v-if/v-else 空态处理:无通知时给提示,有通知时渲染列表 -->
      <ul v-if="notices.length" class="order-comm__notice-list">
        <!-- v-for 的 key 用索引即可:列表只增不删,无重排风险 -->
        <li v-for="(n, i) in notices" :key="i">
          <b>[{{ n.from }}]</b> {{ n.text }}
        </li>
      </ul>
      <p v-else class="order-comm__echo">暂无收到的通知</p>
    </section>
  </div>
</template>

<script>
/**
 * 通信演示页(Options API)
 * ---------------------------------------------------------------
 * 【三种跨应用通信机制的分工】
 *   ① 共享 Store —— 管"状态":需要被多端持续展示的数据(用户/主题/购物车);
 *   ② qiankun GlobalState —— 官方约定的主从通信通道,适合低频全局配置;
 *   ③ 事件总线 —— 管"事件":一次性动作通知(埋点、即时消息)。
 *
 * 【关键坑点 —— mixin 必须传 getter 而不是实例】
 * Vue2 组件的 mixins 数组在【模块顶层】求值,而 store/eventBus 是 mount 时
 * 才经 qiankun props 下发的;若在顶层直接写 createSharedStoreMixin(getSharedContext().store),
 * 此时上下文还是初始的 null,拿到的永远是空对象。
 * 传入 getter(() => getSharedContext().store)后,取值被延迟到组件 created 时,
 * 此刻 props 早已下发完毕(见 @micro/shared/vue2 适配器注释)。
 *
 * 【本页数据流一览】
 *   模板 shared.*  <—— createSharedStoreMixin 内部 subscribe 后同步到 data
 *   按钮 加购      ——> store.actions.addCart(1)  ——> 九端同步刷新
 *   按钮 切换用户  ——> store.actions.login(...)  ——> 九端同步刷新
 *   按钮 广播      ——> qiankun.setGlobalState    ——> 主从应用 onGlobalStateChange
 *   按钮 发通知    ——> eventBus.emit(NOTIFY)     ——> 本页 onNotify + 其它订阅方
 */
import { createSharedStoreMixin, createGlobalEventMixin } from '@micro/shared/vue2'
import { GLOBAL_EVENTS, GLOBAL_STATE_KEYS } from '@micro/shared'
import { getSharedContext } from '../shared-context'

export default {
  // 组件命名,便于 devtools 调试与 keep-alive 匹配
  name: 'OrderCommView',
  mixins: [
    // ① 共享 Store 同步 mixin:组件 data 上挂载 shared 属性,卸载自动退订
    //    必须传 getter(原因见上方块注释),这是 Vue2 接入共享 store 的第一坑
    createSharedStoreMixin(() => getSharedContext().store),
    // ③ 事件订阅 mixin:订阅全局通知并转发给本组件的 onNotify 方法,
    //    beforeDestroy 时自动退订,防止微应用反复挂载导致监听器叠加
    createGlobalEventMixin(
      () => getSharedContext().eventBus,
      GLOBAL_EVENTS.NOTIFY,
      'onNotify'
    )
  ],
  data() {
    return {
      /** 待广播的消息(GlobalState 与事件总线共用) */
      msg: '来自 Vue2 订单管理的问候',
      /** 本页收到的通知列表(由事件总线订阅回调追加) */
      notices: []
    }
  },
  methods: {
    /** ① 加购:通过共享 store 的 actions 写入,九端同步 */
    addCart() {
      getSharedContext().store.actions.addCart(1)
    },
    /** ① 切换用户:同样写入共享 store 的 actions.login,九端同步 */
    switchUser() {
      const store = getSharedContext().store
      store.actions.login({
        name: this.shared.user.name === '张伟' ? '王芳' : '张伟',
        role: this.shared.user.role === 'admin' ? 'editor' : 'admin'
      })
    },
    /**
     * ② 通过 qiankun 官方 GlobalState 广播
     * 接收方用法(onGlobalStateChange,以主应用为例):
     *   onGlobalStateChange((state, prev) => {
     *     // state.globalMessage 即为这里写入的值;prev 为变更前的完整状态
     *   })
     * 注意:独立运行时 props 中没有这两个方法,需降级处理。
     */
    sendGlobalState() {
      const { qiankun } = getSharedContext()
      if (qiankun.setGlobalState) {
        qiankun.setGlobalState({ [GLOBAL_STATE_KEYS.GLOBAL_MESSAGE]: this.msg })
      } else {
        // 独立运行时无 qiankun 环境,降级提示
        alert('当前为独立运行模式,无 qiankun GlobalState')
      }
    },
    /** ③ 通过事件总线发布全局通知(事件名必须取 GLOBAL_EVENTS 常量) */
    sendNotify() {
      getSharedContext().eventBus.emit(GLOBAL_EVENTS.NOTIFY, {
        from: 'app-vue2-order',
        text: this.msg
      })
    },
    /**
     * ③ 事件订阅回调(由 createGlobalEventMixin 指定,卸载自动退订)
     * payload 结构约定:{ from: 来源应用名, text: 通知文本 }
     */
    onNotify(payload) {
      // 只保留最近 10 条,避免长会话列表无限增长;
      // 用"新数组替换"而非 push,语义上更接近不可变更新
      this.notices = [...this.notices, payload].slice(-10)
    }
  }
}
</script>

<style scoped>
/* 页标题 */
.order-comm h2 {
  margin: 0 0 6px;
  color: #5c3d12;
}
/* 页头说明 */
.order-comm__tip {
  font-size: 12px;
  color: #8896a6;
  margin: 0 0 14px;
}
/* 三个机制区块的间距 */
.order-comm__section {
  margin-bottom: 12px;
}
/* 区块小标题 */
.order-comm__section h3 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #5c3d12;
}
/* 消息输入框 */
.order-comm__input {
  padding: 6px 10px;
  border: 1px solid #cdd7e1;
  border-radius: 6px;
  margin-right: 8px;
  width: 240px;
}
/* 辅助说明文字 */
.order-comm__echo {
  font-size: 12px;
  color: #8896a6;
  margin: 8px 0 0;
}
/* 通知列表 */
.order-comm__notice-list {
  margin: 10px 0 0;
  padding-left: 18px;
  line-height: 1.9;
  font-size: 13px;
}
/* 区块内按钮间距:只加右间距,避免影响全局按钮基类 */
.order-btn {
  margin-right: 8px;
}
/* 输入框与按钮同行,行内元素基线对齐即可,无需额外垂直居中处理 */
</style>
