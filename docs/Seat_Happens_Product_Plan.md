# Seat Happens 产品计划书

## 1. 产品定位

**Seat Happens** 是一个面向 TUM 中国学生的小型自习协作工具。

核心问题不是“有没有学习空间”，而是：

- 一个人学习效率低，希望找到一起自习的人。
- 每次约人很麻烦，不知道谁今天想去。
- StudiTUM 期末排队严重，早上很早去也不一定抢得到房间。
- 抢到大房间后 1-2 人使用很浪费。
- 住得远的人出发前不知道是否有位置。
- StudiTUM 官方没有学生之间共享已占房间、剩余座位、ETA 加入、信任记录这类功能。

产品目标：

> 让早到的人更容易组织房间，让晚到的人出发前知道有没有可靠座位，让房间资源被更合理地使用。

## 2. 当前官方功能边界

官方已有：

- IRIS / Lernraum 可以显示学习空间当前占用、官方预约、入口屏幕和房间平板信息。
- StudiTUM 官方页面说明，普通学生不能提前预约房间；提前预约主要面向学生代表、认证学生组织或大型学生活动。
- 官方规则也说明，不允许替朋友预留工作位；离开较久时不能继续占用位置。

因此本产品不应声称“官方预约房间”或“保证座位”。更安全的产品表述是：

- 房间共享
- 加入意向
- Captain 承诺/记录
- 到达后确认座位
- soft reservation，而不是官方 reservation

## 3. 核心模块

### 3.1 房间共享与预约模块

这是主模块。

用户能看到一个七天日历：

- 今天到未来 7 天。
- 每天按时间轴显示房间计划。
- 卡片显示：
  - 时间：例如 Tue 09:00-18:00
  - 房间类型：大教室 / 小自习室 / 中自习室
  - Captain
  - 主题：无主题 / 安静自习 / RD / i2dl / 考前讨论
  - 当前计划人数
  - 剩余座位
  - 插座数量
  - 可信度 / 历史完成记录

用户点击某个房间计划后进入详情页：

- Captain 信息
- 房间类型
- 预计到达时间
- 预计结束时间
- 主题
- 讨论强度：安静 / 可小声讨论 / 讨论型
- 插座数量
- 白板/屏幕/窗户/噪声等可选信息
- 已报名用户
- waiting list
- 到达路线说明

### 3.2 Captain 模块

Captain 是愿意早起并承担组织责任的人。

Captain 可以：

- 提前发布明天/未来几天的自习计划。
- 选择预计房间类型。
- 设置主题或无主题。
- 设置预计到达时间和离开时间。
- 设置预计容量。
- 到现场后确认实际房间。
- 更新实际剩余座位和插座情况。
- 接受/取消用户加入请求。
- 标记用户是否到达。

Captain 不应被设计成“替朋友非法占座”的角色。更合规的逻辑：

- Captain 可以给朋友创建“预期加入名额”。
- 座位在系统里可以显示为 pending / expected。
- 但页面提示：座位只有到达并 check-in 后才算 confirmed。
- 如果用户 ETA 后超过 grace period 还没到，Captain 可以释放位置。
- 系统文案避免“guaranteed seat”，使用 “planned spot / join request / check-in required”。

### 3.3 荣誉与称号模块

先不做复杂积分，先做轻量荣誉记录。

可用称号：

- **Dawn Captain**：第一次在 8:00 前发布并完成房间计划。
- **7:30 Hero**：7:30 前到达并成功开房一次。
- **Room Ranger**：累计成功组织 5 次房间。
- **StudiTUM Anchor**：连续 5 天在 StudiTUM check-in。
- **Promise Keeper**：第一次按计划到达并完成承诺。
- **Outlet Scout**：补充了房间插座数量信息。
- **Table Cartographer**：补充了房间桌型/布局信息。
- **Calm Captain**：组织过 3 次安静自习。
- **Discussion Host**：组织过 3 次讨论型自习。

这些称号用于增加正向反馈，而不是制造强制竞争。

### 3.4 房间数据模块

需要记录房间静态信息：

- campus：StudiTUM Innenstadt / Main Campus
- building：Gabelsbergerstraße 43
- floor
- room label
- room type
- max capacity
- table layout
- outlet count
- USB outlet count
- whiteboard
- screen
- window
- noise level
- notes
- last verified by
- last verified at

根据你的观察，先内置三类：

| 类型 | 描述 | 默认容量 |
| --- | --- | --- |
| 大教室 | 10 张桌子 | 视实际桌型统计 |
| 小自习室 | 1 张桌子 | 最多 4 人 |
| 中自习室 | 2 张长桌或 3 张短桌 | 最多 6 人 |

插座数量非常重要，必须作为一级字段展示，不要藏在详情里。

### 3.5 座位状态模块

一个房间计划下的座位状态：

- open：可加入
- requested：用户申请加入
- expected：Captain 预留/预计此人会来
- confirmed：用户已到达并 check-in
- cancelled：取消
- released：超时释放

建议规则：

- 用户报名时填写 ETA。
- Captain 可接受请求。
- 系统显示预计剩余座位。
- 用户到达后点 check-in。
- 超过 ETA + 15/30 分钟未 check-in，Captain 可释放。

### 3.6 路线指引模块

第一版不要做复杂室内导航。

先提供：

- Google Maps 链接
- TUM NavigaTUM 链接
- 文字路线：例如入口、楼层、楼梯/电梯方向
- 房间附近提示：例如靠近厨房/楼梯/厕所

后续如果做 3D 模型，可以把路线指引升级为：

