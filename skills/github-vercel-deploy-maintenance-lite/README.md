# GitHub to Vercel Maintenance (Lite) - README

## 目的
這份 README 用來記錄此技能的建立原因、使用情境、維護邏輯、版本資訊與變更歷程，讓後續維護者可以快速理解為何存在這份技能，以及如何安全更新。

## 建立動機
1. 日常小改版或修 bug 時，需要一條快速且可重複的本地 -> GitHub -> Vercel 流程。
2. 避免忘記先做 Git 同步檢查，導致分支分叉或覆蓋風險。
3. 讓部署失敗時有一致的快速排查步驟，不必每次重想流程。

## 便利之處
1. 先做 Git 一致性 Gate，降低誤 push 風險。
2. 將日常流程標準化，減少操作時間。
3. 可快速定位部署錯誤，縮短修復時間。

## 基本資訊
- 技能檔名稱: SKILL.md
- 本地端儲存路徑: C:\Users\CLUSTER-E6\Documents\AIsCode\VScode\claude-code-integration\English Learning App\skills\github-vercel-deploy-maintenance-lite
- 原始建立日期 (SKILL): 2026-04-06 05:27:08
- 最近更新日期 (SKILL): 2026-04-06
- 建立/維護時 VS Code 版本: 1.114.0

## 這份技能使用到的 Git 指令
1. git fetch origin --prune
2. git status --short --branch
3. git rev-parse HEAD
4. git rev-parse origin/main
5. git rev-list --left-right --count HEAD...origin/main
6. git remote -v
7. git push -u origin main

## SKILL 與 README 連動維護規範
每次修改此資料夾中的 SKILL.md，必須同步更新本 README：
1. 更新「最近更新日期」。
2. 在「更新紀錄」新增一筆變更摘要。
3. 若新增或移除 Git 指令，更新「這份技能使用到的 Git 指令」。
4. 若工具版本變更，更新 VS Code 版本欄位。

## 更新紀錄
- 2026-04-06: 建立 Lite 版 SKILL.md。
- 2026-04-06: 建立本 README.md，加入技能維護紀錄與連動規範。
- 2026-04-06: 更新 SKILL.md，新增 README 同步更新規則（Documentation Sync Rule）。
- 2026-04-06: 更新 SKILL.md，新增 README 同步更新的 PowerShell 指令範例。
- 2026-04-06: 精簡 Lite SKILL.md（保留 Gate/決策/停止條件，移除冗語與重複段落）。
- 2026-04-06: README 同步規則改為「僅行為變更才更新」，文字微調不強制更新。
