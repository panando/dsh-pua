# dsh-pua（定制版）

从 `@michengai/dsh-pua@0.3.22` 拷贝并修改而来，包名改为 `@panando/dsh-pua`，以公共包形式发布在 npm 上。

上游项目：https://github.com/MichengAI/dsh-pua （Apache-2.0，保留原 LICENSE / NOTICE）

## 为什么要改

上游把「全局开关 `alwaysOn`」当成**总闸**：全局关闭时

1. 聊天栏 PUA 入口直接不渲染（`lib/client.js` 渲染门绑定全局 `enabled`）
2. 单个会话无法开启（`lib/remote.js` `setSession` 抛错）
3. `/pua on` 命令被拒绝（`lib/command.js` 拦截）

这导致「入口常显 + 功能默认关闭、随手点开」无法实现。本版**解除这个总闸**：
入口恒常渲染，PUA 功能默认仍为关闭（`alwaysOn: false`），需要时点入口或 `/pua on` 开启**当前会话**。

## 改了什么（相对上游）

| 文件 | 改动 |
|------|------|
| `lib/client.js` | 入口渲染门 `a(ce)` → `a(!0)`：只要配置加载成功就渲染按钮，不再依赖全局 `enabled`；**并同时删除回调中的 `ce\|\|e(!1)`**（见下方「踩坑记录」） |
| `lib/client.js` | **入口改为下拉菜单**：`Lg` 组件从「按钮 → dialog」重构为「按钮 → `ne.Menu`」，菜单三项：**打开 / 关闭 / 选项**。「打开」「关闭」直接调 `setSession` 生效；当前已开启时「打开」置灰。「选项」才打开配置面板（保留原 dialog portal）。新增中英文文案 `composer.menu.*` |
| `lib/client.js` | **关态标识**：文字变淡（`opacity:.45`）+ 文字中间一条横线（水平，非斜线），挂在 `.pua-entry-label::after` |
| `lib/client.js` | **尺寸**：配置面板 430→**540px**（选项面板需要放下拉选择器与 Loop 表单）；入口菜单项缩小（`min-height:0;padding:5px 10px;font-size:13px`，菜单最大宽 160px） |
| `lib/client.js` | **菜单向上弹出**：给入口菜单加 `side:"top"` + `portal:!0`（DSH 浮层组件用 `side` prop 控制方向，内部输出 `data-side` 并据此定位）。**不要**用 `position:absolute;bottom:100%` 强行定位——那会脱离组件定位机制、连带把对话栏入口 UI 的位置顶偏 |
| `lib/client.js` | **菜单左对齐**：`align:"end"` → `align:"start"` |
| `lib/client.js` | **caret 朝向跟随展开状态**：完全照搬 DSH 权限选择器（`_PaunW`）的做法——caret 默认朝下，按钮 `[aria-expanded=true]` 时 `transform:rotate(180deg)` 变朝上，带 `transition:transform .1s` |
| `lib/client.js` | **面板内下拉选框降高**：触发器 `min-height/height:28px→26px`、字号 14→12px、内边距收紧、箭头 12px；下拉浮层选项同步收窄（`padding:4px 9px;font-size:12.5px`） |
| `lib/client.js` | **关闭按钮改纯图标**：文字「关闭」→ `IconClose` 图形（复用 `Bn`），26×26 圆形按钮，保留 `aria-label` 与 focus-visible 焦点环 |
| `lib/client.js` | **下拉选框底色提亮**：底色改`color-mix(in srgb, bg-layer-2 82%, bg-layer-3)`、边框降到 `border-l1`、文字用 `label-primary`。用 color-mix 而非直接指定 layer-3，是因为 DSH 两套主题里浅色主题的 layer-1/2/3 全是 `bluish-00`（同白），只有深色主题才有色阶差异——叠色才能在两种主题下都提亮 |
| `lib/client.js` | **面板操作按钮缩小**：「恢复默认 / 恢复全部继承 / 放弃修改 / 保存 / 启动 Loop / 取消 Loop / 重新读取」统一压到 `height:22px;padding:0 8px;font-size:11.5px;border-radius:6px`；「放弃/保存」自定义按钮为 `padding:2px 9px;font-size:11.5px`；操作区间距 8→6px |
| `lib/client.js` | **去掉「已自定义」标签**：会话中被覆盖的字段旁不再显示 `overrideBadge` 文字（布尔字段与内联字段两处渲染节点均已移除），但**保留「恢复默认」按钮**（仍可一键恢复跟随全局）。原 `.pua-override small` 死 CSS 换成按钮的低调描边样式。i18n 字典里的 `overrideBadge` 文案保留未删（无引用但体积可忽略，删动风险大于收益） |
| `lib/client.js` | **去掉界面语言字段说明**：删除 `descriptions.language` 的中英文案（"auto 跟随宿主界面语言。" / "auto follows the host UI language."）。⚠️ **删对象成员后必须检查是否留下多余逗号**——本次删除在 `descriptions` 里产生 `feedbackFrequency:"...",,integrityGuard:...` 的 `,,` 语法错误，会导致整个 bundle 解析失败白屏，已清理 |
| `lib/client.js` | **去掉单字段「恢复默认」按钮**：每个被自定义的字段旁原本各有一个「恢复默认」，现全部移除（布尔字段与内联字段两处渲染节点），**只保留面板顶部一个「恢复全部继承」**。随之为失效的 `.pua-override` 系列 CSS 全部清理（容器、按钮统一规则中的该选择器、`[data-inline]` 栅格规则）；i18n 里的 `restoreDefault` / `restoreDefaultAria` 文案保留未删（无引用但改动风险大于收益） |
| `lib/remote.js` | 删除 `setSession` 中「全局关闭则禁止开启会话」的校验 |
| `lib/command.js` | 删除 `/pua` 命令的全局闸门；清理随之无用的 `ENABLING` / `enablesPua` |
| `lib/index.js` / `lib/settings.js` / `cordis.patch.yml` | 身份独立化：`export name`、`SETTINGS_NAMESPACE`、`systemPrompt.section` 名、行 id 全部改为 `dsh-pua`，避免与上游共享设置命名空间 |
| 全仓 12 处 | 包名 `@michengai/dsh-pua` → `dsh-pua`（含 `package.json`、`cordis.patch.yml`、前后端 typert package、前端 ModuleLoader id） |

