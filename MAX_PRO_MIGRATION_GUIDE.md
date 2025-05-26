# Claude Max Pro移行ガイド

## ✅ 契約完了後の確認事項

### 1. Claude CLI動作確認
```bash
# Max Proプラン認識確認
claude --version
# → 1.0.3 (Claude Code)

# 無制限利用テスト
claude "Hello, Max Pro契約確認テストです"
# → 従量課金警告が表示されないことを確認
```

### 2. GitHub Actions最適化
```bash
# 不要なワークフロー無効化
git mv .github/workflows/claude-ci-autofix.yml .github/workflows/disabled/
git mv .github/workflows/claude-ci-autofix-optimized.yml .github/workflows/disabled/
git mv .github/workflows/claude-coderabbit-feedback.yml .github/workflows/disabled/

# 必要最小限のワークフローのみ維持
# - test.yml (品質チェック)
# - auto-error-detection.yml (最低限の監視)
```

### 3. 新ワークフロー確立
```bash
# TDD Phase 3開始
claude "TDD Phase 3: AI機能実装を開始してください。GPT-4o連携とリスクスコア計算を含む"

# 並行してCodexでテスト修正
# PR #59の残り問題をCodexに依頼
```

## 🚀 最適化運用開始

### Phase 1: 即座実行 (今日)
```bash
1. Claude CLI無制限確認
2. GitHub Actions簡素化
3. Codex環境設定活用
4. TDD Phase 3開始
```

### Phase 2: 効率測定 (明日-1週間)
```bash
1. 開発時間測定
2. 品質指標確認
3. ワークフロー調整
4. テンプレート作成
```

### Phase 3: 完全最適化 (2週間目)
```bash
1. 並行作業確立
2. 自動化拡大
3. ROI検証
4. 長期戦略策定
```

## 💰 コスト追跡

### 月額固定費
- Claude Max Pro: $100
- ChatGPT Pro: $200 (既存)
- **合計**: $300 (従来$380-440から30%削減)

### 追加効果
- 開発時間: 週40時間 → 25時間
- 機能実装: 1週間 → 2-3日
- バグ修正: 2-4時間 → 30分

## 🎯 成功基準
- [ ] Claude CLI無制限利用確認
- [ ] 週25時間開発達成
- [ ] TDD Phase 3完了
- [ ] テスト修正100%成功
- [ ] ROI 200%達成