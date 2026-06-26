# 极简数独 (Sudoku Minimalist) 开发与迭代日志

本文件用于记录项目的核心开发目的、迭代规划、避坑指南以及后续在开发过程中遇到的 Bug 和错误修正。

---

## 一、 项目定位与核心目的

本项目的终极目标是打造一款**高品质、极致视觉动效的数独移动应用**，并最终**在 iOS App Store 上架**。

### 核心设计原则
1. **iOS 上架导向**：
   - 所有的 UI 设计、手势操作、资源加载与本地存储逻辑，必须以适配 iOS 原生生态（通过 Capacitor 或 Cordova 进行混编移植）为标准。
   - 杜绝使用仅在特定 PC 浏览器支持的非标准 API，确保完美的跨端表现与离线可用性。
2. **极致动效 (WOW Factor)**：
   - 借助于 [motion](https://motion.dev/) 以及 CSS 动画，为数字填入、关卡切换、消除、胜利结算以及个人成就解锁等环节打磨丝滑且令人惊艳的微动效。
3. **玩法多元化**：
   - 在标准 9x9 数独的基础上，逐步迭代并支持更多趣味数独变种（如**对角线数独**、**杀手数独**等）。

---

## 二、 现有项目结构速览

在后续的迭代中，请参考以下文件的现有职责划分，避免重复造轮子：

*   **入口与布局容器**：
    *   [App.tsx](file:///z:/Shun/APP/sudoku/src/App.tsx)：主程序入口，承载了 iPhone 15 的物理外壳模拟以及各主要屏幕组件的切换调度。
    *   [types.ts](file:///z:/Shun/APP/sudoku/src/types.ts)：全局数据类型定义文件（包括 Cell、Profile、Stats、Difficulty、GameSettings 等）。
*   **游戏核心页面**：
    *   [MenuScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/MenuScreen.tsx)：游戏主菜单，包含连胜进度条展示与“新游戏/恢复游戏”调度。
    *   [DifficultySettingsScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/DifficultySettingsScreen.tsx)：难度与游戏规则配置项界面。
    *   [GameplayScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/GameplayScreen.tsx)：数独核心游玩网格，包含计时器、数字键盘、Undo/Erase/Notes/Hint 核心工具栏以及胜利/失败 Modal。
    *   [DailyChallengeScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/DailyChallengeScreen.tsx)：每日打卡日历视图。
    *   [StatsScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/StatsScreen.tsx)：Bento 风格的个人战绩统计页（包含周活跃与月均解题时间折线图）。
    *   [ProfileScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/ProfileScreen.tsx)：用户资料管理、头像更换与成就系统。
*   **逻辑与工具**：
    *   [sudoku.ts](file:///z:/Shun/APP/sudoku/src/utils/sudoku.ts)：数独生成与求解回溯算法。
    *   [audio.ts](file:///z:/Shun/APP/sudoku/src/utils/audio.ts)：本地音频播放控制器。
    *   [storage.ts](file:///z:/Shun/APP/sudoku/src/utils/storage.ts)：安全可靠的 LocalStorage 存取抽象，防止读取异常导致整个 App 崩溃。

---

## 三、 后续迭代线路图 (Roadmap)

### 阶段 1：UI 界面与极致动效迭代（首要任务）
*   [ ] **界面优化**：
    *   进一步微调 iPhone 15 外壳容器，使其在不同尺寸的 PC / 移动端设备上均能实现完美的自适应等比例缩放（防止小屏幕下局部内容溢出）。
    *   为数独键盘、侧边工具栏在不同移动端视口下的单手操作体验（触控区域、按键间距）做精细化排版优化。
*   [ ] **打磨极致动效**：
    *   在数字正确填入时，为该单元格增加微小的缩放反弹与缩放光效反馈。
    *   在数字冲突错误时，为对应的单元格或生命值图标增加轻微的震动（Shake）特效。
    *   在数独成功解出时，为胜利 Modal 添加华丽的粒子发射（Confetti）特效与荣誉徽章弹窗动画。
    *   利用 [motion](https://motion.dev/) 对各大 Screen 的切换实现平滑的淡入淡出/位移过渡动画。

### 阶段 2：数独多维度生成与难度研究（首要任务）
*   [ ] **难度生成合理性优化**：
    *   分析当前的按单元格空缺数量（43/50/56/62）划分难度的做法。引入结构性评估（例如，仅用空格数不足以体现难度，还需要根据所需解题逻辑的复杂程度，如唯一余数法、区块排除法等来对数独盘面进行打分评级）。
    *   优化数独表的创建与初始化过程，保证极高难度（Expert 级）的生成速度，避免因回溯次数过多导致低端 iOS 设备出现短暂黑屏或卡顿。
*   [ ] **唯一解校验效率提升**：
    *   评估 `solveSudoku` 算法在大规模生成时的效率，确保生成出的谜题在被挖空后依然有且仅有唯一解。

### 阶段 3：数独变种玩法拓展
*   [ ] **对角线数独 (Diagonal Sudoku)**：
    *   加入额外规则：大对角线（主对角线和副对角线）上的 9 个数字也必须包含 1-9 且不重复。
    *   修改回溯生成算法，支持对角线约束。
    *   修改 UI 渲染逻辑，在棋盘的对角线上绘制半透明辅助线条，标识出对角线区域。
*   [ ] **杀手数独 (Killer Sudoku)**：
    *   引入“虚线笼 (Cage)”机制，每个虚线笼内的数字不能重复，且这些数字之和必须等于笼角标示的数字。
    *   升级回溯生成与校验算法。
    *   重构网格渲染，利用不同的虚线框和背景色区分各个笼区域。

### 阶段 4：iOS 原生上架准备
*   [ ] **移动端手势与响应**：
    *   引入双击、长按等手势。
    *   完全移除默认的双击放大和触控延迟（通过 CSS 属性 `-ms-touch-action`、`touch-action` 优化）。
*   [ ] **移植打包测试**：
    *   使用 Capacitor 初始化原生 iOS 项目工程。
    *   测试 iOS 的 WebKit 容器对音频 (`audio.ts`) 播放的支持，处理自动播放限制。
    *   确保本地存档数据在 iOS 系统更新或内存清理时不会被随意抹除（探索改用更稳定的 Native Key-Value 存储）。

---

## 四、 错误修正与踩坑记录 (Bug Fix & Pitfalls Log)

*(注：在后续的迭代开发中，一旦发现并解决任何 Bug，必须在此处及时进行追加，以便日后追溯。)*

| 日期 | 问题描述 | 产生原因 | 修正方案 | 避坑经验总结 |
| :--- | :--- | :--- | :--- | :--- |
| 2026-06-23 | 移除 AI 依赖导致的文件残留 | 原先项目包含 `@google/genai` 并有多处相关指示，增加了认知负荷且与当前专注单机及 iOS 上架的目标不符 | 移除 [package.json](file:///z:/Shun/APP/sudoku/package.json) 中该依赖，重写 [README.md](file:///z:/Shun/APP/sudoku/README.md) 并清理了 [.env.example](file:///z:/Shun/APP/sudoku/.env.example) | 在开发初期明确不做 AI 关联时，必须第一时间做深度代码库清理，防止后期多处残留造成编译和发布阻碍 |
| 2026-06-23 | 移除 iOS 15 物理仿真外壳 | 物理仿真外壳限制了游戏的分辨视口，阻碍了后续直接上架 iOS App Store 的跨端部署 | 移除了 [App.tsx](file:///z:/Shun/APP/sudoku/src/App.tsx) 中所有的 iPhone 15 外壳、按键模拟、Dynamic Island、Status Bar 与 Home Indicator，使用自适应 Flex/Grid 排版 | 为 iOS 混编上架准备的游戏应用应该在 Web 视口层做到全自适应，而不应该嵌套固定的设备模型外壳 |
| 2026-06-23 | 误信文字版 DESIGN.md 偏离真实设计 | 由于 UI 文件夹原有的文字版 `DESIGN.md` 中写错了关于“0px 纯直角”和“克莱因蓝 #002FA7” the 描述，导致重构出的页面偏离了截图设计图的原有样式 | 删除旧的文字版 `DESIGN.md` 文档，以 `code.html` 和图片截图为唯一标准重回圆角皇家蓝路线 | 开发时如果文档和代码/设计图截图不一致，必须第一时间与用户或设计稿直接校验，不可盲目信从文字版文档描述 |
| 2026-06-23 | 重构响应式分栏架构与 Bento 页面对齐 | 原代码缺失桌面端（md:及以上）的侧边导航栏，导致大屏下页面被极度横向拉伸；Bento Grid 和图表高度不够，偏离了 statistics 设计图的高端视界 | 1. 在 [App.tsx](file:///z:/Shun/APP/sudoku/src/App.tsx) 中增加 aside 固定侧栏，利用 md:pl-80 和 md:hidden 对头部、底部和主画布进行响应式双端适配；2. 全面重构 [StatsScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/StatsScreen.tsx) 的 Bento 网格与折线图尺寸；3. 将 [DifficultySettingsScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/DifficultySettingsScreen.tsx) 优化为 md 下 4 列自适应展开 | 混合应用在适配大屏时，应使用 aside + pl-X 的模式空出侧栏，而非单纯对整个 App 采用 max-w-sm 限制。这极大地保证了桌面端的优雅排版与移动端原生 Webview 的高度自适应 |
| 2026-06-23 | 全面接入 motion 极致微动效与 Confetti 胜利特效 | 原有页面切换和填数等交互缺乏心流反馈，无法呈现出 Wow 级别的精致感，容易引起智力游戏高频交互时的单调感 | 1. 引入 `motion/react` 作为 React 19 动画基础；2. 将 Menu, Settings, Stats, Profile, Daily 等 Screen 根节点全部改为 motion.div 渐显转场；3. 网格数字填入时绑定 key 触发 0.25s 缩放弹反，数字填错时单元格触发 shake 物理抖动；4. 连带 Mistakes 出错时红闪膨胀；5. 胜利弹窗加入随机发射、旋转下坠并逐渐淡出的彩色 Confetti 粒子，奖牌设定 linear 匀速 360 度自转。 | 在 motion React 19 中，利用绑定 state 为 key 的技巧，可以让进入动画在其数据更新时自动重启，省去了繁杂的 ref 或布尔状态控制，非常契合棋盘类游戏的数字更新和 Mistakes 累加场景 |
| 2026-06-23 | 修复动效触发导致的性能抖动 | 在低端机型上同时触发多个数字的高亮变色和缩放动效，导致主线程阻塞出现丢帧 | 1. 对 `motion` 组件启用 `layoutId` 优化重排；2. 将频繁更新的单元格动效设为 `layout="position"` 以减少 DOM 计算开销；3. 对 Confetti 粒子容器添加 `will-change: transform`。 | 移动端性能有限，在做高频动效时应配合 `will-change` 和 `layout` 属性提前优化渲染路径，避免触发昂贵的重排（reflow） |
| 2026-06-23 | 解决 UI 间距坍塌与 Toggle/Bento 挤压变形 | 1. index.css 中缺少 Tailwind v4 的 spacing 映射导致所有自定义间距（如 p-stack-md）失效；2. Toggle 按钮无 shrink-0 被挤压且白球移出背景；3. Bento 卡片受 h-48 与 aspect-square 冲突在移动端缩窄 | 1. 在 [index.css](file:///z:/Shun/APP/sudoku/src/index.css) 的 @theme 块中注册了完整的 `--spacing-*` 与 `--border-width-*` 映射；2. 对 Toggle button 加上 `shrink-0` 防止宽度被拉伸；3. 移除了 [StatsScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/StatsScreen.tsx) Bento 卡片上的 `h-48`。 | Tailwind v4 对自定义变量有高度敏感的类型要求，非默认数值类必须在 @theme 里通过 CSS 变量精确声明；flex 容器中的尺寸固定组件要设置 shrink-0 以防止宽度被压缩导致子级偏离。 |
| *待记录* | *待记录* | *待记录* | *待记录* | *待记录* |

---

## 五、 开发避坑指南 (Best Practices to Avoid Detours)

为确保项目后续顺利上架 iOS 并保持卓越的性能，开发过程中应坚决贯彻以下规范：

1. **移动端触控友好与响应速度**：
   - 所有可点击组件必须保证最小触控热区为 `44px * 44px`。
   - 所有需要高频点击的网格 and 按钮（如数独键盘），应使用 `select-none` 样式，避免在快速点击时意外触发浏览器的文本选取或放大操作。

2. **状态更新性能控制**：
   - 棋盘状态在 [GameplayScreen.tsx](file:///z:/Shun/APP/sudoku/src/components/GameplayScreen.tsx) 中频繁变化。填数时，确保只更新和重绘发生变化或处于关联高亮范围内的单元格，避免每一次填数都导致整个 9x9 大网格及内部所有小笔记格子做昂贵的完整 DOM 重构。
   - 对于周活跃统计等静态渲染内容，使用 `useMemo` 进行包裹，避免其在 Gameplay 倒计时中无意义地频繁重渲染。

3. **iOS 原生兼容性规范**：
   - 尽量使用符合标准规范的 CSS / Flex / Grid 布局，避免使用实验性质或私有的 CSS 属性。
   - iOS 内置的 Safari WebKit 对音频自动播放有严格的限制，必须在**用户交互发生后**（例如点击开始按钮或点击格子）由用户事件流来初次解锁音频上下文对象，否则会导致音频无声或报错崩溃。

4. **数据持久化的安全边界**：
   - LocalStorage 在 iOS 存储空间严重不足时，有可能会被系统清理掉。后续若有重要玩家数据存档，应考虑使用 Capacitor 的本地文件系统存储插件（Capacitor Preferences/Storage）替代单纯的 H5 Web Storage。
