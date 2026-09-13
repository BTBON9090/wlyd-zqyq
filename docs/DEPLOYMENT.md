# 构建与部署

## 两种构建

| 命令                    | 目录            | 用途                                   |
| ----------------------- | --------------- | -------------------------------------- |
| `npm run build:preview` | `dist-preview/` | 客户验收，模拟数据，保留验收面板       |
| `npm run build`         | `dist/`         | 正式静态前端，只调用 API，去除模拟代码 |

Vite 配置在编译阶段注入 `__DEMO__`；正式构建无论 `.env` 写了什么都不会启用 demo。动态 import 入口直接引用编译常量，避免跨模块常量折叠不足导致 mock chunk 残留。正式发布前可检查：

```bash
npm ci
npm run build
rg -l '123456|PARK2026|demo-enterprise-user|验收工具|mockGateway' dist/assets
```

上面搜索应无匹配；这只是产物隔离检查，不能替代后端鉴权。CSS 中可能保留未被使用的面板样式，不含功能或测试账号。

## 环境变量

复制 `.env.example` 为 `.env.local` 后调整。所有 `VITE_` 变量会暴露给浏览器，不能放密钥。

| 变量                 | 默认值／说明                                      |
| -------------------- | ------------------------------------------------- |
| `VITE_DATA_MODE`     | 开发 demo；开发联调可设 api。生产强制 API         |
| `VITE_API_BASE_URL`  | `/api`                                            |
| `VITE_SITE_NAME`     | 政企园区企业服务平台                              |
| `VITE_PARK_NAME`     | 经开区                                            |
| `VITE_HERO_IMAGE`    | 空值使用占位；相对 public 路径                    |
| `VITE_SUPPORT_PHONE` | 空值不展示虚构电话号码                            |
| `VITE_ICP_NUMBER`    | 空值不展示虚构备案号                              |
| `DEPLOY_BASE`        | 构建命令的环境变量，根路径 `/`，可指定 `/client/` |
| `API_PROXY_TARGET`   | 本地开发反向代理目标，仅 Vite 服务端读取          |

所有配置为构建时配置；更改后需重新 build。`index.html` 的静态标题、描述、favicon 和 theme-color 也应随正式品牌调整。JS 运行后标题会按路由与平台名称更新。

## Nginx 根路径示例

以下供运维修改，`server_name`、证书、路径和后端地址必须换成真实值。这里不创建远程部署，也不假设已有正式域名。

```nginx
server {
    listen 443 ssl;
    server_name park.example.com;
    root /srv/park-client/dist;
    index index.html;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    client_max_body_size 11m;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header X-Frame-Options DENY always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" always;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 20s;
    }
    location /assets/ {
        try_files $uri =404;
        expires 1y;
    }
    location = /index.html {
        expires -1;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

如图片或 API 改为外部域名，准确配置 CORS、credentials、Cookie 和 CSP 域名。不要简单添加全域允许。HTTP 应由运维统一跳转 HTTPS。没有 HTTPS 时不要对外接收身份资料。

## 子目录 `/client/`

```bash
DEPLOY_BASE=/client/ npm run build
```

将产物放入 `/srv/www/client/`。Nginx 根设为 `/srv/www`，页面规则使用：

```nginx
location /client/assets/ { try_files $uri =404; expires 1y; }
location = /client/index.html { expires -1; }
location /client/ { try_files $uri $uri/ /client/index.html; }
```

BrowserRouter basename 和资源 base 一致；`/api` 仍是站点根路径，不会自动变成 `/client/api`。如果 API 放在子目录，需要明确设置 API 基址。原型用 HashRouter 避免刷新 404，新版采用干净 URL，并明确要求 SPA fallback。

## 发布与回滚

1. 本地 `npm ci`、typecheck、build；使用真实 API 环境完成账号和申请联调。
2. 把新的 dist 放进独立发布目录，用预发布域名查看直接深链、刷新和静态资源。
3. 配好正式品牌、协议、联系信息、HTTPS 和后端，再由部署平台发布。
4. 切换软链或发布版本时保留上一版完整 assets；不要只覆盖 index 导致缓存中的旧页面加载失败。
5. 发生异常时切回上一发布目录。本次未改数据库，也未触发任何实际远程发布。

`dist-preview`、`archive` 和本地浏览器测试数据无需迁移到正式站点。

## V2 首页运营配置

默认正式首页为 V2；构建变量 `VITE_HOME_VERSION=v1` 可选择 V1。开发/演示中的悬浮版本按钮不进入正式界面。

默认读取 `content/homepage.json`，部署时要一起上传 `dist/content/`。该文件是运营内容，不应使用 assets 的一年缓存策略。可通过 `VITE_HOMEPAGE_CONTENT_URL` 改为后台公开 JSON 接口；接口若跨域，需要纳入 CSP `connect-src` 并设置对应 CORS。配置字段与素材要求见 [V2 首页说明](HOMEPAGE_V2.md)。
