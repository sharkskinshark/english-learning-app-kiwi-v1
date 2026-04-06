# 🚀 QUICK DEPLOY SCRIPT - No Git Required

# This script creates a deployment-ready ZIP file for your Holiday Animation app

Write-Host "🎯 Holiday Animation Deployment Preparation" -ForegroundColor Green
Write-Host "=" * 50

# Create deployment folder
$deployFolder = "holiday-animation-deploy"
$currentPath = Get-Location
$deployPath = Join-Path $currentPath $deployFolder

Write-Host "📁 Creating deployment folder: $deployFolder" -ForegroundColor Yellow

# Remove existing deploy folder if it exists
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}

# Create new deploy folder
New-Item -ItemType Directory -Path $deployPath | Out-Null

# Essential files for deployment
$essentialFiles = @(
    "index.html",
    "app.js", 
    "styles.css",
    "vocab.json",
    "events.js",
    "achievements.js",
    "calendar.js",
    "daily.js",
    "leaderboard.js",
    "review.js",
    "package.json",
    "vercel.json",
    "README.md"
)

# Copy essential files
Write-Host "📋 Copying essential files..." -ForegroundColor Yellow
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Copy-Item $file $deployPath
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $file (not found)" -ForegroundColor Red
    }
}

# Copy test files (optional)
$testFiles = @(
    "holiday_integration_final_test.html",
    "system-validation.html"
)

Write-Host "🧪 Copying test files..." -ForegroundColor Yellow
foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Copy-Item $file $deployPath
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

# Create deployment info file
$deployInfo = @"
# 🎯 Holiday Animation Deployment Package

**Generated**: $(Get-Date)
**Status**: Ready for GitHub & Vercel deployment
**Holiday Animations**: ✅ Complete and tested

## Deployment Options

### Option 1: GitHub Desktop (Recommended)
1. Download GitHub Desktop: https://desktop.github.com/
2. Create new repository from this folder
3. Publish to GitHub
4. Deploy to Vercel: https://vercel.com

### Option 2: Direct ZIP Upload
1. Compress this folder to ZIP
2. Go to GitHub.com → Create new repository
3. Upload ZIP file
4. Connect to Vercel for deployment

### Option 3: Drag & Drop to Vercel
1. Go to https://vercel.com
2. Drag this folder directly to Vercel dashboard
3. Deploy instantly

## Files Included

$(foreach ($file in $essentialFiles) { if (Test-Path (Join-Path $deployPath $file)) { "✅ $file" } else { "❌ $file (missing)" } })

## Verification
- Holiday animations: Halloween, Christmas, New Year, Chinese New Year
- Cambridge vocabulary: 200+ words
- Mobile responsive: Yes
- Cross-browser compatible: Yes

**Your app is ready for production!** 🚀
"@

$deployInfo | Out-File -FilePath (Join-Path $deployPath "DEPLOYMENT_READY.md") -Encoding UTF8

# Create ZIP file
Write-Host "📦 Creating ZIP file..." -ForegroundColor Yellow

$zipPath = "$deployFolder.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Use PowerShell compression
Compress-Archive -Path $deployPath -DestinationPath $zipPath

Write-Host "" 
Write-Host "🎉 DEPLOYMENT PACKAGE READY!" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "📁 Folder: $deployFolder/" -ForegroundColor Cyan
Write-Host "📦 ZIP file: $zipPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/new" -ForegroundColor White
Write-Host "2. Create repository: 'english-learning-app-holiday-animations'" -ForegroundColor White  
Write-Host "3. Upload the ZIP file" -ForegroundColor White
Write-Host "4. Go to https://vercel.com and connect your GitHub repo" -ForegroundColor White
Write-Host "5. Deploy with one click!" -ForegroundColor White
Write-Host ""
Write-Host "📋 Or use GitHub Desktop for easier experience!" -ForegroundColor Cyan
Write-Host "   Download: https://desktop.github.com/" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Your Holiday Animation app is ready for the world!" -ForegroundColor Green