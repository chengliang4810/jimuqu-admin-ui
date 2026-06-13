# Packages 迁移到 src 单仓方案

## 1. 现状分析

### 1.1 当前项目结构

```
refactor-vben5/
├── src/                          # 主应用入口 (333 个 .ts/.vue/.tsx 文件)
│   ├── adapter/                  # 适配层 (表单、组件映射)
│   ├── api/                      # API 模块
│   ├── components/               # 业务组件
│   ├── layouts/                  # 布局组件 (auth.vue, basic.vue)
│   ├── locales/                  # 国际化入口
│   ├── router/                   # 路由配置
│   ├── store/                    # Pinia stores
│   ├── utils/                    # 应用工具函数
│   └── views/                    # 页面视图
│
├── packages/                     # 多包源码 (779 个文件)
│   ├── @core/                    # 核心基础层
│   │   ├── base/
│   │   │   ├── shared/           # @vben-core/shared — 基础工具
│   │   │   ├── typings/          # @vben-core/typings — 类型定义
│   │   │   ├── icons/            # @vben-core/icons — 图标组件
│   │   │   └── design/           # @vben-core/design — 设计令牌/CSS
│   │   ├── composables/          # @vben-core/composables — Vue composables
│   │   ├── preferences/          # @vben-core/preferences — 偏好设置引擎
│   │   └── ui-kit/               # UI 组件库
│   │       ├── adapter/          # @vben-core/ui-adapter
│   │       ├── shadcn-ui/        # @vben-core/shadcn-ui
│   │       ├── layout-ui/        # @vben-core/layout-ui
│   │       ├── menu-ui/          # @vben-core/menu-ui
│   │       ├── tabs-ui/          # @vben-core/tabs-ui
│   │       ├── popup-ui/         # @vben-core/popup-ui
│   │       └── form-ui/          # @vben-core/form-ui
│   │
│   ├── constants/                # @vben/constants
│   ├── types/                    # @vben/types
│   ├── utils/                    # @vben/utils
│   ├── icons/                    # @vben/icons
│   ├── locales/                  # @vben/locales
│   ├── preferences/              # @vben/preferences (薄包装)
│   ├── stores/                   # @vben/stores
│   ├── styles/                   # @vben/styles
│   └── effects/                  # 效果/业务包
│       ├── access/               # @vben/access
│       ├── common-ui/            # @vben/common-ui
│       ├── hooks/                # @vben/hooks
│       ├── layouts/              # @vben/layouts
│       ├── plugins/              # @vben/plugins
│       └── request/              # @vben/request
│
├── internal/                     # 开发工具 (不迁移，保持独立)
│   ├── node-utils/
│   ├── tailwind-config/
│   ├── tsconfig/
│   ├── vite-config/
│   ├── lint-configs/
│   └── scripts/vsh/
│
└── scripts/                      # 构建/部署脚本 (不迁移)
```

### 1.2 依赖层级关系

```
@vben-core/shared (基础工具，零框架依赖)
  ↓
@vben-core/typings + icons + design
  ↓
@vben-core/composables
  ↓
@vben-core/preferences
  ↓
@vben-core/ui-kit/* (shadcn-ui, layout-ui, menu-ui, tabs-ui, popup-ui, form-ui)
  ↓
@vben/* 薄包装层 (constants, types, utils, icons, locales, stores, styles)
  ↓
@vben/effects/* (hooks → access, request, common-ui, plugins → layouts)
  ↓
src/ (应用入口，消费所有包)
```

### 1.3 关键数据

| 指标 | 数值 |
|------|------|
| packages/ 源文件数 | 779 |
| src/ 源文件数 | 333 |
| `@vben/*` 导入引用数 | 1089 |
| `@vben-core/*` 导入引用数 | 448 |
| **需更新的导入总数** | **~1537** |
| 独立 package.json 数 | 20+ |
| 被迁移的包数 | 22 |

### 1.4 当前痛点

