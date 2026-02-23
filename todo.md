# Litch's Check - Project TODO

- [x] Database schema: checkins table (date, taskId, completed, note)
- [x] Shared constants: 5 fixed task types with colors
- [x] Backend API: CRUD for daily check-ins (get by date, toggle, update note)
- [x] Backend API: Monthly summary (for calendar view)
- [x] Backend API: Streak calculation (consecutive days with ≥3 completions)
- [x] Frontend: Global Memphis-style theme (peach bg, geometric shapes, bold fonts)
- [x] Frontend: Daily check-in page with 5 task cards
- [x] Frontend: Task toggle + inline note editing with auto-save
- [x] Frontend: Real-time reward display (💫 for ≥3, 🪷 for 5)
- [x] Frontend: Monthly calendar view with day markers
- [x] Frontend: Streak counter display on calendar page
- [x] Frontend: Day detail modal (click calendar day → show tasks + notes)
- [x] Frontend: Responsive design for mobile browsers
- [x] Vitest tests for backend API procedures

## v1.1 Changes

- [x] Remove progress bar, show achievement banner only when ≥3 tasks completed
- [x] Achievement icons: ≥3 → cat image, 5 → cat with lotus (placeholder emoji for now)
- [x] Hand-drawn style icons for all tasks
- [x] Calendar detail: support editing task notes
- [x] Calendar detail: support deleting task notes
- [x] Daily free-form log/diary area (independent from task notes)
- [x] Mascot cat element placeholder in UI (pending image, waiting for user)

## v1.2 Cat Mascot Integration

- [x] Upload 4 cat images to S3 CDN
- [x] Integrate cat_normal.png as default mascot on check-in page
- [x] Integrate cat_lazy.png for 0 or <3 completions
- [x] Integrate cat_encourage.png for ≥3 completions (replace star emoji)
- [x] Integrate cat_perfect.png for 5 completions (replace lotus emoji)
- [x] Cat as UI focal point with smooth transitions between states
- [x] Update calendar view icons to use cat theme

## v1.3 Beta Final

- [x] Cat dialogue bubble system with sassy/cute messages
- [x] Random message selection based on completion state (0, 1-2, ≥3, 5)
- [x] Streak-based bonus messages (3d, 7d, 14d, 30d)
- [x] Speech bubble UI component next to cat mascot
- [x] Weekly/monthly stats chart on calendar page
- [x] Prepare icon replacement interface for hand-drawn icons (pending assets)

## v1.4 Final Release - Hand-drawn Icons

- [x] Upload 5 hand-drawn task icons to S3 CDN
- [x] Replace iconUrl in shared/tasks.ts with CDN URLs
- [x] Verify icons display correctly on check-in page and calendar detail

## v2.0 周报结算系统

- [x] 后端：getWeeklyReview(weekStart) 查询指定周的结算数据（星星天数、大圆满天数、5分类完成情况）
- [x] 后端：getWeeklyReviews() 获取所有历史周报列表
- [x] 后端：tRPC API 端点 weeklyReview.get 和 weeklyReview.list
- [x] 后端：胖黑猫评语生成逻辑（根据本周表现动态选择贱萌评语）
- [x] 前端：周报结算卡片组件（孟菲斯风格，含星星/大圆满/分类完成率/猫评语）
- [x] 前端：历史周报列表页面（/weekly-reviews）
- [x] 前端：底部导航栏增加"周报"入口
- [x] 前端：周一弹窗提醒查看上周周报
- [x] 前端：本周"待结算"状态显示
- [x] 前端：modern-screenshot 导出结算卡片为图片
- [x] Vitest 测试：周报结算后端逻辑
- [x] 更新 HANDOVER_CHECK.md 交接文档
- [x] 推送代码到 GitHub

## v2.1 每日详情弹窗导出图片

- [x] 在 DayDetailDialog 弹窗中添加"导出图片"按鈕
- [x] 创建可导出的每日结算卡片内容区域（含日期、猫猫、完成情况、任务列表、今日随笔）
- [x] 使用 modern-screenshot domToBlob 导出为 PNG
- [x] 推送代码到 GitHub
