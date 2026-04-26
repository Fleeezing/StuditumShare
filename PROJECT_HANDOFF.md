# Seat Happens 项目交接

更新时间：2026-04-22

## 项目目标

Seat Happens 是一个给 TUM 中国学生使用的轻量网页，用来解决 StudiTUM 主校区期末自习室紧张、单人占大房间浪费、约人自习麻烦的问题。

核心思路：

- 有人愿意早起去 StudiTUM 抢房间，成为 Captain。
- Captain 发布自习计划，说明日期、时间、预计房型、主题、是否可讨论、可加入人数。
- 其他用户在网页上看到未来一周可加入的房间，报名加入。
- Captain 到达后确认房间和可用座位。
- 用户可以查看 Captain 的可信度、历史记录和房间信息。

这不是官方预约系统，措辞上应保持为“共享”“计划”“加入”“到达确认”。

## 当前状态

已有一个 Supabase 前端单页应用：

- 文件：`study_group_supabase.html`
- 部署入口：`public/index.html`
- 当前线上地址：`https://fleeezing.github.io/StuditumShare/`
- 当前版本归档：`versions/seat-happens-v0.2.5.html`
- 当前仓库已准备 GitHub Actions 自动部署 GitHub Pages
- 当前 Supabase 项目 ref：`egocecoudqerewvurumh`

主要功能已有：

- 用户注册/登录，使用简单用户名、昵称和密码。
- 管理员账号已由用户创建，用户名为 `Fleeeezing`，密码不写入项目文件。
- 房间日历与房间计划。
- Captain 创建自习计划。
- 用户加入/取消/签到。
- Captain 或管理员完成/取消计划。
- Captain 可修改计划，但开始前 12 小时内普通 Captain 不允许修改核心信息。
- 反馈功能：用户可提交，管理员可读。
- 公共聊天广场。
- 课程任务模块保留为低优先级辅助功能。

## 用户和权限

普通用户：

- 选择自己的课程标签。
- 查看每周任务和完成情况。
- 创建自习计划。
- 加入自习计划。
- 在聊天广场发消息。
- 提交反馈。

管理员：

- 管理课程、任务、反馈。
- 可以编辑/取消更多房间计划。
- 可以查看管理员区域。

## 当前设计方向

最重要的用户路径：

1. 打开网页。
2. 看一周内有哪些房间计划。
3. 点进某一天，看到 Captain、可信度、主题、时间、剩余座位。
4. 报名加入。
5. 到场后签到。

界面应该简洁、直观，重点放在可加入房间和 Captain 信任感，不要做成复杂课程管理系统。

## 文件结构

- `study_group_supabase.html`：主应用。
- `public/index.html`：GitHub Pages 部署文件，由 `scripts/sync-pages.ps1` 从主应用同步生成。
- `scripts/`：本地同步和发布辅助脚本。
- `.github/workflows/`：GitHub Actions 校验和自动部署流程。
- `sql/`：Supabase SQL 源文件。
- `supabase/`：Supabase CLI 工程目录；`supabase/migrations/` 由 `scripts/sync-supabase-migrations.ps1` 从 `sql/` 生成。
- `docs/`：产品计划和部署说明。
- `floorplans/`：StudiTUM 平面图和标注草图。
- `versions/`：版本归档。
