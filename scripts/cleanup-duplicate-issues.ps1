# 重複Issue自動クリーンアップスクリプト
# 使用方法: .\scripts\cleanup-duplicate-issues.ps1

Write-Host "🧹 重複Issue自動クリーンアップを開始します..." -ForegroundColor Yellow

# 重複auto-detectedIssueを取得
$duplicateIssues = @(6, 8, 9, 11, 12, 13, 20, 21, 23, 24, 26, 27, 28)

Write-Host "📊 クリーンアップ対象: $($duplicateIssues.Count)個のIssue" -ForegroundColor Cyan

# 各Issueに統合コメントを追加してクローズ
foreach ($issueNumber in $duplicateIssues) {
    Write-Host "🔄 Issue #$issueNumber を処理中..." -ForegroundColor Blue
    
    # 統合コメントを追加
    $comment = @"
## 🔄 Issue統合のお知らせ

このIssueは**auto-error-detection.yml最適化**により統合されました。

### 📋 変更内容
- ✅ **PRエラー検知**: `claude-auto-fix-v2.yml`に移管
- ✅ **mainブランチエラー検知**: 最適化された`auto-error-detection.yml`で処理
- ✅ **重複Issue防止**: 1つのmainブランチエラーIssueのみ作成

### 🎯 今後の対応
- **PRのエラー**: 自動的に同じPR内で修正
- **mainブランチのエラー**: 専用のUrgentIssueで対応
- **Issue乱発問題**: 解決済み

### 📚 詳細情報
効率化の詳細は [workflow-optimization-analysis.md](../doc/workflow-optimization-analysis.md) をご確認ください。

---
*自動クリーンアップシステムによって処理*
"@

    try {
        # コメント追加
        gh issue comment $issueNumber --body $comment
        
        # Issueをクローズ
        gh issue close $issueNumber --reason "not_planned"
        
        Write-Host "✅ Issue #$issueNumber をクローズしました" -ForegroundColor Green
        
        # API制限を避けるため少し待機
        Start-Sleep -Seconds 1
    }
    catch {
        Write-Host "❌ Issue #$issueNumber の処理に失敗: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 クリーンアップ完了!" -ForegroundColor Green
Write-Host "📈 効果:" -ForegroundColor Cyan
Write-Host "  - Issue数削減: $($duplicateIssues.Count)個 → 0個" -ForegroundColor White
Write-Host "  - 管理効率化: 重複Issue解消" -ForegroundColor White
Write-Host "  - 開発者体験向上: 明確なワークフロー" -ForegroundColor White

Write-Host "`n📋 次のステップ:" -ForegroundColor Yellow
Write-Host "  1. 新しいPRを作成してテスト" -ForegroundColor White
Write-Host "  2. claude-auto-fix-v2.ymlの動作確認" -ForegroundColor White
Write-Host "  3. main branch error detection test" -ForegroundColor White 