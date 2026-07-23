# Jimu Admin UI

Jimu Admin 的管理端前端，基于 Bell-Plus 6.X 前端契约开发，配套 Solon 与 Xbatis 后端使用。

## 环境要求

- Node.js `^22.18.0 || ^24.0.0`
- pnpm `11.2.2`
- Jimu Admin 后端默认地址 `http://127.0.0.1:5320`

## 本地开发

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发服务器默认监听 `http://127.0.0.1:5666`，并将 `/dev-api` 代理到 Jimu Admin 后端。

## 构建与检查

```bash
pnpm typecheck
pnpm test:unit
pnpm lint
pnpm build
```

## 端到端测试

端到端测试依赖由后端仓库统一准备的后端服务、测试数据和前端构建产物。唯一受支持的入口是后端仓库的 `node script/test-fullstack.mjs`，不要在前端仓库直接运行 `pnpm test:e2e`。

运行该入口还需要 Java 17、Maven、MySQL 8、Redis，以及已加入 `PATH` 的 `mysql`、`redis-cli` 和 Corepack。

在 Windows PowerShell 中运行：

```powershell
$backendDir = 'C:\path\to\jimuqu-admin'
$frontendDir = 'C:\path\to\jimuqu-admin-ui'
$env:JIMU_TEST_MYSQL_PASSWORD = Read-Host '请输入本机 MySQL root 密码'
$env:JIMU_TEST_FRONTEND_DIR = $frontendDir
Set-Location $backendDir
node script/test-fullstack.mjs
```

在 macOS 或 Linux 中运行：

```bash
export JIMU_TEST_FRONTEND_DIR='/path/to/jimuqu-admin-ui'
export JIMU_TEST_MYSQL_PASSWORD='本机 MySQL root 密码'
cd '/path/to/jimuqu-admin'
node script/test-fullstack.mjs
```

## 接口响应

普通 JSON 响应统一为：

```json
{ "code": 200, "msg": "成功", "data": {} }
```

分页响应统一为：

```json
{ "code": 200, "msg": "成功", "data": { "rows": [], "total": 0 } }
```

文件下载、SSE 和 WebSocket 按各自协议传输，不使用 JSON 响应外壳。

## 许可证

本项目使用 [MIT License](LICENSE)。第三方项目的版权和许可声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 上游项目声明

- [Bell-Plus](https://gitee.com/dapppp/bell-plus)，采用 `main` 分支，迁移基线 `c1a99e5d9f568936d8e3fbcf37d302d5ca3127de`，MIT License。其代码基于 Vue Vben Admin，原许可声明为 `Copyright (c) 2024-present, Vben`。
- [RuoYi-Vue-Plus](https://gitee.com/dromara/RuoYi-Vue-Plus/tree/6.X/)，接口参考 `6.X` 分支，基线 `da5f30cae2deb174a1ba37a2ad41ff1ba42c9f38`，MIT License，`Copyright (c) 2019 RuoYi-Vue-Plus`。
