# PR内容テスト用スクリプト
param(
    [string]$BranchName = "claude/issue-14-20250525_194957"
)

Write-Host "🚀 PR内容テスト開始: $BranchName" -ForegroundColor Green

# 1. ブランチ切り替え
Write-Host "📂 ブランチ切り替え中..." -ForegroundColor Yellow
git checkout $BranchName
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ブランチ切り替えに失敗" -ForegroundColor Red
    exit 1
}

# 2. 最新の変更を取得
Write-Host "🔄 最新の変更を取得中..." -ForegroundColor Yellow
git pull origin $BranchName

# 3. 依存関係のインストール
Write-Host "📦 依存関係のインストール中..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm installに失敗" -ForegroundColor Red
    exit 1
}

# 4. TypeScript型チェック
Write-Host "🔍 TypeScript型チェック中..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScriptエラーが検出されました" -ForegroundColor Red
    Write-Host "修正が必要です" -ForegroundColor Red
} else {
    Write-Host "✅ TypeScript型チェック通過" -ForegroundColor Green
}

# 5. ESLintチェック
Write-Host "🔍 ESLintチェック中..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ESLintエラーが検出されました" -ForegroundColor Red
    Write-Host "自動修正を試行中..." -ForegroundColor Yellow
    npm run lint:fix
} else {
    Write-Host "✅ ESLintチェック通過" -ForegroundColor Green
}

# 6. ユニットテスト実行
Write-Host "🧪 ユニットテスト実行中..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ユニットテストに失敗" -ForegroundColor Red
} else {
    Write-Host "✅ ユニットテスト通過" -ForegroundColor Green
}

# 7. 変更内容の表示
Write-Host "📋 変更内容の確認..." -ForegroundColor Yellow
Write-Host "変更ファイル一覧:" -ForegroundColor Cyan
git diff --name-only main..$BranchName

Write-Host "`n📊 変更統計:" -ForegroundColor Cyan
git diff --stat main..$BranchName

# 8. 最終結果
Write-Host "`n🎉 PR内容テスト完了!" -ForegroundColor Green
Write-Host "Expo開発サーバーを起動するには: npm start" -ForegroundColor Yellow
Write-Host "mainブランチに戻るには: git checkout main" -ForegroundColor Yellow 