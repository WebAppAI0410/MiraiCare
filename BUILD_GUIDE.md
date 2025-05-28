# MiraiCare ビルドガイド

## 1. EASセットアップ

### ログイン
```bash
eas login
```
Expoアカウントのメールアドレスとパスワードを入力してください。

### プロジェクト設定
```bash
eas build:configure
```

## 2. 開発ビルドの作成

### 両プラットフォーム同時ビルド
```bash
eas build --profile development --platform all
```

### プラットフォーム別ビルド
```bash
# iOS用
eas build --profile development --platform ios

# Android用
eas build --profile development --platform android
```

## 3. ビルド中の確認事項

ビルド中に以下の情報が必要になる可能性があります：

### iOS
- Apple Developer アカウント（有料：年間$99）
- Bundle Identifier: `com.miraicare.app`
- プロビジョニングプロファイル（EASが自動生成可能）

### Android
- Keystoreファイル（EASが自動生成可能）
- Package name: `com.miraicare.app`

## 4. ビルド完了後

### ダウンロードリンク
ビルド完了後、以下のような情報が表示されます：
- QRコード
- ダウンロードURL
- インストール手順

### インストール方法

#### iOS
1. TestFlightまたは直接インストール
2. デバイスをDeveloper Profileに登録（内部配布の場合）

#### Android
1. APKファイルを直接ダウンロード
2. 「提供元不明のアプリ」を許可してインストール

## 5. トラブルシューティング

### よくある問題

1. **ビルドエラー**
   - `eas build --clear-cache`でキャッシュをクリア
   - `expo doctor`で設定を確認

2. **証明書エラー（iOS）**
   - Apple Developer アカウントを確認
   - 証明書の有効期限を確認

3. **パッケージの互換性**
   - `npx expo install --check`で依存関係を確認

## 6. ストア提出の準備

開発ビルドでの確認が完了したら：

### 必要な準備
- [ ] アプリアイコン（1024x1024）
- [ ] スプラッシュスクリーン
- [ ] スクリーンショット（各画面サイズ）
- [ ] アプリ説明文
- [ ] プライバシーポリシー
- [ ] 利用規約

### 本番ビルド
```bash
eas build --profile production --platform all
```

### ストア提出
```bash
# App Store Connect / Google Play Consoleへの自動提出
eas submit --platform all
```

## 7. 現在のステータス

- ✅ 開発環境構築完了
- ✅ Phase 5まで実装完了
- ✅ EAS Update設定完了
- 🔄 開発ビルド作成中
- ⏳ ストア提出準備

---
最終更新: 2025年5月28日