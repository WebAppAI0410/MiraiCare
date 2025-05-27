# Expo Go実機テストガイド

## 前提条件

1. **Expo Goアプリ**をスマートフォンにインストール
   - iOS: App Store
   - Android: Google Play

2. **同じWiFiネットワーク**に接続（開発PCとスマートフォン）

## テスト手順

### 1. Expoサーバー起動

```bash
# プロジェクトディレクトリで実行
npm start
```

### 2. 接続方法

#### 方法A: QRコード（推奨）
1. ターミナルに表示されるQRコードをExpo Goアプリでスキャン
2. iOS: カメラアプリでスキャン → Expo Goで開く
3. Android: Expo Go内のQRスキャナーを使用

#### 方法B: 手動入力
1. ターミナルに表示される `exp://xxx.xxx.xxx.xxx:8081` をコピー
2. Expo Goアプリで「Enter URL manually」を選択
3. URLを入力

### 3. Firebase Functions設定

実機テストの前に、Firebase Functionsをデプロイする必要があります：

```bash
# Functionsディレクトリへ移動
cd functions

# 環境変数設定
cp .env.example .env
# .envファイルを編集して、メール送信設定を追加

# Firebaseにログイン
firebase login

# Functionsをデプロイ
firebase deploy --only functions
```

### 4. テストシナリオ

#### 認証フロー
1. **オンボーディング画面**
   - スワイプ動作の確認
   - スキップボタンの動作

2. **ゲストホーム画面**
   - 「完全版を利用する」ボタンをタップ

3. **新規登録フロー**
   - フォーム入力（名前、メール、パスワード）
   - 「アカウント作成」ボタンをタップ
   - 認証コードメールの受信確認
   - 6桁コード入力
   - アカウント作成完了

4. **ログインフロー**
   - メール/パスワードでログイン
   - エラーハンドリングの確認

### 5. トラブルシューティング

#### 接続できない場合
- ファイアウォール設定を確認
- `npx expo start --tunnel` でトンネルモードを試す
- ポート8081が開いているか確認

#### Firebase Functionsエラー
- Firebase Consoleで関数のログを確認
- CORSエラーの場合は、Firebase設定を確認
- 認証エラーの場合は、Firebase Authenticationの設定を確認

#### 認証コードが届かない場合
- スパムフォルダを確認
- Firebase Functionsのログを確認
- メール送信設定（Gmail/SendGrid）を確認

### 6. デバッグ情報の確認

開発中は以下のコマンドでログを確認：

```bash
# Expo のログ
npm start

# Firebase Functions のログ
firebase functions:log

# デバイス固有のログ
# iOS: Xcode → Window → Devices and Simulators
# Android: adb logcat
```

## 重要な確認ポイント

- [ ] タップの反応速度
- [ ] 画面遷移のスムーズさ
- [ ] キーボードの動作
- [ ] 入力フォームの使いやすさ
- [ ] エラーメッセージの表示
- [ ] 認証コードの入力UI
- [ ] 高齢者向けのUI/UX（文字サイズ、ボタンサイズ）