1. **包管理复杂** — 20+ 个包各自有 package.json、tsconfig、构建配置
2. **依赖声明冗余** — 同一个依赖在多个 package.json 中重复声明
3. **开发体验差** — 修改一个包需要重新构建才能在主应用中生效（或依赖 tsdown dev 模式）
4. **导入路径冗长** — `@vben-core/shared/utils` 等深层路径
5. **不必要的模块边界** — 这是单应用项目，不需要发布独立 npm 包

---

## 2. 目标架构

### 2.1 迁移后结构

```
refactor-vben5/
├── src/
│   ├── core/                     # ← packages/@core/ (核心基础层)
│   │   ├── shared/               #    基础工具 (cn, date, diff, dom, download, merge, tree...)
│   │   ├── typings/              #    全局类型定义
│   │   ├── icons/                #    图标组件 (Iconify + Lucide)
│   │   ├── design/               #    设计令牌 (CSS 变量, SCSS BEM)
│   │   ├── composables/          #    Vue composables (useIsMobile, useLayoutStyle...)
│   │   ├── preferences/          #    偏好设置引擎
│   │   └── ui/                   #    UI 组件
│   │       ├── adapter/          #     框架适配层
│   │       ├── shadcn/           #     shadcn-vue 组件
│   │       ├── layout/           #     布局组件
│   │       ├── menu/             #     菜单组件
│   │       ├── tabs/             #     标签页组件
│   │       ├── popup/            #     弹窗组件
│   │       └── form/             #     表单组件
│   │
│   ├── effects/                  # ← packages/effects/ (效果/业务层)
│   │   ├── access/               #    权限控制 (指令/组件/composable)
│   │   ├── common-ui/            #    通用 UI 组件 (代码编辑器, JSON 查看器, 二维码...)
│   │   ├── hooks/                #    应用级 hooks (水印...)
│   │   ├── layouts/              #    应用布局组件
│   │   ├── plugins/              #    插件集成 (ECharts, VXE-Table, Motion)
│   │   └── request/              #    HTTP 请求客户端
│   │
│   ├── constants/                # ← packages/constants/ + 合并 src 同名
│   ├── types/                    # ← packages/types/ + 合并 src 同名
│   ├── utils/                    # ← packages/utils/ + 合并 src/utils/
│   ├── locales/                  # ← packages/locales/ + 合并 src/locales/
│   ├── stores/                   # ← packages/stores/ + 合并 src/store/
│   ├── styles/                   # ← packages/styles/ + 合并 src 全局样式
│   ├── icons-app/                # ← packages/icons/(应用级图标配置 + SVG 资源)
│   │
│   ├── adapter/                  # (保持) 适配层配置
│   ├── api/                      # (保持) API 模块
│   ├── components/               # (保持) 业务组件
│   ├── layouts/                  # (保持) 布局入口
│   ├── router/                   # (保持) 路由
│   └── views/                    # (保持) 页面
│
├── internal/                     # (保持) 开发工具
├── scripts/                      # (保持) 构建脚本
├── public/                       # (保持) 静态资源
└── package.json                  # 合并所有依赖
```

### 2.2 设计原则

1. **核心层 (`core/`)** — 零业务耦合的基础设施，可独立理解和使用
2. **效果层 (`effects/`)** — 有业务语义的功能模块，依赖核心层
3. **应用层 (现有 src/ 目录)** — 业务页面和配置，按功能聚合
4. **同名目录合并** — 当 packages 和 src 存在同名目录时，分析内容后合并
5. **内部工具不动** — `internal/` 和 `scripts/` 保持独立

---

## 3. 导入路径映射规则

### 3.1 核心层映射

