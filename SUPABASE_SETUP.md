# Supabase 设置说明

## 项目

Supabase 项目用于 Seat Happens 的认证、数据库和 RLS。

前端使用 publishable/anon key 是正常的；不要把 `service_role` secret 写进本项目或上传到 GitHub。

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

## SQL 文件

按顺序执行：

1. `sql/supabase_schema.sql`
2. `sql/supabase_room_mvp_migration.sql`
3. `sql/supabase_room_edit_lock_migration.sql`
4. `sql/supabase_room_arrival_updates_migration.sql`
5. `sql/supabase_room_cancel_timing_migration.sql`

如果未来新增字段或表，新建迁移文件，不直接覆盖旧 SQL，方便回看版本。

## 管理员

管理员账号由用户自己创建和保存密码。

项目文档只记录管理员用户名，不记录密码：

- 管理员用户名：`Fleeeezing`

## 安全规则

- RLS 必须保持开启。
- 用户只能编辑自己的资料、任务完成状态、自己的加入记录和自己创建的部分计划。
- 管理员可以读取反馈和管理课程任务。
- 普通 Captain 在计划开始前 12 小时内不能修改核心字段。
