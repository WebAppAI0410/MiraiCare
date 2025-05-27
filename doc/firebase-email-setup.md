# Firebase メール確認設定ガイド

## 概要
Firebase Authenticationのメール確認機能を正しく設定するための手順です。

## 手順

### 1. Firebase Consoleにアクセス
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. `miraicare-360-mvp` プロジェクトを選択

### 2. Authentication設定を開く
1. 左側メニューから「Authentication」をクリック
2. 上部タブから「Templates」をクリック

### 3. メール確認テンプレートをカスタマイズ
1. 「Email verification」をクリック
2. 「Customize action URL」をクリック
3. 以下の設定を行う：
   - **Action URL**: `https://miraicare-360-mvp.web.app/email-verified`
   - **Continue URL**: 空欄のまま（または `https://miraicare-360-mvp.web.app`）

### 4. メールテンプレートをカスタマイズ（オプション）
1. 「Subject」を日本語に変更：
   ```
   MiraiCare - メールアドレスの確認
   ```

2. 「Message」を日本語に変更：
   ```
   こんにちは、

   MiraiCareへのご登録ありがとうございます。

   以下のリンクをクリックして、メールアドレスを確認してください：

   %LINK%

   このメールに心当たりがない場合は、無視してください。

   よろしくお願いいたします。
   MiraiCareチーム
   ```

### 5. Firebase Hostingの設定
カスタムランディングページを使用するには、Firebase Hostingをデプロイする必要があります：

```bash
# Firebase CLIでホスティングをデプロイ
firebase deploy --only hosting
```

## 動作の流れ

1. ユーザーがサインアップ
2. Firebaseが確認メールを送信
3. ユーザーがメール内のリンクをクリック
4. カスタムランディングページ（`/email-verified.html`）が表示される
5. ページから「アプリを開く」ボタンでアプリに戻る
6. ユーザーがログイン画面でログイン

## トラブルシューティング

### 「Site not found」エラーが表示される場合
- Firebase Hostingがデプロイされていない可能性があります
- `firebase deploy --only hosting` を実行してください

### ログインできない場合
- メール確認が完了していることを確認
- 正しいメールアドレスとパスワードを使用していることを確認
- Firebase Consoleでユーザーのステータスを確認

### アプリに戻れない場合
- Expo Goアプリが開いていることを確認
- 手動でExpo Goを開いてプロジェクトを選択

## 注意事項

- 無料プランでは、メール送信数に制限があります（1日あたり100通）
- カスタムドメインを使用する場合は、Firebase Hostingの設定が必要です
- メール確認リンクは24時間で期限切れになります