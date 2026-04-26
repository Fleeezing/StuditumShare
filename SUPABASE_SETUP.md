# Supabase 设置说明

## 项目

Supabase 项目用于 Seat Happens 的认证、数据库和 RLS。

前端使用 publishable/anon key 是正常的；不要把 `service_role` secret 写进本项目或上传到 GitHub。

当前项目 ref：

- `egocecoudqerewvurumh`

## Auth 设置

当前设计：

- 允许用户注册。
- 不使用第三方登录。
- 不要求邮箱确认。
- 前端把用户名转换为内部邮箱格式用于 Supabase Auth。

用户输入：

- 用户名
- 昵称
- 密码

## 目录约定

- `sql/`：人工维护的 SQL 源文件
- `supabase/config.toml`：Supabase CLI 配置
- `supabase/migrations/`：给 Supabase CLI / GitHub Actions 使用的时间戳迁移目录
- `scripts/sync-supabase-migrations.ps1`：把 `sql/` 同步到 `supabase/migrations/`
- `scripts/bootstrap-supabase-history.ps1`：给当前这个“已存在的远端项目”补 migration history

当前生成映射顺序：

1. `sql/supabase_schema.sql` -> `supabase/migrations/20260422000100_initial_schema.sql`
2. `sql/supabase_room_mvp_migration.sql` -> `supabase/migrations/20260422000200_room_mvp.sql`
3. `sql/supabase_room_edit_lock_migration.sql` -> `supabase/migrations/20260422000300_room_edit_lock.sql`
4. `sql/supabase_room_arrival_updates_migration.sql` -> `supabase/migrations/20260426000100_room_arrival_updates.sql`
5. `sql/supabase_room_cancel_timing_migration.sql` -> `supabase/migrations/20260426000200_room_cancel_timing.sql`
6. `sql/supabase_one_captain_plan_per_day_migration.sql` -> `supabase/migrations/20260426000300_one_captain_plan_per_day.sql`
7. `sql/supabase_room_plan_time_guard_migration.sql` -> `supabase/migrations/20260426000400_room_plan_time_guard.sql`

以后新增数据库改动时：

1. 先新增或修改 `sql/` 里的 SQL 文件
2. 运行 `./scripts/sync-supabase-migrations.ps1`
3. 再提交到 git

## 本地 CLI 一次性初始化

当前这台机器还没有 Supabase CLI。按官方流程，本地第一次需要：

1. 安装或通过 `npx` 使用 Supabase CLI
2. 在仓库根目录运行 `supabase login`
3. 运行 `supabase link --project-ref egocecoudqerewvurumh`

因为这个远端项目在接入 CLI 之前就已经存在，所以第一次不要直接 `db push`。先运行一次：

`./scripts/bootstrap-supabase-history.ps1`

这一步会把当前基础迁移标记为“远端已应用”，避免 CLI 重复对现有线上库执行初始建表。

完成后可用下面命令核对：

`supabase migration list --linked`

## 本地开发

如果你装好了 Docker 和 Supabase CLI：

1. `./scripts/sync-supabase-migrations.ps1`
2. `supabase db start`
3. `supabase db reset`

官方文档建议：一旦开始使用 migrations，远端 schema 变更应尽量通过 migration 文件而不是继续直接在线上 Dashboard 里手改。

## GitHub Actions

仓库里现在有两个 Supabase workflow：

- `Check Supabase Migrations`
  - 自动检查 `sql/` 和 `supabase/migrations/` 是否同步
  - 在 GitHub runner 上启动本地 Supabase 并重放迁移
- `Deploy Supabase Database`
  - 手动触发
  - 会把已提交的 `supabase/migrations/` 推到远端项目

GitHub 需要配置这三个 secrets：

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID` = `egocecoudqerewvurumh`

第一次运行 `Deploy Supabase Database` 时，把 `bootstrap_existing_remote` 设为 `true`。后续正常发布时设为 `false`。

## 管理员

管理员账号由用户自己创建和保存密码。

项目文档只记录管理员用户名，不记录密码：

- 管理员用户名：`Fleeeezing`

## 安全规则

- RLS 必须保持开启。
- 用户只能编辑自己的资料、任务完成状态、自己的加入记录和自己创建的部分计划。
- 管理员可以读取反馈和管理课程任务。
- 普通 Captain 在计划开始前 12 小时内不能修改核心字段。
- 不要把 `SUPABASE_ACCESS_TOKEN`、数据库密码或 `service_role` 写进仓库；统一放 GitHub Secrets 或本机凭据存储。