**未改动**：PUA 的系统提示注入逻辑、状态卡片 `visible` 判定、防作弊门、风味/角色机制。

## v0.1.3：界面文案精简 + 标记风格统一 + 面板分区

### 1. 界面文案精简

| 文件 | 改动 |
|------|------|
| `lib/i18n.js` | `languageChoices.auto`：「自动（跟随宿主）」→「自动」；`autoFlavor`：「自动选味」→「自动」。英文侧 `Auto (follow host)` / `Auto` 未动 |
| `lib/client.js` | 同上两处的中文文案（bundle 内联副本）。⚠️ i18n 文案在包里存了**两份**：`lib/i18n.js`（宿主端，`index.js` 导入）和 bundle 内联副本。**改 UI 必须同时改两处**，只改一处界面不变 |

### 2. 旁白标记风格统一

规则：**emoji 前置 + 『文字』**，emoji 取各标记原本自带的那个；口味标注去掉「味」字。

| 旧 | 新 |
|------|------|
| `[🟡 字节味]` | `🟡『字节』` |
| `[🟠 阿里味·验证型]` | `🟠『阿里·验证型』` |
| `[🟤 Netflix]` | `🟤『Netflix』` |
| `[PUA生效 🔥]` | `🔥『PUA生效』` |
| `[PUA 突破 ✨]` | `✨『PUA 突破』` |
| `[妈省心了 ✨]` | `✨『妈省心了』` |
| `[方法论切换 🔄]` | `🔄『方法论切换』` |
| `[方法论路由 🧭]` | `🧭『方法论路由』` |
| `💼 [P8 自检]` | `💼『P8 自检』` |
| `[自动选择：⚫ 百度味 \| 因为：… \| 改用：🟡 字节味/🔴 华为味]` | `🔄『自动选择：百度』因为：… \| 改用：🟡『字节』/🔴『华为』` |

