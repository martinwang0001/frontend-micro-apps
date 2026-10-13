<template>
  <!-- 根类名 order-home:BEM 命名空间,本页所有私有类都挂在它下面 -->
  <div class="order-home">
    <h2>订单列表</h2>
    <!-- 页头说明:点明本页的 Vue2 filters 演示点 -->
    <!-- v-text 用于在页面上"原样展示"插值语法本身,防止被 Vue 编译掉 -->
    <p class="order-home__tip">
      模拟老项目的订单管理表格。<b>老项目特性演示:</b>
      金额列使用 Vue2 独有的 filters 语法(<code v-text="'{{ price | currency }}'"></code>)
      格式化输出 —— filters 在 Vue3 中已被移除,是存量 Vue2 项目的标志性写法。
    </p>

    <!-- 模拟订单表格:单号 / 商品 / 金额(currency 过滤器) / 状态 / 操作 五列 -->
    <!-- order-card 是全局基类(styles/index.css),order-home__panel 是本页布局类 -->
    <div class="order-card order-home__panel">
      <table class="order-table">
        <thead>
          <tr>
            <!-- 五列语义:单号(标识) / 商品 / 金额(分,filters 格式化) / 状态 / 操作 -->
            <th>订单号</th>
            <th>商品</th>
            <th>金额</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- v-for 必须配 :key,Vue2 就地复用策略下缺 key 会导致状态错乱 -->
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.no }}</td>
            <td>{{ order.title }}</td>
            <!-- Vue2 filters:管道符语法,仅 Vue2 支持;金额以"分"存储,过滤器负责格式化 -->
            <td class="order-home__price">{{ order.price | currency }}</td>
            <td>
              <!-- 状态徽标:按 statusType 动态拼接修饰类(is-pending / is-paid / ...) -->
              <span
                class="order-home__status"
                :class="'is-' + order.statusType"
              >
                {{ order.status }}
              </span>
            </td>
            <td>
              <!-- 待支付订单给"确认支付"操作,其余仅可查看 -->
              <!-- v-if/v-else 互斥渲染,保证操作列只有一个按钮 -->
              <button
                v-if="order.statusType === 'pending'"
                class="order-btn order-btn--small"
                @click="payOrder(order)"
              >
                确认支付
              </button>
              <button
                v-else
                class="order-btn order-btn--small order-btn--plain"
                @click="viewOrder(order)"
              >
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 合计行:computed 求和后同样走 currency 过滤器格式化 -->
      <p class="order-home__total">
        合计:<b>{{ totalPrice | currency }}</b>
      </p>
    </div>
    <!-- 本页结束:无定时器/订阅等副作用,卸载时无需额外清理 -->
  </div>
</template>

<script>
/**
 * 订单列表页(Options API)
 * ---------------------------------------------------------------
 * 【老项目特性 —— Vue2 filters】
 * filters 是 Vue2 的模板格式化语法:{{ value | filterName }}。
 * Vue3 已彻底移除该特性(官方建议改用计算属性或方法),
 * 因此 filters 成为识别"存量 Vue2 代码"的典型信号。
 * 本页用 currency 过滤器把金额(分)格式化为人民币展示。
 *
 * 【坑点】
 * 1. filters 中无法访问 this(官方设计如此,保证纯粹性),
 *    需要组件状态的格式化请改用 computed / methods;
 * 2. filters 可链式调用:{{ price | currency | exclaim }},
 *    前一个的输出是后一个的输入;
 * 3. 迁移提示:若未来升级 Vue3,本页的 currency 可平移到全局方法或
 *    组合式函数,模板改为 {{ currency(price) }} 即可,逻辑零改动。
 *
 * 【本页数据流】
 *   orders(data)         ——> v-for 渲染表格行;payOrder 就地修改状态
 *   totalPrice(computed) ——> 合计行展示,同样经 currency 过滤器格式化
 */
