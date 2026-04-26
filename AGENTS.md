# Seat Happens 项目协作说明

当用户说“开始做 Seat Happens 项目”时，先读取并遵守这些文件：

1. `PROJECT_HANDOFF.md`
2. `TODO.md`
3. `CHANGELOG.md`
4. `DECISIONS.md`
5. `SUPABASE_SETUP.md`
6. `FLOORPLAN_NOTES.md`

## 工作方式

- 默认用中文和用户沟通。
- 先读现有代码和文档，再改文件。
- 主要应用文件是 `study_group_supabase.html`。
- GitHub Pages 部署文件是 `public/index.html`，每次发布前要从主应用同步。
- SQL 文件在 `sql/` 下；不要把 Supabase `service_role` 或其他 secret 写进仓库。
- 版本归档放在 `versions/`，每个可用版本保留一份 HTML。
- 平面图和现场标注文件放在 `floorplans/`。

## 当前产品重点

Seat Happens 是给 TUM 中国学生使用的 StudiTUM 自习室协作网页。当前优先级是房间共享和座位加入流程，不是课程任务库。

不要把功能描述成官方预约系统。推荐用“房间共享”“软预约”“加入自习计划”“Captain 到达后确认房间”等说法。

## 新任务启动流程

1. 读取交接文档和待办。
2. 检查当前文件状态。
3. 如果是功能开发，先改 `study_group_supabase.html`，再同步到 `public/index.html`。
4. 如果涉及数据库，新增或修改 `sql/` 里的迁移文件，并告诉用户需要在 Supabase SQL Editor 执行。
5. 更新 `CHANGELOG.md` 和必要的版本归档。