| 原导入 | 新导入 |
|--------|--------|
| `@vben-core/shared` | `@/core/shared` |
| `@vben-core/shared/constants` | `@/core/shared/constants` |
| `@vben-core/shared/utils` | `@/core/shared/utils` |
| `@vben-core/shared/color` | `@/core/shared/color` |
| `@vben-core/shared/cache` | `@/core/shared/cache` |
| `@vben-core/shared/store` | `@/core/shared/store` |
| `@vben-core/shared/global-state` | `@/core/shared/global-state` |
| `@vben-core/typings` | `@/core/typings` |
| `@vben-core/icons` | `@/core/icons` |
| `@vben-core/design` | `@/core/design` |
| `@vben-core/design/bem` | `@/core/design/bem` |
| `@vben-core/design/theme` | `@/core/design/theme` |
| `@vben-core/composables` | `@/core/composables` |
| `@vben-core/preferences` | `@/core/preferences` |
| `@vben-core/ui-adapter` | `@/core/ui/adapter` |
| `@vben-core/shadcn-ui` | `@/core/ui/shadcn` |
| `@vben-core/layout-ui` | `@/core/ui/layout` |
| `@vben-core/menu-ui` | `@/core/ui/menu` |
| `@vben-core/tabs-ui` | `@/core/ui/tabs` |
| `@vben-core/popup-ui` | `@/core/ui/popup` |
| `@vben-core/form-ui` | `@/core/ui/form` |

### 3.2 效果层映射

| 原导入 | 新导入 |
|--------|--------|
| `@vben/access` | `@/effects/access` |
| `@vben/common-ui` | `@/effects/common-ui` |
| `@vben/common-ui/es/loading` | `@/effects/common-ui/loading` |
| `@vben/hooks` | `@/effects/hooks` |
| `@vben/layouts` | `@/effects/layouts` |
| `@vben/plugins` | `@/effects/plugins` |
| `@vben/request` | `@/effects/request` |

### 3.3 应用层映射

| 原导入 | 新导入 | 说明 |
|--------|--------|------|
| `@vben/constants` | `@/constants` | 合并到 src/constants |
| `@vben/types` | `@/types` | 合并到 src/types |
| `@vben/utils` | `@/utils` | 合并到 src/utils |
| `@vben/icons` | `@/icons-app` | 避免与 core/icons 冲突 |
| `@vben/locales` | `@/locales` | 合并到 src/locales |
| `@vben/preferences` | `@/core/preferences` | 薄包装，直接用 core |
| `@vben/stores` | `@/stores` | 合并到 src/stores |
| `@vben/styles` | `@/styles` | 合并到 src/styles |
| `@vben/styles/antd` | `@/styles/antd` | |
| `@vben/styles/antdv-next` | `@/styles/antdv-next` | |
| `@vben/styles/ele` | `@/styles/ele` | |
| `@vben/styles/naive` | `@/styles/naive` | |
| `@vben/styles/global` | `@/styles/global` | |

---

## 4. 配置变更

### 4.1 tsconfig.json 路径别名