export default {
  name: 'OrderHomeView',
  filters: {
    /**
     * 金额格式化:入参单位为分,输出带千分位的人民币字符串
     * @param {number} cents 金额(分)
     * @returns {string} 形如 ¥1,299.00
     */
    currency(cents) {
      // 分转元并固定两位小数(toFixed 返回字符串)
      const yuan = (Number(cents) / 100).toFixed(2)
      // 千分位分隔:每三位数字前插入逗号
      // \B 匹配非单词边界,负向断言 (?!\d) 防止小数部分被分隔
      const withSep = yuan.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      // 拼上人民币符号返回
      return `¥${withSep}`
    }
  },
  data() {
    return {
      /**
       * 模拟订单数据(price 单位:分;statusType 驱动状态颜色与操作按钮)
       * 金额用"分"存储是行业标准做法:避免浮点精度问题(0.1 + 0.2 !== 0.3)
       */
      orders: [
        { id: 1, no: 'SO20261013001', title: '机械键盘 ×1', price: 39900, status: '待支付', statusType: 'pending' },
        { id: 2, no: 'SO20261012008', title: '人体工学椅 ×1', price: 129900, status: '已支付', statusType: 'paid' },
        { id: 3, no: 'SO20261011015', title: '4K 显示器 ×2', price: 259800, status: '已发货', statusType: 'shipped' },
        { id: 4, no: 'SO20261010022', title: 'USB-C 扩展坞 ×1', price: 24900, status: '已完成', statusType: 'done' }
      ]
    }
  },
  computed: {
    // computed 具备缓存:orders 未变化时不会重复求和
    /** 合计金额(分):订单金额之和,展示时由 currency 过滤器格式化 */
    totalPrice() {
      return this.orders.reduce((sum, o) => sum + o.price, 0)
    }
  },
  methods: {
    /**
     * 确认支付:就地修改订单状态
     * Vue2 响应式基于 defineProperty:直接修改对象已有属性即可触发视图更新,
     * 但新增/删除属性必须用 $set/$delete(本例只改已有属性,安全)。
     */
    payOrder(order) {
      // 展示文案与状态类型同步更新(真实项目中这里会先调支付接口)
      order.status = '已支付'
      // statusType 驱动模板中的状态颜色与操作按钮切换
      order.statusType = 'paid'
    },
    /**
     * 查看订单(演示用,仅弹出单号)
     * 真实项目:router.push(`/detail/${order.no}`)
     */
    viewOrder(order) {
      alert(`查看订单:${order.no}`)
    }
  }
}
</script>

<style scoped>
/* 本页样式全部 scoped:编译后追加 data-v 属性,不影响其它组件 */
/* 颜色约定:主色 #5c3d12(深棕),成功 #2e9e5b(绿),警示 #d64545(红),信息 #1b5e8f(蓝) */
/* 页标题 */
.order-home h2 {
  margin: 0 0 6px;
  color: #5c3d12;
}
/* 页头说明文字 */
.order-home__tip {
  font-size: 12px;
  color: #8896a6;
  margin: 0 0 14px;
}
/* 卡片间距 */
.order-home__panel {
  margin-bottom: 12px;
}
/* 金额列:主色加粗,突出订单里最关键的数字 */
.order-home__price {
  font-weight: 700;
  color: #b07d2b;
}
/* 状态徽标基础样式:仅加粗,颜色由 is-xxx 状态类给出 */
.order-home__status {
  font-weight: 600;
}
/* ---- 状态色:以下 is- 修饰类与 data 中的 statusType 一一对应 ---- */
/* 待支付:红色(需用户关注) */
.order-home__status.is-pending {
  color: #d64545;
}
/* 已支付:绿色 */
.order-home__status.is-paid {
  color: #2e9e5b;
}
/* 已发货:蓝色 */
.order-home__status.is-shipped {
  color: #1b5e8f;
}
/* 已完成:灰色(归档态),视觉权重最低 */
.order-home__status.is-done {
  color: #8896a6;
}
/* ---- 底部合计 ---- */
/* 合计行:右对齐突出总额 */
.order-home__total {
  text-align: right;
  margin: 12px 0 0;
  font-size: 14px;
}
/* 行内代码样式:浅棕底与应用主色系一致;scoped 下仅命中本组件 */
code {
  background: #f7efe1;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