- 楼层图
- 3D 房间位置
- 从入口到房间的路径

### 3.7 课程与任务模块

课程任务库降级为辅助模块，避免和房间预约混在一起。

保留：

- 课程标签
- 某门课某周共享任务
- 用户加入自己的任务
- 完成勾选

简化：

- 不作为首页主视觉。
- 不做复杂统计。
- 不和座位预约强绑定。

它的定位是：

> 今天来这个房间的人可以顺手看到本周有哪些课业任务。

## 4. 用户页面设计

### 4.1 首页

首页重点不是课程，而是“我什么时候能去哪里自习”。

结构：

1. 顶部：Seat Happens
2. 副标题：Can't get a room? Can't track what's due?
3. 七天日历
4. 今天可加入的房间
5. 我报名的房间
6. 快速发布房间计划

### 4.2 七天日历

每一天显示卡片：

```text
Tue
09:00-18:00
Medium room
4 / 6 planned
2 seats open
8 outlets
Captain: Fleeeezing
Theme: Quiet + RD
```

颜色建议：

- 绿色：有空位
- 黄色：即将满
- 红色：已满 / waiting list
- 灰色：已过期

### 4.3 房间详情

详情页信息优先级：

1. 还有没有座位
2. 什么时候可加入
3. Captain 可信度
4. 房间类型和插座
5. 主题和讨论规则
6. 路线
7. 已加入的人

### 4.4 Captain 发布页

字段：

- 日期
- 预计开始时间
- 预计结束时间
- 预计到达时间
- 房间类型
- 实际房间号，到场后补充
- 主题
- 讨论模式
- 最大人数
- 插座数量，到场后确认
- 备注

## 5. 数据库模块建议

后续 Supabase 表可以按模块拆：

- profiles
- room_catalog
- room_plans
- room_plan_members
- room_plan_events
- captain_stats
- achievements
- user_achievements
- courses
- shared_tasks
- user_tasks
- feedback
- chat_messages

关键表：

### room_plans

- id
- captain_id
- date
- planned_start
- planned_end
- planned_arrival
- campus
- room_type
- actual_room_id
- topic
- discussion_mode
- max_capacity
- outlet_count
- status
- created_at

### room_plan_members

- id
- room_plan_id
- user_id
- status
- eta
- checked_in_at
- cancelled_at
- note

### room_catalog

- id
- campus
- floor
- room_label
- room_type
- max_capacity
- table_layout
- outlet_count
- usb_count
- has_whiteboard
- has_screen
- route_note
- last_verified_by
- last_verified_at

### captain_stats

- user_id
- completed_plans
- cancelled_plans
- early_arrivals
- successful_checkins_hosted
- reliability_score
- current_streak
- longest_streak

## 6. 3D 建模计划

我目前没有找到公开可直接使用的 StudiTUM Innenstadt 详细楼层平面图。

已找到的公开信息：

- NavigaTUM 显示 StudiTUM Innenstadt 建筑编号为 0201，地址 Gabelsbergerstr. 43，含 63 个房间，其中 43 个非走廊等空间。
- 官方 StudiTUM 页面说明 Main Campus StudiTUM 约 500 m²，约 100 个学习位和 20 个 lounge 位。
- 官方页面说明家具配置包括 1.8 m x 0.8 m 桌子，桌子带插座和 USB 插座；部分 group study rooms 有白板或显示器。

3D 模型建议分三阶段：

### 阶段 1：抽象楼层地图

不用真实比例，只画：

- 楼层
- 房间位置
- 房间类型
- 插座数量
- 路线文字

这可以先用 SVG / Canvas 做，不需要 3D。

### 阶段 2：手工测绘简化 3D

你实地统计：

- 每层房间数量
- 房间相对位置
- 门的位置
- 桌子数量
- 插座数量
- 大致长宽

然后用 Three.js 建一个简化模型：

- 楼层盒子
- 房间块
- 桌子/座位/插座点位
- 当前可预约座位高亮

### 阶段 3：精确模型

如果以后能获得官方许可或公开平面图，再做更准确的 3D。

注意：不要直接使用未授权的建筑图纸做公开模型。

## 7. 开发顺序

### MVP 1：房间预约优先

- 七天日历
- Captain 发布房间计划
- 用户加入/取消
- 房间类型、容量、插座数量
- Captain 完成记录
- 管理员删除/修正

### MVP 2：到场确认

- check-in
- ETA
- 迟到释放
- Captain 完成承诺记录
- 基础称号

### MVP 3：房间目录

- 房间静态数据
- 插座统计
- 桌型统计
- 路线文字
- 用户提交修正

### MVP 4：3D / 地图

- 抽象楼层图
- 简化 3D
- 座位热力图
- 路线提示

### MVP 5：课程任务辅助

- 课程标签
- 周任务
- 与房间主题弱关联

## 8. 代码组织建议

后续写代码时按模块分注释：

- Auth
- Room Plans
- Room Members
- Captain Stats
- Achievements
- Room Catalog
- Course Tasks
- Feedback
- Chat
- Admin

前端也按区域分函数：

- renderCalendar()
- renderRoomPlans()
- renderRoomDetail()
- renderCaptainForm()
- renderRoomCatalog()
- renderAchievements()
- renderCourseTasks()

这样后面调整功能时不会混乱。

## 9. 一句话总结

Seat Happens 不应该只是学习进度板，而应该变成：

> 一个让 TUM 中国学生共享 StudiTUM 房间资源、降低早起抢房成本、找到自习伙伴、顺便同步课业任务的小型协作系统。
