# ===============================================================
# 通用多阶段构建 Dockerfile(基座 + 8 个子应用共用)
# ---------------------------------------------------------------
# 【设计思路】monorepo 下 9 个应用的构建流程完全一致,差异只有两个变量:
#   1. APP_NAME    构建哪个 workspace(如 app-vue3-dashboard)
#   2. NGINX_CONF  运行时挂载哪份 nginx 配置(基座与子应用策略不同)
# 因此用"一份 Dockerfile + 构建参数"替代 9 份重复文件:
#   docker build --build-arg APP_NAME=app-react-cms ...
# 由 docker-compose.yml 统一编排,详见该文件。
#
# 【分层缓存策略】依赖安装层只 COPY 各 workspace 的 package.json,
# 源码变更不会触发 npm ci 重装 —— 这是 CI 提速的关键。
# ===============================================================

# ---- 阶段一:构建器 --------------------------------------------
# node:20-alpine 体积小且官方维护;构建只需 node/npm,不需要 python 等
FROM node:20-alpine AS builder

# 构建参数:要构建的 workspace 名称(与 apps/ 目录名一致)
ARG APP_NAME

WORKDIR /app

# 1) 先只拷贝"依赖清单"并安装依赖(利用 Docker 层缓存)
#    npm workspaces 要求所有 workspace 的 package.json 就位后才能 npm ci
COPY package.json package-lock.json ./
COPY apps/portal/package.json            apps/portal/
COPY apps/app-vue2-user/package.json     apps/app-vue2-user/
COPY apps/app-vue2-order/package.json    apps/app-vue2-order/
COPY apps/app-vue3-dashboard/package.json apps/app-vue3-dashboard/
COPY apps/app-vue3-report/package.json   apps/app-vue3-report/
COPY apps/app-react-mall/package.json    apps/app-react-mall/
COPY apps/app-react-cms/package.json     apps/app-react-cms/
COPY apps/app-svelte-monitor/package.json apps/app-svelte-monitor/
COPY apps/app-svelte-log/package.json    apps/app-svelte-log/
COPY packages/shared/package.json        packages/shared/

# npm ci 严格按 lockfile 安装(可复现构建);workspaces 自动互相软链
RUN npm ci

# 2) 再拷贝全部源码(此层变更不影响上面的依赖缓存层)
COPY apps/   apps/
COPY packages/ packages/

# 3) 构建目标 workspace;@micro/shared 直接以源码形式被 Vite 编译,无需预构建
#    生产构建时 vite-plugin-qiankun 会把入口包装成 UMD 生命周期对象
RUN npm run build -w apps/${APP_NAME}

# ---- 阶段二:运行时 --------------------------------------------
# 静态站点用 nginx 托管;多阶段构建保证最终镜像不含 node_modules
FROM nginx:1.27-alpine

# 【坑点修复】ARG 是【阶段作用域】的:builder 阶段声明的 ARG APP_NAME
# 不会自动带到这里,必须重新声明才能拿到 --build-arg 的值,
# 否则 ${APP_NAME} 展开为空,COPY 路径塌陷成 /app/apps//dist → 构建失败
ARG APP_NAME

# 运行时参数:基座与子应用使用不同的 nginx 配置
ARG NGINX_CONF=docker/nginx/subapp.conf

# 覆盖默认站点配置(去掉 /etc/nginx/conf.d/default.conf 的干扰)
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf

# 仅拷贝构建产物(builder 阶段的 dist),不含源码与依赖
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html

EXPOSE 80

# nginx 基础镜像自带 daemon off 前台运行,无需额外 CMD
