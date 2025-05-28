# MiraiCare ビルド手順

## 🚀 開発ビルドの作成手順

### 1. EASにログイン（ターミナルで実行）

```bash
eas login
```

**必要な情報：**
- Expoアカウントのメールアドレス
- パスワード

アカウントがない場合は https://expo.dev で作成してください。

### 2. ビルド設定の初期化

```bash
eas build:configure
```

これにより以下が設定されます：
- プロジェクトIDの生成
- eas.jsonの更新

### 3. 開発ビルドの開始

```bash
# 両プラットフォーム同時
eas build --profile development --platform all

# または個別に
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 4. ビルド中の質問への回答

#### iOS の場合
- **Apple Developer アカウント**: 必要（年間$99）
- **Bundle ID**: `com.miraicare.app`（自動設定済み）
- **証明書**: EASに自動生成させる（推奨）

#### Android の場合
- **Keystore**: EASに自動生成させる（推奨）
- **Package name**: `com.miraicare.app`（自動設定済み）

### 5. ビルド完了後

ビルドには20-30分かかります。完了すると：
- QRコード表示
- ダウンロードリンク提供
- インストール手順の案内

### 6. 実機へのインストール

#### iOS
1. QRコードをカメラでスキャン
2. Safariでリンクを開く
3. プロファイルをインストール
4. 設定 > 一般 > デバイス管理 で信頼

#### Android
1. QRコードをスキャン
2. APKをダウンロード
3. 「提供元不明のアプリ」を許可
4. インストール

## 📱 トラブルシューティング

### ログインできない場合
```bash
# ブラウザ経由でログイン
eas login --sso
```

### ビルドエラーの場合
```bash
# キャッシュをクリア
eas build --clear-cache --profile development --platform all

# 詳細ログを確認
eas build --profile development --platform all --non-interactive
```

### 証明書関連のエラー（iOS）
- Apple Developer アカウントの確認
- 証明書の有効期限確認
- EASに再生成させる

## 🎯 次のステップ

ビルド完了後：
1. 実機で全機能をテスト
2. パフォーマンスを確認
3. バグがあれば修正
4. EAS Updateで即座に更新

## 📞 サポート

問題が発生した場合：
1. `eas diagnostics` を実行
2. エラーメッセージを記録
3. https://expo.dev/accounts でプロジェクト設定を確認

---
準備ができたら、ターミナルで `eas login` から始めてください！