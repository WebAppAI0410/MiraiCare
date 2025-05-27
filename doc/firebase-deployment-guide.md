# Firebase デプロイガイド

## 前提条件

1. Firebase CLIのインストール
```bash
npm install -g firebase-tools
```

2. Firebaseへのログイン
```bash
firebase login
```

3. プロジェクトの確認
```bash
firebase use
# 出力例: miraicare-360-mvp
```

## デプロイ手順

### 1. 初回デプロイ（すべてのサービス）

```bash
# 1. Functionsの依存関係をインストール
cd functions
npm install
cd ..

# 2. すべてのサービスをデプロイ
./scripts/deploy-firebase.sh all
```

### 2. 個別デプロイ

#### Cloud Functionsのみ
```bash
./scripts/deploy-firebase.sh functions
```

#### Firestoreルールとインデックス
```bash
./scripts/deploy-firebase.sh firestore
```

#### Firestoreルールのみ
```bash
./scripts/deploy-firebase.sh rules
```

#### Firestoreインデックスのみ
```bash
./scripts/deploy-firebase.sh indexes
```

## デプロイされる機能

### Cloud Functions
- **generateDailyReport**: 毎日20時にデイリーレポートを生成・送信
- **checkBadgeAchievements**: バイタルデータ作成時にバッジ条件をチェック
- **checkMoodMirrorBadge**: ムードデータ作成時にバッジ条件をチェック
- **sendReminderNotifications**: 5分ごとにリマインダー通知を送信
- **cleanupUserData**: ユーザー削除時に関連データをクリーンアップ

### Firestoreセキュリティルール
- ユーザー認証とアクセス制御
- データ検証（数値範囲、文字列形式など）
- 最小権限の原則に基づいたアクセス制限

### Firestoreインデックス
- 効率的なクエリのための複合インデックス
- 各コレクションに最適化されたインデックス設定

## 環境変数の設定

Functions用の環境変数が必要な場合：

1. `functions/.env.example`を`functions/.env`にコピー
2. 必要な値を設定
3. Firebaseコンソールから環境変数を設定することも可能：
```bash
firebase functions:config:set someservice.key="SECRET_KEY"
```

## デプロイ後の確認

### 1. Firebase Console
https://console.firebase.google.com/project/miraicare-360-mvp

### 2. Functions一覧
```bash
firebase functions:list
```

### 3. ログの確認
```bash
firebase functions:log
```

### 4. 特定の関数のログ
```bash
firebase functions:log --only generateDailyReport
```

## トラブルシューティング

### エラー: 権限不足
```bash
# プロジェクトの権限を確認
firebase projects:list
```

### エラー: 関数のタイムアウト
- Firebase Consoleから関数の設定を確認
- タイムアウト時間やメモリを調整

### エラー: インデックスが必要
- エラーメッセージのリンクをクリックして自動作成
- または`firestore.indexes.json`に追加して再デプロイ

## 本番環境へのデプロイチェックリスト

- [ ] すべてのテストが成功していることを確認
- [ ] 環境変数が正しく設定されていることを確認
- [ ] Firebaseプロジェクトが正しいことを確認
- [ ] セキュリティルールが適切であることを確認
- [ ] バックアップを取得
- [ ] デプロイ後に動作確認を実施

## ロールバック手順

問題が発生した場合：

1. Functions
```bash
# 前のバージョンにロールバック
firebase functions:delete [FUNCTION_NAME]
# その後、前のコードで再デプロイ
```

2. Firestoreルール
```bash
# Firebase Consoleから前のバージョンに戻す
# または前のルールファイルで再デプロイ
firebase deploy --only firestore:rules
```