- 「自动选择」标签**保留选中的味道**（去「味」字），`|` 分隔符保留不动
- 覆盖 18 个原版素材文件（`skills/pua/SKILL.md`、`skills/shot/SKILL.md`、`skills/pua-ja/SKILL.md`、各 `references/*`、`agents/*`、`hooks/failure-detector.sh` 等）
- **未改动**：`skills/pua-en/SKILL.md`（英文协议模式）；markdown 链接、代码块；机器可读 ID（`[HW-REPORT]` / `[PIP-REPORT]` / `[PUA-REPORT]` / `[PUA-DIAGNOSIS]` / `[PUA-CHECKPOINT]` / `[P9-调控]`）
- ⚠️ **原版素材受 SHA-256 强校验**：`SourceCatalog` 构造器逐条比对 `upstream.json` 的 `sha256`，不匹配直接抛错、**整个 PUA 插件不可用**。改任何 `assets/pua/upstream/**` 文件后**必须**重算并写回该字段。`gitBlobSha256` 运行时不校验，保留原值

```bash
# 改完素材必跑，输出 mismatches: 0 才算通过
cd assets/pua && python3 -c "
import json,hashlib
d=json.load(open('upstream.json'))
bad=[e['file'] for e in d['files'] if hashlib.sha256(open(e['file'],'rb').read()).hexdigest()!=e['sha256']]
print('mismatches:',len(bad),bad)"
```

- ⚠️ `hooks/failure-detector.sh` 被 `hook-content.js` 用正则解析，改标记**文字**安全，但**不得动块结构**：`EOF_ROUTING` 恰好 4 个、`EOF_OUTPUT` 4 个、`EOF_GATE` 1 个、`FLAVOR_CONTEXT="…"` 恰好 2 条；**不得新增 `${变量}`**（`interpolate()` 遇未知变量直接抛错）

| 文件 | 改动 |
|------|------|
| `lib/runtime.js` | 反馈计数正则加入 `自动选择\|自動選択` 分支（新格式不再含 `\[Auto-select:`）。`PUA生效` 分支保留即可命中 `🔥『PUA生效』` |
| `assets/.../hooks/stop-feedback.sh` | 同上 jq 正则同步 |

### 3. 配置面板分区重排

扁平字段列表 → 「基础 / 风味与角色 / 提醒与验收」三段，最后一组收进 `<details>` 默认收起。

| 文件 | 改动 |
|------|------|
| `lib/client.js` | 顶部常量 `wp=[…]` 改为 `puaSect=[{t,k},…]` 三分组；渲染处 `wp.map(...)` + 单个 `<details>` 改为按分区循环；新增 `.pua-section` / `.pua-section-first` / `.pua-section-title` / `.pua-section-body` CSS，字段分隔线收窄到 `.pua-section .pua-field+.pua-field` 作用域 |
| `lib/i18n.js` | `panel.sections` 新增中英文分区标题（基础 / 风味与角色 / 提醒与验收） |

- **字段集合与 `CONFIG_KEYS` 完全一致**（14 项，无增删），只改呈现顺序；`configSchema` / `CONFIG_DEFAULTS` 未动
- 分区样式全部走宿主 `--dsw-alias-*` 主题 token，无硬编码色值
- ⚠️ 编辑压缩 bundle 时注意：CSS 变量是 `--dsw-alias-*`（**w**），不是 `--dsh-alias-*`；新增标识符须先确认全局未被占用（本次 `wg` 与 zod 内部函数冲突，改用 `puaSect`）
- 同步 `lib/activity-card.js`（`SECTION_CSS` 常量）与 `client.js.map` / `i18n.js.map` 中的 TS 源码，防止源码与产物漂移


## 踩坑记录：为什么必须删掉 `ce||e(!1)`

原始回调是 `ce=>{a(ce),ce||e(!1)}`，其中 `ce` 是**全局 `enabled`**。

