# Seat Happens

面向 TUM 中国学生的 StudiTUM 自习室共享与学习计划网页。

## 快速入口

- 主应用源码：`study_group_supabase.html`
- GitHub Pages 部署文件：`public/index.html`
- 本地同步脚本：`scripts/sync-pages.ps1`
- 项目交接：`PROJECT_HANDOFF.md`
- 下一步：`TODO.md`
- 数据库说明：`SUPABASE_SETUP.md`
- 房间/平面图记录：`FLOORPLAN_NOTES.md`

## 发布流程

日常发布统一为：

1. 修改 `study_group_supabase.html`
2. 运行 `./scripts/sync-pages.ps1`
3. 提交并 push 到 `main`
4. GitHub Actions 自动部署 `public/` 到 GitHub Pages

一次性初始化说明见 `docs/GITHUB_PAGES_DEPLOY.md`。

## 新会话怎么接着做

在 Codex 里打开这个文件夹：

`C:\Users\lin Yang\Documents\Seat-Happens`

然后只说：

> 开始做 Seat Happens 项目

Codex 应先读取 `AGENTS.md` 和交接文档，再继续开发。
