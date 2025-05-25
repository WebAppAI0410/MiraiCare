# 🚀 MiraiCare クイックテストコマンド

## 📋 毎日の開発で使うコマンド

### 基本開発フロー
```bash
# 1. 依存関係インストール（初回のみ）
npm install

# 2. 開発サーバー起動
npm start
# または
expo start

# 3. 品質チェック（コミット前必須）
npm run lint && npx tsc --noEmit && npm test
```

### 段階別テストコマンド

#### 🟢 Phase 1: Expo Go テスト（UI・API機能）
```bash
# 開発サーバー起動
expo start

# 品質チェック
npm run lint
npx tsc --noEmit
npm test

# 全チェック一括実行
npm run lint && npx tsc --noEmit && npm test && echo "✅ Phase 1 完了"
```

#### 🟡 Phase 2: Development Build（ネイティブ機能）
```bash
# Android Development Build作成
eas build --platform android --profile development

# ビルド状況確認
eas build:list

# 実機テスト項目確認
echo "📱 実機で確認する項目:"
echo "- 歩数データ取得"
echo "- プッシュ通知"
echo "- カメラ機能"
echo "- センサーアクセス"
```

#### 🔴 Phase 3: Preview Build（ベータテスト）
```bash
# Preview Build作成
eas build --platform android --profile preview

# 内部配布
eas submit --platform android --latest
```

#### ⚫ Phase 4: Production Build（本番リリース）
```bash
# Production Build作成
eas build --platform all --profile production

# ストア申請
eas submit --platform android --latest
eas submit --platform ios --latest
```

## 🔧 トラブル解決コマンド

### キャッシュクリア
```bash
# Metro bundler キャッシュクリア
expo start --clear

# npm キャッシュクリア
npm cache clean --force

# node_modules 再インストール
rm -rf node_modules && npm install
```

### ビルドエラー対応
```bash
# EAS ビルドログ確認
eas build:list
eas build:view [BUILD_ID]

# 設定ファイル確認
cat eas.json
cat app.config.js
```

### 実機接続確認
```bash
# Android デバイス確認
adb devices

# Expo Go 接続確認
expo start --tunnel
```

## 📊 機能別テストコマンド

### Firebase関連
```bash
# Firebase設定確認
ls -la google-services.json GoogleService-Info.plist

# Firestore ルール確認
cat firestore.rules

# Firebase プロジェクト一覧
firebase projects:list
```

### API連携テスト
```bash
# OpenAI API テスト
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'

# LINE Notify テスト
curl -X POST https://notify-api.line.me/api/notify \
  -H "Authorization: Bearer $LINE_NOTIFY_TOKEN" \
  -F "message=テストメッセージ"
```

## 🎯 自動化スクリプト

### 開発時チェック関数
```bash
# PowerShell用関数
function dev-check {
    Write-Host "🔍 開発時チェック開始..." -ForegroundColor Yellow
    npm run lint
    if ($LASTEXITCODE -eq 0) {
        npx tsc --noEmit
        if ($LASTEXITCODE -eq 0) {
            npm test
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ 全チェック完了！" -ForegroundColor Green
            }
        }
    }
}

# 使用方法
dev-check
```

### Bash用関数
```bash
# Bash用関数（WSL/Linux/macOS）
dev-check() {
    echo "🔍 開発時チェック開始..."
    npm run lint && \
    npx tsc --noEmit && \
    npm test && \
    echo "✅ 全チェック完了！"
}

# 使用方法
dev-check
```

## 📱 実機テスト手順

### Android実機テスト
```bash
# 1. Development Build作成
eas build --platform android --profile development

# 2. ビルド完了まで待機（通常10-15分）
eas build:list --platform android --status in-progress

# 3. APKダウンロード・インストール
# ビルド完了後のQRコードまたはURLからダウンロード

# 4. 実機テスト実行
echo "📱 Android実機テスト項目:"
echo "1. アプリ起動・認証"
echo "2. 歩数データ取得"
echo "3. プッシュ通知受信"
echo "4. カメラ・センサー動作"
echo "5. オフライン動作"
```

### iOS実機テスト（macOSのみ）
```bash
# 1. Development Build作成
eas build --platform ios --profile development

# 2. TestFlightまたはAd-hoc配布
# Apple Developer アカウント必要

# 3. 実機テスト実行
echo "📱 iOS実機テスト項目:"
echo "1. HealthKit連携"
echo "2. プッシュ通知"
echo "3. アクセシビリティ"
echo "4. バックグラウンド動作"
```

## 🚨 緊急時対応コマンド

### アプリクラッシュ時
```bash
# ログ確認
expo start --dev-client
# または
npx react-native log-android
npx react-native log-ios

# クラッシュレポート確認
# Firebase Crashlytics または Expo Crash Reports
```

### ビルド失敗時
```bash
# 詳細ログ確認
eas build:view [BUILD_ID] --verbose

# 設定リセット
rm -rf .expo
expo install --fix

# 依存関係リセット
rm -rf node_modules package-lock.json
npm install
```

## 📈 パフォーマンステスト

### メモリ・CPU使用量確認
```bash
# Android
adb shell dumpsys meminfo [PACKAGE_NAME]
adb shell top -p [PID]

# 開発時プロファイリング
expo start --dev-client
# → React DevTools Profiler使用
```

### ネットワーク使用量確認
```bash
# ネットワーク監視
# Chrome DevTools → Network タブ
# または React Native Debugger使用
```

---

**💡 Tips**: 
- 毎日の開発では Phase 1 のコマンドを中心に使用
- 週1回は Phase 2 で実機テスト実行
- リリース前は Phase 3, 4 で最終確認
- 問題発生時は該当セクションのトラブル解決コマンドを実行 