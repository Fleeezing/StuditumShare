# TODO

## 下一步优先做

- 检查 `study_group_supabase.html` 与 `public/index.html` 是否完全同步。
- 把当前版本号显示在页面合适位置。
- 优化新用户说明：只在新注册首次进入时出现一次，平时改为简洁帮助链接。
- 去掉注册表单里的管理员邀请码字段。
- 加入 StudiTUM 主校区地址、Google Maps 链接和照片链接，放在右侧信息区。
- 继续完善房间共享页面，让用户一眼看到未来 7 天可加入房间。
- Captain 修改计划时，确保开始前 12 小时内不能修改核心信息。

## 房间系统后续

- 现场确认真实房间编号。
- 标记不能使用的房间。
- 统计每个房间插座数量。
- 统计桌型、容量、是否适合讨论。
- 给 Captain 增加称号或徽章，例如第一次守约、连续到达、早起 Captain。
- 增加 Captain 可信度说明，避免用户误解。

## 数据库

- 确认 `sql/supabase_room_mvp_migration.sql` 是否已在 Supabase 执行。
- 确认 `sql/supabase_room_edit_lock_migration.sql` 是否已在 Supabase 执行。
- 在 Supabase SQL Editor 执行 `sql/supabase_one_captain_plan_per_day_migration.sql`，启用同一 Seat Captain 每天只能有一个未取消计划的数据库约束。
- 把 GitHub 仓库 secrets 里的 `SUPABASE_ACCESS_TOKEN` / `SUPABASE_DB_PASSWORD` / `SUPABASE_PROJECT_ID` 配好。
- 第一次运行 `Deploy Supabase Database` workflow 时，记得开启 `bootstrap_existing_remote`。
- 如果新增版本号、新用户说明状态、Captain 成就，需要新增迁移 SQL。

## 部署

- 修改主应用后，运行 `scripts/sync-pages.ps1` 同步到 `public/index.html`。
- GitHub Pages 改为 GitHub Actions 自动部署 `public/`。
- 当前线上地址：`https://fleeezing.github.io/StuditumShare/`