第一版只改了前半截 `a(ce)` → `a(!0)`，留下后半截 `ce||e(!1)`，导致：

1. 用户点开弹窗 → `o=true` → `showModal()`
2. 250ms 轮询 `getGlobal()` 返回 `enabled:false`（因为 `alwaysOn:false`）
3. `ce||e(!1)` → `false || e(!1)` → `o=false`
4. `o=false` → portal 里的 `<dialog>` 被卸载 → **弹窗一闪而过**

上游原本 `a(ce)` 让按钮压根不渲染，`e(!1)` 永远触发不到，所以没暴露这个问题。**解除渲染门后，这半截就成了误伤。**

正确改法：`ce=>{a(!0)}` —— 渲染只依赖「配置是否加载成功」，关闭弹窗交给用户主动操作（点关闭/遮罩/Esc）。

> 教训：解除一处门禁时，必须连带检查该表达式里**依赖同一状态的其他分支**，不能只改自己看到的那一半。

## 安装到 DSH profile

### 方式一：从 npm 安装（推荐）

```bash
dsh plugin --profile <你的profile> add @panando/dsh-pua
```

或直接在 DSH 侧边栏「插件」→「添加插件」输入 `@panando/dsh-pua`。

插件的 `cordis.patch.yml` 会自动插入两行配置，**通常不需要手改 profile**。

### 方式二：从本地路径安装（开发调试用）

在 profile 的 `package.json` 中：

```json
"@panando/dsh-pua": "file:<本仓库路径>"
```

并在 `dsh.profile.bundles` 数组中加入 `"@panando/dsh-pua"`。

> ⚠️ **注意**：从本地路径开发时，如果之后把 `package.json` 的 `name` 改成 scoped 名（如 `@panando/dsh-pua`），**必须同步更新 profile 里的依赖键名和 bundles 项**，否则 pnpm 会检测到 spec 不一致并**静默卸载**该包。

### 调整默认行为（profile 的 cordis.patch.yml）

插件已随包自带 `cordis.patch.yml`，只要 `@panando/dsh-pua` 在 profile 的 `dsh.profile.bundles` 里，宿主就会**自动插入** `panando-pua-remote` 与 `panando-pua` 两行。

因此 profile 里**只需覆写配置，不要再insert**：

```yaml
- id: panando-pua
  config:
    alwaysOn: false        # 功能默认关闭；入口仍常显
```

> ⚠️ **切勿在 profile 里再手写 `- insert:` 插入同名行。** 包的 bundle patch 已经插过一次，
> 重复插入会让 loader 报 `duplicate loader entry id "panando-pua" (2 rows)`，
> 宿主将**自动回滚并恢复原文件**，导致插件装不上。

> 行 id 用 `panando-pua*` 而非上游的 `michengai-pua`，两个包可并存互不冲突。

安装后**必须重启 DSH**（或重载 profile），仅刷新浏览器无效。

## 使用

- 聊天输入栏右侧常显 **PUA** 入口：点击展开下拉菜单，含**打开 PUA / 关闭 PUA / 选项**三项
- 「打开」「关闭」直接作用于**当前会话**，无需进面板保存；已开启时「打开」置灰
- 「选项」打开配置面板，可调整风味、角色、子代理策略与 Loop 参数
- 会话关闭时入口文字变淡并显示横线；全局默认关闭不影响入口显示
- `/pua on` / `/pua off` 同样仅作用于当前会话，不改全局默认

## 回滚

删掉 profile 里 `dsh-pua` 的两行 patch 与 `package.json` 依赖，重启 DSH 即可；原插件不受影响。

## 重新同步上游（如需）

本目录已与上游 0.3.22 脱钩。若要取上游新版本后重新打补丁，参照本 README 的「改了什么」表在新版本上重做三处改动并改包名。

## 已知限制

- `lib/*.js` 是上游已构建产物（压缩），无 `src/`。改动为定点文本替换，若上游重构相关代码需重新定位。
- `.js.map` 源映射未同步更新（仅影响调试器映射，不影响运行）。