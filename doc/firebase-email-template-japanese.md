# Firebase メールテンプレート日本語化ガイド

## 手順

### 1. Firebase Consoleにアクセス
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. `miraicare-360-mvp` プロジェクトを選択

### 2. Authentication設定を開く
1. 左側メニューから「Authentication」をクリック
2. 上部タブから「Templates」をクリック

### 3. メール確認テンプレートを日本語化

#### Email verification（メール確認）
1. 「Email verification」をクリック
2. 「鉛筆アイコン」をクリックして編集モードに入る
3. 以下の内容に変更：

**Subject（件名）:**
```
MiraiCare - メールアドレスの確認
```

**Message（本文）:**
```
こんにちは、

MiraiCareへのご登録ありがとうございます。

以下のリンクをクリックして、メールアドレスを確認してください：

%LINK%

このメールに心当たりがない場合は、無視してください。

よろしくお願いいたします。
MiraiCareチーム
```

4. 「Save」をクリック

### 4. パスワードリセットテンプレートを日本語化

#### Password reset（パスワードリセット）
1. 「Password reset」をクリック
2. 「鉛筆アイコン」をクリック
3. 以下の内容に変更：

**Subject（件名）:**
```
MiraiCare - パスワードのリセット
```

**Message（本文）:**
```
こんにちは、

MiraiCareアカウントのパスワードリセットのリクエストを受け付けました。

以下のリンクをクリックして、新しいパスワードを設定してください：

%LINK%

このリクエストに心当たりがない場合は、このメールを無視してください。
パスワードは変更されません。

よろしくお願いいたします。
MiraiCareチーム
```

4. 「Save」をクリック

### 5. メールアドレス変更テンプレートを日本語化

#### Email address change（メールアドレス変更）
1. 「Email address change」をクリック
2. 「鉛筆アイコン」をクリック
3. 以下の内容に変更：

**Subject（件名）:**
```
MiraiCare - メールアドレスの変更確認
```

**Message（本文）:**
```
こんにちは、

MiraiCareアカウントのメールアドレス変更のリクエストを受け付けました。

以下のリンクをクリックして、メールアドレスの変更を確認してください：

%LINK%

このリクエストに心当たりがない場合は、このメールを無視してください。

よろしくお願いいたします。
MiraiCareチーム
```

4. 「Save」をクリック

### 6. アクションURLのカスタマイズ（オプション）

各テンプレートで「Customize action URL」を有効にすると、メール確認後のリダイレクト先をカスタマイズできます：

1. 「Customize action URL」をオン
2. 「Action URL」に以下を設定：
   - メール確認: `https://miraicare-360-mvp.web.app/email-verified`
   - パスワードリセット: `https://miraicare-360-mvp.web.app/password-reset`
   - メールアドレス変更: `https://miraicare-360-mvp.web.app/email-changed`

## 注意事項

- テンプレートの変更は即座に反映されます
- `%LINK%` は Firebase が自動的にリンクに置き換えるプレースホルダーです（削除しないでください）
- カスタムアクションURLを設定する場合は、先にFirebase Hostingをデプロイする必要があります

## Firestoreルールのデプロイ

PowerShellで以下を実行：

```powershell
cd C:\Users\33916\MiraiCare
firebase deploy --only firestore:rules
```

これにより、更新されたFirestoreセキュリティルールがデプロイされ、権限エラーが解決されます。