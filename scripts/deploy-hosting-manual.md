# Firebase Hosting 手動デプロイ手順

## 前提条件
- Node.js がインストールされていること
- Firebase プロジェクトへのアクセス権限があること

## 手順

### 1. Windows PowerShellでFirebase CLIをインストール

```powershell
# PowerShellを管理者として実行
npm install -g firebase-tools
```

### 2. Firebaseにログイン

```powershell
firebase login
```

ブラウザが開くので、Googleアカウントでログインしてください。

### 3. プロジェクトディレクトリに移動

```powershell
cd C:\Users\33916\MiraiCare
```

### 4. Firebase Hostingをデプロイ

```powershell
firebase deploy --only hosting
```

## 代替方法：WSLからデプロイ

WSL (Windows Subsystem for Linux) を使用している場合：

### 1. WSLターミナルを開く

### 2. Firebase CLI認証トークンを生成（別のマシンで）

別のマシンまたはブラウザで：
```bash
firebase login:ci
```

生成されたトークンをコピー

### 3. WSLでトークンを使用してデプロイ

```bash
cd /mnt/c/Users/33916/MiraiCare
export FIREBASE_TOKEN="YOUR_TOKEN_HERE"
firebase deploy --only hosting --token "$FIREBASE_TOKEN"
```

## デプロイ内容

以下のファイルがデプロイされます：
- `/web/index.html` - MiraiCareのランディングページ
- `/web/email-verified.html` - メール確認完了ページ

## 確認方法

デプロイ完了後、以下のURLでアクセスできます：
- https://miraicare-360-mvp.web.app/
- https://miraicare-360-mvp.web.app/email-verified

## トラブルシューティング

### "command not found" エラー
- npmがインストールされていることを確認
- `npm install -g firebase-tools` を再実行

### 認証エラー
- `firebase logout` してから `firebase login` を再実行
- ブラウザのキャッシュをクリア

### デプロイエラー
- `firebase.json` の設定を確認
- `/web` ディレクトリが存在することを確認