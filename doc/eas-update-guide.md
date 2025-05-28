# EAS Update 導入ガイド

## 概要

EAS Update を使用することで、アプリストアの審査を待たずに、JavaScriptコードの変更を即座にユーザーに配信できます。

## 🚀 主な機能

### 1. 自動デプロイ
- **本番環境**: `main`ブランチへのプッシュで自動更新
- **開発環境**: `develop`ブランチへのプッシュで自動更新
- **プレビュー環境**: PR作成時に自動でプレビュー版を生成

### 2. プレビューリンク
PRを作成すると、自動的にコメントにプレビューリンクが投稿されます：
```
exp://u.expo.dev/update/pr-feature-branch-name
```

### 3. 手動デプロイ
GitHub ActionsのUIから手動でデプロイも可能です。

## 📱 アプリでの確認方法

### Expo Goアプリ
1. [Expo Go](https://expo.dev/client)をインストール
2. PRコメントのリンクをタップまたはQRコードをスキャン
3. 自動的に最新版がダウンロードされる

### 開発ビルド
既存の開発ビルドがある場合：
```bash
# iOS
eas update --branch production --platform ios

# Android
eas update --branch production --platform android
```

## 🔧 設定

### 必要な環境変数
- `EXPO_TOKEN`: GitHub Secretsに設定済み

### チャンネル設定
- `production`: 本番環境
- `development`: 開発環境
- `preview`: プレビュー環境
- `pr-*`: PR専用チャンネル

## 📋 ワークフロー

### PR作成時
1. 開発者がPRを作成
2. GitHub ActionsがEAS Updateを実行
3. プレビューリンクがPRにコメントされる
4. レビュアーがExpo Goで確認

### 本番デプロイ
1. PRがmainブランチにマージ
2. 自動的にproductionチャンネルに配信
3. ユーザーのアプリが次回起動時に更新

## ⚡ 制限事項

### 更新できるもの
- JavaScriptコード
- 画像などのアセット
- 設定ファイル

### 更新できないもの（新しいビルドが必要）
- ネイティブコード
- ネイティブ依存関係
- Expo SDKのバージョン
- app.config.jsの一部設定

## 🛠️ トラブルシューティング

### 更新が反映されない場合
1. アプリを完全に終了して再起動
2. Expo Goのキャッシュをクリア
3. チャンネル名が正しいか確認

### ビルドエラーの場合
1. `npm install`を実行
2. `npx expo doctor`で問題を診断
3. GitHub Actionsのログを確認

## 📊 モニタリング

### Expo Dashboard
[https://expo.dev](https://expo.dev)でプロジェクトの更新履歴を確認できます。

### GitHub Actions
各デプロイの詳細なログはGitHub Actionsで確認できます。

## 🔐 セキュリティ

- `EXPO_TOKEN`は安全に管理されています
- プレビューチャンネルは30日後に自動削除されます
- 本番チャンネルへのアクセスは制限されています