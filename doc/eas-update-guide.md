# EAS Update ガイド

## 概要

MiraiCareでは、EAS Updateを使用してアプリの更新を迅速に配信できます。これにより、アプリストアの審査を待たずに、JavaScriptコードの変更を即座にユーザーに届けることができます。

## システム構成

### チャンネル構成

- **production**: 本番環境（mainブランチ）
- **development**: 開発環境（developブランチ）
- **pr-***: PRごとのプレビュー環境

### 自動更新フロー

1. **Pull Request作成時**
   - 自動的にプレビュー版が作成される
   - QRコードがPRコメントに投稿される
   - Expo Goアプリで即座に確認可能

2. **mainブランチへのマージ時**
   - 本番環境に自動デプロイ
   - すべてのユーザーに更新が配信される

3. **developブランチへのプッシュ時**
   - 開発環境に自動デプロイ
   - テスターが最新版を確認可能

## 使用方法

### 開発者向け

#### 1. ローカル開発

```bash
# 開発サーバーの起動
npm start

# iOSシミュレーターで実行
npm run ios

# Androidエミュレーターで実行
npm run android
```

#### 2. プレビュー版の確認

PRを作成すると、自動的にコメントにQRコードが投稿されます：

1. Expo Goアプリをインストール
2. QRコードをスキャン
3. アプリが自動的に起動

#### 3. 手動アップデート

```bash
# 開発環境にアップデート
eas update --branch development --message "Fix: ログイン画面の修正"

# プレビュー環境にアップデート
eas update --branch pr-feature-login --message "Feature: 新しいログイン画面"
```

### テスター向け

#### Expo Goでの確認方法

1. **Expo Goアプリのインストール**
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **アプリの起動**
   - PRコメントのQRコードをスキャン
   - または、提供されたリンクをタップ

3. **更新の確認**
   - アプリ起動時に自動的に最新版がダウンロードされる
   - 「Downloading update...」の表示を確認

#### 開発ビルドでの確認方法

ネイティブ機能を含む場合は開発ビルドが必要です：

```bash
# 開発ビルドの作成
eas build --profile development --platform ios
eas build --profile development --platform android

# ビルド完了後、アップデートを適用
eas update --branch development
```

## トラブルシューティング

### 更新が反映されない場合

1. **アプリを完全に終了して再起動**
   - iOSの場合：ホームボタンをダブルクリックしてアプリをスワイプ
   - Androidの場合：最近のアプリからアプリを削除

2. **キャッシュのクリア**
   ```bash
   # Expo Goのキャッシュをクリア
   expo start -c
   ```

3. **チャンネルの確認**
   - 正しいチャンネルに接続しているか確認
   - PRの場合は`pr-<branch-name>`形式

### ネイティブコードの変更が必要な場合

以下の変更は新しいビルドが必要です：

- 新しいnpmパッケージの追加（ネイティブ依存関係を含む）
- app.config.jsの変更
- ネイティブ権限の追加
- アイコンやスプラッシュ画面の変更

```bash
# 新しいビルドを作成
eas build --profile preview --platform all
```

## セキュリティ考慮事項

1. **環境変数の管理**
   - 本番環境の秘密情報はEAS Secretsで管理
   - ローカルの`.env`ファイルはgitignoreに追加

2. **アクセス制御**
   - 開発ビルドは内部配信のみ
   - 本番ビルドは適切な署名で保護

3. **更新の検証**
   - すべての更新はCI/CDパイプラインを通過
   - 自動テストに合格した更新のみ配信

## よくある質問

### Q: Expo Goと開発ビルドの違いは？

A: Expo Goは標準的なExpo SDKの機能のみ使用可能。開発ビルドはカスタムネイティブコードも含む完全なアプリです。

### Q: 更新にどのくらい時間がかかる？

A: 通常、EAS Updateは数秒から1分程度で完了します。ビルドは10-30分程度かかります。

### Q: オフラインでも動作する？

A: はい、一度ダウンロードした更新はオフラインでも利用可能です。

## 関連リンク

- [EAS Update公式ドキュメント](https://docs.expo.dev/eas-update/introduction/)
- [Expo Go](https://expo.dev/client)
- [EAS Build](https://docs.expo.dev/build/introduction/)