```jsonc
// 迁移前
{
  "compilerOptions": {
    "paths": {
      "#/*": ["./src/*"],
      "@vben/*": ["./packages/*/src"],
      "@vben-core/*": ["./packages/@core/*/src"]
    }
  }
}

// 迁移后（简化）
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4.2 package.json 变更

```jsonc
// 需要做的事：
// 1. 移除所有 workspace:* 的 @vben/* 和 @vben-core/* 依赖
// 2. 将每个被迁移包的 dependencies 合并到根 package.json
// 3. 去重（同一依赖不同版本取最高）
// 4. 移除 postinstall 中的 stub 脚本
// 5. 简化 scripts（不需再构建子包）
```

### 4.3 pnpm-workspace.yaml 变更

```yaml
# 迁移前
packages:
  - internal/*
  - internal/lint-configs/*
  - packages/*
  - packages/@core/base/*
  - packages/@core/forward/*
  - packages/@core/*
  - packages/effects/*
  - packages/business/*
  - scripts/*

# 迁移后
packages:
  - internal/*
  - internal/lint-configs/*
  - scripts/*
# 仅保留工具链包，所有业务包已移入 src/
```

### 4.4 vite.config.ts 变更

移除对子包的独立处理（如需要），简化为标准单应用构建：

```ts
// 移除子包别名解析插件，统一用 @/ 别名
// 移除子包 CSS/SCSS 独立处理
```

---

## 5. 同名目录合并策略

当 packages 和 src 存在同名目录时：

### 5.1 stores ↔ store

| 来源 | 文件 | 处理方式 |
|------|------|---------|
| packages/stores/src/modules/user.ts | Pinia user store | → `src/stores/modules/user.ts` |
| packages/stores/src/modules/access.ts | 权限 store | → `src/stores/modules/access.ts` |
| packages/stores/src/modules/tabbar.ts | 标签页 store | → `src/stores/modules/tabbar.ts` |
| packages/stores/src/modules/timezone.ts | 时区 store | → `src/stores/modules/timezone.ts` |
| packages/stores/src/setup.ts | store 初始化 | → `src/stores/setup.ts` |
| src/store/auth.ts | 已有 auth store | 保持，与迁移文件合并 |
| src/store/dict.ts | 已有 dict store | 保持 |
| src/store/loading.ts | 已有 loading store | 保持 |
| src/store/notify.ts | 已有 notify store | 保持 |

**处理**: `src/store/` 重命名为 `src/stores/`，统一用复数形式。

### 5.2 locales

| 来源 | 文件 | 处理方式 |
|------|------|---------|
| packages/locales/src/i18n.ts | i18n 核心配置 | → `src/locales/i18n.ts` |
| packages/locales/src/typing.ts | 类型定义 | → `src/locales/typing.ts` |
| packages/locales/src/langs/ | 语言文件 (zh-CN, en-US) | → `src/locales/langs/` |
| src/locales/index.ts | 已有入口 | 与 packages/locales/src/index.ts 合并 |

**处理**: 两个 index.ts 合并为一个，保留 app 级配置，整合 i18n 核心逻辑。

### 5.3 utils

| 来源 | 文件 | 处理方式 |
|------|------|---------|
| packages/utils/src/encryption/ | 加密工具 (AES, RSA, SM) | → `src/utils/encryption/` |
| packages/utils/src/helpers/ | 路由、菜单、树等工具 | → `src/utils/helpers/` |
| src/utils/http/ | HTTP 工具 | 保持 |
| src/utils/mitt/ | 事件总线 | 保持 |
| src/utils/message.ts | 消息工具 | 保持 |

**处理**: 因功能不重叠，直接合并文件到对应子目录。

### 5.4 icons

packages/icons 包含应用级 SVG 图标，与 core/icons（组件库）功能不同。

**处理**: packages/icons → `src/icons-app/`（避免与 `core/icons` 混淆），也保留 `@/icons-app` 别名。

### 5.5 preferences

packages/preferences 只有 1 个文件（index.ts），是 `@vben-core/preferences` 的薄包装。

**处理**: 直接使用 `@/core/preferences`，删除 packages/preferences。

---

## 6. 分步执行计划

### 阶段一：准备工作（不影响运行）

**步骤 1.1** — 创建 `src/core/` 和 `src/effects/` 目录骨架
```bash
mkdir -p src/core/{shared,typings,icons,design,composables,preferences}
mkdir -p src/core/ui/{adapter,shadcn,layout,menu,tabs,popup,form}
mkdir -p src/effects/{access,common-ui,hooks,layouts,plugins,request}
```

**步骤 1.2** — 移动核心层文件（直接复制，不删除原文件）
```bash
# @core/base
cp -r packages/@core/base/shared/src/* src/core/shared/
cp -r packages/@core/base/typings/src/* src/core/typings/
cp -r packages/@core/base/icons/src/* src/core/icons/
cp -r packages/@core/base/design/src/* src/core/design/

# @core/composables & preferences
cp -r packages/@core/composables/src/* src/core/composables/
cp -r packages/@core/preferences/src/* src/core/preferences/

# @core/ui-kit (重命名 -ui 后缀)
cp -r packages/@core/ui-kit/ui-adapter/src/* src/core/ui/adapter/
cp -r packages/@core/ui-kit/shadcn-ui/src/* src/core/ui/shadcn/
cp -r packages/@core/ui-kit/layout-ui/src/* src/core/ui/layout/
cp -r packages/@core/ui-kit/menu-ui/src/* src/core/ui/menu/
cp -r packages/@core/ui-kit/tabs-ui/src/* src/core/ui/tabs/
cp -r packages/@core/ui-kit/popup-ui/src/* src/core/ui/popup/
cp -r packages/@core/ui-kit/form-ui/src/* src/core/ui/form/
```

**步骤 1.3** — 移动效果层文件
```bash
cp -r packages/effects/access/src/* src/effects/access/
cp -r packages/effects/common-ui/src/* src/effects/common-ui/
cp -r packages/effects/hooks/src/* src/effects/hooks/
cp -r packages/effects/layouts/src/* src/effects/layouts/
cp -r packages/effects/plugins/src/* src/effects/plugins/
cp -r packages/effects/request/src/* src/effects/request/
```

### 阶段二：批量导入路径替换

这是最关键的步骤，需要更新 ~1537 处导入。

**步骤 2.1** — 使用脚本批量替换 `@vben-core/*` → `@/core/*`

替换规则（按顺序执行，避免误匹配）：

```bash
# 1. 先替换含子路径的 (避免被主路径匹配)
sed -i "s|from '@vben-core/shared/constants|from '@/core/shared/constants|g"
sed -i "s|from '@vben-core/shared/utils|from '@/core/shared/utils|g"
sed -i "s|from '@vben-core/shared/color|from '@/core/shared/color|g"
sed -i "s|from '@vben-core/shared/cache|from '@/core/shared/cache|g"
sed -i "s|from '@vben-core/shared/store|from '@/core/shared/store|g"
sed -i "s|from '@vben-core/shared/global-state|from '@/core/shared/global-state|g"

# 2. 替换主包路径
sed -i "s|from '@vben-core/shared|from '@/core/shared|g"
sed -i "s|from '@vben-core/typings|from '@/core/typings|g"
sed -i "s|from '@vben-core/icons|from '@/core/icons|g"
sed -i "s|from '@vben-core/design|from '@/core/design|g"
sed -i "s|from '@vben-core/composables|from '@/core/composables|g"
sed -i "s|from '@vben-core/preferences|from '@/core/preferences|g"

# 3. UI 组件 (注意替换顺序：先子包后主包)
sed -i "s|from '@vben-core/ui-adapter|from '@/core/ui/adapter|g"
sed -i "s|from '@vben-core/shadcn-ui|from '@/core/ui/shadcn|g"
sed -i "s|from '@vben-core/layout-ui|from '@/core/ui/layout|g"
sed -i "s|from '@vben-core/menu-ui|from '@/core/ui/menu|g"
sed -i "s|from '@vben-core/tabs-ui|from '@/core/ui/tabs|g"
sed -i "s|from '@vben-core/popup-ui|from '@/core/ui/popup|g"
sed -i "s|from '@vben-core/form-ui|from '@/core/ui/form|g"
```

**步骤 2.2** — 替换 `@vben/*` → `@/*` 或对应路径

```bash
# 效果层
sed -i "s|from '@vben/access|from '@/effects/access|g"
sed -i "s|from '@vben/common-ui|from '@/effects/common-ui|g"
sed -i "s|from '@vben/common-ui/es/loading|from '@/effects/common-ui/loading|g"
sed -i "s|from '@vben/hooks|from '@/effects/hooks|g"
sed -i "s|from '@vben/layouts|from '@/effects/layouts|g"
sed -i "s|from '@vben/plugins|from '@/effects/plugins|g"
sed -i "s|from '@vben/request|from '@/effects/request|g"

# 应用层薄包装
sed -i "s|from '@vben/constants|from '@/constants|g"
sed -i "s|from '@vben/types|from '@/types|g"
sed -i "s|from '@vben/utils|from '@/utils|g"
sed -i "s|from '@vben/icons|from '@/icons-app|g"
sed -i "s|from '@vben/locales|from '@/locales|g"
sed -i "s|from '@vben/preferences|from '@/core/preferences|g"
sed -i "s|from '@vben/stores|from '@/stores|g"
sed -i "s|from '@vben/styles|from '@/styles|g"
```

**步骤 2.3** — 处理 import type 语句

```bash
# 同样规则应用于 import type
sed -i "s|from '@vben-core/shared|from '@/core/shared|g"
sed -i "s|from '@vben/types|from '@/types|g"
# ... (同上规则)
```

**步骤 2.4** — 更新移动后文件内部的相对导入

移动后的文件内部还有 `@vben-core/*` 和 `@vben/*` 导入，同样需要替换。

### 阶段三：合并同名目录

**步骤 3.1** — 合并 stores（store → stores）
```bash
# 统一命名
mv src/store src/stores-old
mkdir -p src/stores
# 合并 packages/stores/src + 原 src/store
cp -r packages/stores/src/modules src/stores/
cp -r packages/stores/src/setup.ts src/stores/
cp packages/stores/src/index.ts src/stores/  # 需手工合并导出
cp src/stores-old/*.ts src/stores/            # 原有 stores
# 处理冲突后删除临时目录
rm -rf src/stores-old
```

**步骤 3.2** — 合并 locales
- packages/locales/src/langs/ → src/locales/langs/
- packages/locales/src/i18n.ts → src/locales/
- 手工合并两个 index.ts

**步骤 3.3** — 合并 utils
- packages/utils/src/encryption/ → src/utils/encryption/
- packages/utils/src/helpers/ → src/utils/helpers/

**步骤 3.4** — 迁移 icons → icons-app
```bash
mkdir -p src/icons-app
cp -r packages/icons/src/* src/icons-app/
```

**步骤 3.5** — 迁移 styles
```bash
mkdir -p src/styles
cp -r packages/styles/src/* src/styles/
```

**步骤 3.6** — 迁移 types 和 constants
- packages/types/src/* → src/types/
- packages/constants/src/* → src/constants/

**步骤 3.7** — 移除 packages/preferences（薄包装，直接用 core）
- 更新所有 `@vben/preferences` → `@/core/preferences` 导入（已在步骤 2.2 完成）

### 阶段四：配置更新

**步骤 4.1** — 更新 tsconfig.json
```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
    // 移除 #/* 别名和 @vben/*, @vben-core/* 别名
  }
}
```

**步骤 4.2** — 更新 package.json
- 搜集所有被迁移包的 `dependencies`
- 去重后合并到根 `package.json` 的 `dependencies`
- 移除 `@vben/*` 和 `@vben-core/*` 的 `workspace:*` 引用
- 移除 `postinstall` 中的 `stub` 脚本

**步骤 4.3** — 更新 pnpm-workspace.yaml
```yaml
packages:
  - internal/*
  - internal/lint-configs/*
  - scripts/*
```

**步骤 4.4** — 更新 vite.config.ts
- 确认别名配置与 tsconfig 一致
- 移除子包独立处理逻辑（如有）

### 阶段五：清理与验证

**步骤 5.1** — 验证 TypeScript 编译
```bash
pnpm typecheck
```

**步骤 5.2** — 验证开发服务器
```bash
pnpm dev
```

**步骤 5.3** — 验证构建
```bash
pnpm build
```

**步骤 5.4** — 删除原 packages 目录
```bash
rm -rf packages/
```

**步骤 5.5** — 清理 pnpm
```bash
pnpm install  # 刷新 lockfile
```

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 导入替换遗漏 | 编译/运行时报错 | 用 `grep` 验证无残留 `@vben` 导入；分步替换，每步验证 |
| 同名文件冲突 | 数据丢失 | 先 diff 对比，再手工合并；全程 git 版本控制 |
| 依赖版本冲突 | 运行时错误 | 合并依赖时去重取最高版本；用 pnpm why 分析依赖树 |
| packages/ 内测试文件路径变化 | 测试失败 | 更新 vitest 配置中的路径映射 |
| 全局 SCSS/CSS 引用断裂 | 样式丢失 | 验证所有 `@import` 路径；更新 vite CSS 处理配置 |
| subpath exports 模式失效 | 导入路径错误 | core/shared 的子路径导出改为直接路径导入 |
| tsdown 构建脚本引用 | 构建失败 | 移除子包的 tsdown 配置，统一用 vite 构建 |

---

## 8. 文件移动对照总表

<details>
<summary>点击展开完整对照表 (27 个包)</summary>

| 序号 | 原路径 | 目标路径 | 类型 |
|------|--------|---------|------|
| 1 | `packages/@core/base/shared/src/` | `src/core/shared/` | 核心 |
| 2 | `packages/@core/base/typings/src/` | `src/core/typings/` | 核心 |
| 3 | `packages/@core/base/icons/src/` | `src/core/icons/` | 核心 |
| 4 | `packages/@core/base/design/src/` | `src/core/design/` | 核心 |
| 5 | `packages/@core/composables/src/` | `src/core/composables/` | 核心 |
| 6 | `packages/@core/preferences/src/` | `src/core/preferences/` | 核心 |
| 7 | `packages/@core/ui-kit/ui-adapter/src/` | `src/core/ui/adapter/` | 核心 |
| 8 | `packages/@core/ui-kit/shadcn-ui/src/` | `src/core/ui/shadcn/` | 核心 |
| 9 | `packages/@core/ui-kit/layout-ui/src/` | `src/core/ui/layout/` | 核心 |
| 10 | `packages/@core/ui-kit/menu-ui/src/` | `src/core/ui/menu/` | 核心 |
| 11 | `packages/@core/ui-kit/tabs-ui/src/` | `src/core/ui/tabs/` | 核心 |
| 12 | `packages/@core/ui-kit/popup-ui/src/` | `src/core/ui/popup/` | 核心 |
| 13 | `packages/@core/ui-kit/form-ui/src/` | `src/core/ui/form/` | 核心 |
| 14 | `packages/effects/access/src/` | `src/effects/access/` | 效果 |
| 15 | `packages/effects/common-ui/src/` | `src/effects/common-ui/` | 效果 |
| 16 | `packages/effects/hooks/src/` | `src/effects/hooks/` | 效果 |
| 17 | `packages/effects/layouts/src/` | `src/effects/layouts/` | 效果 |
| 18 | `packages/effects/plugins/src/` | `src/effects/plugins/` | 效果 |
| 19 | `packages/effects/request/src/` | `src/effects/request/` | 效果 |
| 20 | `packages/constants/src/` | `src/constants/` | 合并 |
| 21 | `packages/types/src/` | `src/types/` | 合并 |
| 22 | `packages/utils/src/` | `src/utils/` | 合并 |
| 23 | `packages/icons/src/` | `src/icons-app/` | 合并 |
| 24 | `packages/locales/src/` | `src/locales/` | 合并 |
| 25 | `packages/stores/src/` | `src/stores/` | 合并 |
| 26 | `packages/styles/src/` | `src/styles/` | 合并 |
| 27 | `packages/preferences/` | (删除，薄包装，直接用 core) | 移除 |

</details>

---

## 9. 预期收益

1. **项目结构简化** — 从 20+ 独立包到 1 个统一 src 目录
2. **导入路径缩短** — `@vben-core/shadcn-ui/components/button` → `@/core/ui/shadcn/components/button`
3. **安装更快** — `pnpm install` 不再需要解析 20+ 个 workspace 包
4. **开发热更新** — 修改任何文件直接生效，无需子包构建
5. **依赖声明统一** — 所有依赖在根 package.json 一处管理
6. **新人友好** — 不需要理解 monorepo 包结构即可上手开发
