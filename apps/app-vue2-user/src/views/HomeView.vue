<template>
  <!-- 根类名 user-home:BEM 命名空间,本页所有私有类都挂在它下面 -->
  <div class="user-home">
    <h2>用户列表</h2>
    <!-- 页头说明:点明本页的两个演示点(表格 + 全局污染) -->
    <!-- 本页数据为前端 mock,老项目迁移前通常也是这种"假数据先行"的形态 -->
    <p class="user-home__tip">
      模拟老项目的用户管理表格。<b>老项目特性演示:</b>
      本页 created 钩子里向 window 挂载了全局变量 LEGACY_GLOBAL(见 script 注释),
      这是存量 Vue2 项目最常见的全局污染写法。
    </p>

    <!-- 模拟用户表格:姓名 / 角色 / 状态 / 操作 四列 -->
    <!-- user-card 是全局基类(styles/index.css),user-home__panel 是本页布局类,
         * 两者叠加体现"基类 + 页面私有类"的组合方式 -->
    <div class="user-card user-home__panel">
      <table class="user-table">
        <thead>
          <tr>
            <!-- 四列语义:姓名(标识) / 角色(权限) / 状态(启用开关) / 操作(行内按钮) -->
            <th>姓名</th>
            <th>角色</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- v-for 必须配 :key,Vue2 就地复用策略下缺 key 会导致状态错乱 -->
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.role }}</td>
            <td>
              <!-- 状态徽标:禁用时切换为红色(is-disabled 修饰类) -->
              <span
                class="user-home__status"
                :class="{ 'is-disabled': user.status === '禁用' }"
              >
                {{ user.status }}
              </span>
            </td>
            <td>
              <!-- 操作列:按钮文案随当前状态切换 -->
              <button class="user-btn user-btn--small" @click="toggleStatus(user)">
                {{ user.status === '启用' ? '禁用' : '启用' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 全局污染演示面板:把 window.LEGACY_GLOBAL 的内容展示出来 -->
    <!-- 该面板同时是"样式演示"页 JS 快照沙箱讲解的前置实验 -->
    <div class="user-card user-home__panel user-home__legacy">
      <h3>⚠️ 全局污染演示(老项目常见债务)</h3>
      <p>
        本页 created 钩子执行了
        <code>window.LEGACY_GLOBAL = { from: 'app-vue2-user', time: Date.now() }</code>:
      </p>
      <!-- 快照文本在 created 时生成,见 script -->
      <!-- <pre> 保留换行与缩进,配合 JSON.stringify(obj, null, 2) 展示结构 -->
      <pre class="user-home__legacy-code">{{ legacyGlobalText }}</pre>
      <p class="user-home__legacy-desc">
        验证沙箱回收:从主应用切走本应用后,在控制台访问
        <code>window.LEGACY_GLOBAL</code> 会得到 <code>undefined</code> ——
        qiankun 的 JS 快照沙箱会在 unmount 时自动回收新增的全局属性。
        详细原理见「样式演示」页的讲解。
      </p>
    </div>
    <!-- 本页结束:无定时器/订阅等副作用,卸载时无需额外清理 -->
  </div>
</template>

<script>
/**
 * 用户列表页(Options API)
 * ---------------------------------------------------------------
 * 【老项目特性 —— 全局污染演示】
 * 存量老项目常随手往 window 上挂变量做"跨模块传值",这在单应用时代
 * 只是技术债;但在微前端里,多个应用共用一个 window,互相覆盖同名
 * 全局变量会造成极难排查的串扰。
 *
 * qiankun 的 JS 快照沙箱(snapshotSandbox)的处理方式:
 *   - mount 时给 window 拍快照,记录应用进入前的全局状态;
 *   - 应用运行期间新增/修改的全局属性被记录在案;
 *   - unmount 时恢复快照,应用写入的全局变量被整体回收。
 * 因此切走本应用后,控制台里 window.LEGACY_GLOBAL 为 undefined。
 *
 * 【本页数据流】
 *   users(data)      ——> v-for 渲染表格行;toggleStatus 就地修改状态字段
 *   legacyGlobalText ——> created 时对 window.LEGACY_GLOBAL 拍快照,仅用于展示
 * 本页无共享 store 订阅,因此不需要 beforeDestroy 清理逻辑。
 */
export default {
  name: 'UserHomeView',
  data() {
    return {
      /** 模拟用户数据(老项目常见的前端 mock,字段对齐后端列表接口) */
      users: [
        { id: 1, name: '张伟', role: '管理员', status: '启用' },
        { id: 2, name: '王芳', role: '运营', status: '启用' },
        { id: 3, name: '李强', role: '客服', status: '禁用' },
        { id: 4, name: '赵敏', role: '财务', status: '启用' }
      ],
      /**
       * 用于模板展示的 LEGACY_GLOBAL 快照文本(created 时生成)
       * 之所以存快照而非模板直读 window:模板表达式每次重渲染都求值,
       * 直读 window 会把"展示"与"污染源"耦合,快照更清晰。
       */
      legacyGlobalText: ''
    }
  },
  created() {
    // ⚠️ 老项目典型写法:直接污染 window(勿在新代码中模仿,此处仅为演示)
    // qiankun 快照沙箱会在 unmount 时回收它;独立运行时则会真实残留
    window.LEGACY_GLOBAL = { from: 'app-vue2-user', time: Date.now() }
    // 拍一份快照用于模板展示(避免模板直接访问 window 上的活动引用);
    // JSON.stringify 的第三个参数控制缩进,让 <pre> 输出更可读
    this.legacyGlobalText = JSON.stringify(window.LEGACY_GLOBAL, null, 2)
  },
  methods: {
    // ---------- 行内操作 ----------
    // 老项目常见的"表格行内操作"模式:按钮直接拿到当前行对象,
    // 就地修改后由 Vue2 响应式刷新视图;真实项目这里会换成 API 调用
    /**
     * 切换用户启用/禁用状态
     * Vue2 响应式基于 defineProperty:直接修改对象已有属性即可触发视图更新,
     * 但新增/删除属性必须用 $set/$delete(本例只改已有属性,安全)。
     */
    toggleStatus(user) {
      user.status = user.status === '启用' ? '禁用' : '启用'
    }
  }
}
</script>

<style scoped>
/* 本页样式全部 scoped:编译后追加 data-v 属性,不影响其它组件 */
/* 颜色约定:主色 #3b2f63(深紫),成功 #2e9e5b(绿),警示 #d64545(红),辅助 #8896a6(灰) */
/* 页标题:scoped 下仅命中本组件的 h2,不会污染全局标题样式 */
.user-home h2 {
  margin: 0 0 6px;
  color: #3b2f63;
}
/* 页头说明文字:弱化处理(小字 + 灰),不抢主内容 */
.user-home__tip {
  font-size: 12px;
  color: #8896a6;
  margin: 0 0 14px;
}
/* 卡片间距:统一用 margin-bottom,避免相邻 margin 合并的不确定性 */
.user-home__panel {
  margin-bottom: 12px;
}
/* 状态徽标默认(启用):绿色,与禁用态红色形成语义对比 */
.user-home__status {
  color: #2e9e5b;
  font-weight: 600;
}
/* is- 前缀的修饰类是 BEM 之外的实用补充,专用于"状态"语义 */
/* 状态徽标(禁用):红色 */
.user-home__status.is-disabled {
  color: #d64545;
}
/* 污染演示面板标题:警示黄(与"反面教材"语义一致) */
.user-home__legacy h3 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #b8860b;
}
/* 污染演示代码块:虚线框突出"反面教材"属性 */
.user-home__legacy-code {
  background: #f7f3ea;
  border: 1px dashed #b8860b;
  border-radius: 6px;
  padding: 10px;
  font-size: 12px;
  margin: 8px 0;
}
/* 污染演示说明文字 */
.user-home__legacy-desc {
  font-size: 12px;
  color: #8896a6;
  line-height: 1.8;
  margin: 0;
}
/* 行内代码样式:浅紫底与应用主色系一致 */
code {
  background: #f0ebf8;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
