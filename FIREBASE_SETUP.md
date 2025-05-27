# Firebase セットアップ手順

## 1. Firebase CLIのインストール

### Windows
```bash
npm install -g firebase-tools
```

### macOS/Linux
```bash
sudo npm install -g firebase-tools
```

## 2. Firebaseへのログイン
```bash
firebase login
```

## 3. プロジェクトの確認
```bash
firebase use
# 現在のプロジェクト: miraicare-360-mvp
```

## 4. デプロイ前の準備

### Functions依存関係のインストール
```bash
cd functions
npm install
cd ..
```

## 5. デプロイの実行

### すべてをデプロイ
```bash
./scripts/deploy-firebase.sh all
```

### または個別にデプロイ

#### Firestoreルールとインデックス
```bash
./scripts/deploy-firebase.sh firestore
```

#### Cloud Functions
```bash
./scripts/deploy-firebase.sh functions
```

## 6. デプロイ後の確認

### Firebase Console
https://console.firebase.google.com/project/miraicare-360-mvp

### Functions一覧
```bash
firebase functions:list
```

### ログの確認
```bash
firebase functions:log
```

## トラブルシューティング

### エラー: permission denied
Windowsの場合、PowerShellで実行権限を付与：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### エラー: EACCES
Unix系の場合、実行権限を付与：
```bash
chmod +x scripts/deploy-firebase.sh
```

### エラー: Project not found
正しいプロジェクトが選択されているか確認：
```bash
firebase use miraicare-360-mvp
```