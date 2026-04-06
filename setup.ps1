Write-Host "開始自動化設定 GitHub 與 Vercel..." -ForegroundColor Green

# 1. 初始化 Git
Write-Host "初始化 Git 並進行首次 Commit..." -ForegroundColor Cyan
git init
git add .
git commit -m "Initial commit"

# 2. 建立 GitHub Repository 並推送
Write-Host "在 GitHub 上建立 Repo 並推送程式碼..." -ForegroundColor Cyan
# 如果你想設為私有專案，請將 --public 改為 --private
gh repo create antigravity --public --source=. --remote=origin --push

# 3. 連結並部署到 Vercel
Write-Host "連結 Vercel 專案..." -ForegroundColor Cyan
vercel link --yes

Write-Host "開始部署到 Vercel 正式環境..." -ForegroundColor Cyan
vercel deploy --prod --yes

Write-Host "========================================" -ForegroundColor Green
Write-Host "自動化設定完成！你的專案已上線。" -ForegroundColor Green
Write-Host "未來若有更新，只需執行: npm run deploy" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green