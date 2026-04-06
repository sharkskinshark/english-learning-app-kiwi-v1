# GitHub to Vercel Maintenance (Strict) - README

## 目的
這份 README 用來記錄嚴格版技能的設計原因與維護資訊，確保在高風險或正式環境部署時，流程可追溯、可驗證、可回滾。

## 建立動機
1. 正式環境更新需要更高安全性，不能只靠口頭流程。
2. 要求每次部署前先確認本地與 GitHub 是否一致且最新。
3. 發生事故時要能快速定位、修復、並保有回滾能力。

## 便利之處
1. 使用 Gate 0/1/2 控制風險，避免跳步操作。
2. 強制產出驗證證據，方便事後追蹤。
3. 對部署錯誤與空白頁回歸有固定排查順序。

## 基本資訊
- 技能檔名稱: SKILL.md
- 本地端儲存路徑: C:\Users\CLUSTER-E6\Documents\AIsCode\VScode\claude-code-integration\English Learning App\skills\github-vercel-deploy-maintenance-strict
- 原始建立日期 (SKILL): 2026-04-06 05:27:08
- 最近更新日期 (SKILL): 2026-04-06
- 建立/維護時 VS Code 版本: 1.114.0

## 這份技能使用到的 Git 指令
1. git fetch origin --prune
2. git status --short --branch
3. git rev-parse --abbrev-ref HEAD
4. git rev-parse HEAD
5. git rev-parse origin/main
6. git rev-list --left-right --count HEAD...origin/main
7. git remote -v
8. git push -u origin main

## SKILL 與 README 連動維護規範
每次修改此資料夾中的 SKILL.md，必須同步更新本 README：
1. 更新「最近更新日期」。
2. 在「更新紀錄」新增一筆變更摘要。
3. 若新增或移除 Git 指令，更新「這份技能使用到的 Git 指令」。
4. 若 Gate 規則有調整，更新「建立動機」與「便利之處」對應描述。
5. 若工具版本變更，更新 VS Code 版本欄位。

## 更新紀錄
- 2026-04-06: 建立 Strict 版 SKILL.md。
- 2026-04-06: 建立本 README.md，加入技能維護紀錄與連動規範。
- 2026-04-06: 更新 SKILL.md，新增 README 同步更新規則（Documentation Sync Rule）。
- 2026-04-06: 更新 SKILL.md，新增 README 同步更新的 PowerShell 指令範例。
- 2026-04-06: 精簡 Strict SKILL.md（保留 Gate 0/1/2、事故處理、回滾與證據清單）。
- 2026-04-06: README 同步規則改為「僅行為變更才更新」，文字微調不強制更新。
