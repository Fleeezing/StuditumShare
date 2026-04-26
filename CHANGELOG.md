# Changelog

## v0.2.3 - 2026-04-26

- 完全移除课程计划/课程任务界面的当前版本入口，房间共享成为唯一主流程。
- 新增 `Captain 快捷操作` 区，Captain 打开页面后可直接填写或更新房间号、开放座位和朋友留位。
- 统一 `study_group_supabase.html` 与 `public/index.html`，修复本地页面与发布页面不一致的问题。
- 去掉注册页里的邮箱/Confirm email 提示文案。
- Captain 到场后的房间信息更新改成页内直接编辑，不再使用连续弹窗；“给朋友留位”改为通过减少“可共享座位”来表达。
- 房间卡上的 `填写房间号` / `修改计划` 现在会跳到上方 Captain 编辑区；计划设置也改成页内保存，不再使用 `prompt()`。
- 移除右侧单独说明列；反馈改名为 `反馈`，并移动到主区域下方；去掉页面中的蓝色说明框。
- 非 Captain 用户现在可以看到 `计划中 / 已到达 / 已取消` 三种状态；开始前 12 小时外取消的计划直接隐藏，12 小时内取消的计划保留并用红色标记不可用。
- `Captain` 对外文案调整为 `Seat Captain`；页面改为更紧凑的单列布局；未到签到时间时不允许 `我已到达`，也不允许提前把房间信息标记为已到场。
- 重新同步 `study_group_supabase.html`、`public/index.html` 和 `versions/seat-happens-v0.2.3.html`；修复发布文件里残留的 `?` 分隔文案，以及 `完成承诺` 后未清晰显示 `已完成` 的问题。
- 新增 `scripts/sync-pages.ps1`、GitHub Actions Pages 自动部署和同步校验 workflow；移除旧 GitLab Pages 配置，统一发布流程为“同步 `public/` 后 push 到 `main` 自动部署”。

## v0.2.2-workspace - 2026-04-22

- 创建长期项目目录 `C:\Users\lin Yang\Documents\Seat-Happens`。
- 复制主应用、部署文件、SQL、版本归档和平面图草稿。
- 新增项目交接文档、决策文档、待办、Supabase 说明和平面图记录。
- 新增 `AGENTS.md`，让后续 Codex 会话能按项目上下文继续工作。
- 更新 `floorplans/studitum_floorplans_annotatable_cn.html`：去掉开门弧线、电梯门箭头和图内“走廊”文字；优化四层房间比例与排版；0 层自助区不占编号并顺延房间/厕所编号；1 层补 1.02 下方小房间，修正 1.03 可用、1.04 为中房间、1.07 和 1.09 无法使用，女厕 1.05、男厕 1.06。
- 新增 `floorplans/studitum_floorplans_four_in_one.html`，单独输出四层平面图，去掉页面说明区。
- 房间共享优先：页面先移除课程任务模块 UI；Captain 到场后可补实际房间号、调整开放座位、给未注册朋友留位；新增 `sql/supabase_room_arrival_updates_migration.sql`；同步 `public/index.html` 与 `versions/seat-happens-v0.2.3.html`。

## v0.2.1 - 2026-04-22

- 房间预约系统成为主功能。
- 删除 Captain 的重复 `标记 active` 逻辑，保留 `我已到达` 语义。
- Captain/管理员可编辑自习计划。
- 普通 Captain 在开始前 12 小时内不能修改核心信息。
- 增加房间计划完成/取消流程。
- 保留课程任务库为低优先级辅助模块。

## v0.2.0 - 2026-04-22

- 增加房间共享 MVP 数据库迁移。
- 加入房间计划、成员加入、签到、Captain Board。
- 明确产品方向为 StudiTUM 房间共享与自习计划。

## v0.1.x - 2026-04-22

- 创建 Supabase 版学习进度网页。
- 增加用户注册登录、课程标签、固定任务、自定义任务、反馈、聊天广场。
- 部署到 GitHub Pages。
