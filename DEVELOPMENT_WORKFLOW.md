# 🔄 MiraiCare 開発ワークフロー

## 📅 日々の開発サイクル

### 🌅 朝の開始時（5分）
```bash
# 1. 最新コードを取得
git pull origin main

# 2. 依存関係更新確認
npm install

# 3. 開発サーバー起動
npm start
```

### 💻 開発中（継続的）
```bash
# コード変更後の確認
npm run lint
npx tsc --noEmit

# テスト実行（新機能追加時）
npm test

# 実機確認が必要な場合
expo start --tunnel
```

### 🌙 終了時・コミット前（10分）
```bash
# 1. 全品質チェック
npm run lint && npx tsc --noEmit && npm test

# 2. 変更をステージング
git add .

# 3. コミット
git commit -m "✨ 機能名: 実装内容の説明"

# 4. プッシュ
git push origin main
```

## 🎯 機能実装フロー

### Issue対応の基本フロー
```bash
# 1. Issue確認・理解
gh issue view [ISSUE_NUMBER]

# 2. ブランチ作成（オプション）
git checkout -b feature/issue-[ISSUE_NUMBER]

# 3. 実装開始
npm start

# 4. 段階的テスト
# Phase 1: Expo Go
expo start

# Phase 2: 実機テスト（必要に応じて）
eas build --platform android --profile development

# 5. 品質チェック
npm run lint && npx tsc --noEmit && npm test

# 6. コミット・プッシュ
git add .
git commit -m "🔧 #[ISSUE_NUMBER]: 実装内容"
git push origin main

# 7. Issue更新
gh issue comment [ISSUE_NUMBER] --body "実装完了。テスト結果: ✅"
```

## 📱 テストタイミング判断フロー

### いつExpo Goを使うか？
```bash
# ✅ Expo Go適用場面
echo "UI/UX変更"
echo "API連携（Firebase、OpenAI、LINE）"
echo "画面遷移・ナビゲーション"
echo "状態管理・データ表示"
echo "基本的なロジック確認"

# 実行コマンド
expo start
```

### いつEAS Development Buildを使うか？
```bash
# ⚠️ EAS Build必須場面
echo "歩数データ取得（Google Fit/HealthKit）"
echo "プッシュ通知受信テスト"
echo "カメラ・センサー機能"
echo "ネイティブモジュール使用"
echo "実機パフォーマンステスト"

# 実行コマンド
eas build --platform android --profile development
```

## 🔄 週次・月次作業

### 📅 週次作業（金曜日推奨）
```bash
# 1. 全機能統合テスト
npm run lint && npx tsc --noEmit && npm test

# 2. 実機テスト（重要機能）
eas build --platform android --profile development

# 3. 依存関係更新確認
npm outdated
npm update

# 4. ワークフロー健全性確認
gh run list --limit 10

# 5. Issue整理
gh issue list --state open
```

### 📅 月次作業（月末推奨）
```bash
# 1. Preview Build作成
eas build --platform android --profile preview

# 2. 内部ベータテスト
eas submit --platform android --latest

# 3. パフォーマンス分析
# Firebase Analytics確認
# Expo Analytics確認

# 4. セキュリティ監査
npm audit
npm audit fix

# 5. バックアップ・ドキュメント更新
git tag v1.0.[MONTH]
```

## 🚨 緊急時対応フロー

### アプリクラッシュ発生時
```bash
# 1. 即座にログ確認
expo start --dev-client

# 2. エラー詳細取得
# Firebase Crashlytics確認
# Expo Error Reports確認

# 3. 緊急修正
# 最小限の修正でクラッシュ解決

# 4. 緊急ビルド
eas build --platform android --profile development

# 5. 修正確認後本番反映
eas build --platform all --profile production
```

### ビルド失敗時
```bash
# 1. ビルドログ詳細確認
eas build:view [BUILD_ID] --verbose

# 2. 設定ファイル確認
cat eas.json
cat app.config.js

# 3. 依存関係リセット
rm -rf node_modules package-lock.json
npm install

# 4. 再ビルド
eas build --platform android --profile development
```

## 📊 品質管理チェックポイント

### 毎回のコミット前
```bash
# 必須チェック項目
npm run lint          # ESLintエラーなし
npx tsc --noEmit      # TypeScriptエラーなし
npm test              # ユニットテスト通過

# 推奨チェック項目
expo start            # Expo Go動作確認
```

### 週次品質チェック
```bash
# 包括的品質チェック
npm run lint && npx tsc --noEmit && npm test

# 実機動作確認
eas build --platform android --profile development

# パフォーマンス確認
# メモリ使用量、起動時間、応答速度
```

### リリース前品質チェック
```bash
# 最終品質チェック
npm run lint && npx tsc --noEmit && npm test

# 全プラットフォームビルド
eas build --platform all --profile production

# 最終動作確認
# 全機能テスト、パフォーマンステスト、セキュリティチェック
```

## 🎯 効率化Tips

### 開発時間短縮
```bash
# エイリアス設定（PowerShell Profile）
function Start-MiraiCare { expo start }
function Test-MiraiCare { npm run lint && npx tsc --noEmit && npm test }
function Build-MiraiCare { eas build --platform android --profile development }

# 使用例
Start-MiraiCare
Test-MiraiCare
Build-MiraiCare
```

### 自動化活用
```bash
# GitHub Actions活用
# - 自動品質チェック
# - 自動Issue作成
# - Claude Code自動修正

# 手動作業最小化
# - 定期的なワークフロー監視
# - 自動エラー検知・修正
```

### 開発環境最適化
```bash
# VS Code拡張機能推奨
# - ES7+ React/Redux/React-Native snippets
# - TypeScript Importer
# - Expo Tools
# - Firebase Explorer

# 設定最適化
# - Auto Save有効化
# - Format on Save有効化
# - TypeScript strict mode
```

## 📈 進捗管理

### Issue進捗追跡
```bash
# 現在のIssue状況確認
gh issue list --state open

# 特定Issue詳細確認
gh issue view [ISSUE_NUMBER]

# Issue更新
gh issue comment [ISSUE_NUMBER] --body "進捗: 50% 完了"
```

### 開発メトリクス
```bash
# 週次レポート生成
echo "今週の実装:"
git log --since="1 week ago" --oneline

echo "今週のテスト実行回数:"
# GitHub Actions履歴確認

echo "今週のIssue解決数:"
gh issue list --state closed --search "closed:>$(date -d '1 week ago' +%Y-%m-%d)"
```

---

**💡 重要**: 
- 毎日のコミット前は必ず品質チェック実行
- 週1回は実機テストで動作確認
- 問題発生時は即座にログ確認・対応
- 自動化システムを積極活用して効率化 