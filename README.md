# MiraiCare 360 MVP v2

高齢者向けヘルスケア SaaS - 転倒・フレイル・メンタルヘルスをワンストップでサポート

## プロジェクト概要

MiraiCare 360は、高齢者本人に転倒・フレイル・メンタルヘルスリスクをシンプルに提示し、離れて暮らす家族へLINE Notifyで週次レポートと異常即時アラートを送信する、React Native（Expo）ベースのクロスプラットフォームアプリです。

### 主要機能

- **リスク指標**: 歩数・歩容・指先脈波から3段階のリスク評価
- **生活リマインド**: 水分・服薬通知とカメラ確認
- **メンタルヘルス**: ムード・ミラーChat、レミニセンス、CBT Mini-Coach
- **家族連携**: LINE Notify経由の週次レポートと異常通知
- **ゲーミフィケーション**: バッジ・スタンプシステム

## 技術スタック

- **フロントエンド**: React Native (Expo) + TypeScript
- **バックエンド**: Firebase (Firestore + Auth + Cloud Functions + Storage)
- **認証方式**: 6桁認証コード（メール送信）
- **メール送信**: Nodemailer (Gmail/SendGrid対応)
- **通知**: Firebase Cloud Messaging + LINE Notify
- **AI**: OpenAI GPT-4o API
- **デプロイ**: Expo EAS Build

## 環境構築

### 前提条件

- Node.js 18.x以上
- npm または yarn
- Expo CLI

### セットアップ手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd MiraiCare
```

2. 依存関係をインストール
```bash
npm install
```

3. Firebase設定ファイルを配置
```bash
# Android用設定ファイル
android/app/google-services.json

# iOS用設定ファイル
ios/GoogleService-Info.plist
```

4. Firebase Functionsの設定
```bash
cd functions
cp .env.example .env
# .envファイルを編集してメール送信設定を追加
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-specific-password
npm install
npm run build
```

5. 開発サーバーを起動
```bash
npm start
```

### プラットフォーム別実行

```bash
# iOS (macOS必須)
npm run ios

# Android
npm run android

# Web
npm run web
```

## Firebase Functionsデプロイ

```bash
cd functions
# Firebase CLIがインストールされていることを確認
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# Functionsをデプロイ
firebase deploy --only functions
```

### メール送信設定

#### Gmailを使用する場合
1. Googleアカウントで2段階認証を有効化
2. アプリパスワードを生成
3. .envファイルにEMAIL_USERとEMAIL_PASSWORDを設定

#### SendGridを使用する場合
1. SendGridアカウントを作成
2. APIキーを生成
3. .envファイルにSENDGRID_API_KEYを設定

## プロジェクト構成

```
MiraiCare/
├── doc/                    # プロジェクトドキュメント
│   ├── requirements.md     # 要件定義書
│   ├── features.md         # 機能一覧
│   └── screen_design.md    # 画面設計書
├── src/
│   ├── components/         # 再利用可能コンポーネント
│   ├── screens/           # 画面コンポーネント
│   ├── navigation/        # ナビゲーション設定
│   ├── services/          # API・外部サービス連携
│   ├── types/             # TypeScript型定義
│   ├── utils/             # ユーティリティ関数
│   ├── config/            # 設定ファイル
│   ├── hooks/             # カスタムフック
│   └── stores/            # 状態管理
├── assets/                # 画像・フォントなどのアセット
└── app.json              # Expo設定
```

## 開発フロー

### 週次マイルストーン

- **Week 1**: 環境構築 ✅
- **Week 2**: 認証実装
- **Week 3**: ホームUI
- **Week 4**: 歩数 & 脈波取得
- **Week 5**: リスクスコアAPI
- **Week 6**: 水分・服薬リマインド
- **Week 7**: ムード・ミラーChat
- **Week 8**: レミニセンス & 画像生成
- **Week 9**: CBT Mini-Coach
- **Week 10**: LINE連携
- **Week 11**: E2Eテスト
- **Week 12**: βリリース

### 画面実装順序

1. H06: オンボーディング ✅
2. H01: ホーム ✅
3. H07: ムード・ミラーChat
4. H03: リマインド
5. H02/H04: 活動詳細/バッジ一覧
6. H08/H09: レミニセンス/CBT
7. H05: 設定

## アクセシビリティ要件

- 最小フォントサイズ: 18pt
- タップ領域: 48×48dp以上
- コントラスト比: 4.5:1以上
- ScreenReaderラベル対応

## コーディング規約

- TypeScript strictモード
- ESLint + Prettier
- コンポーネントは関数型で実装
- スタイルはStyleSheet.createを使用
- 国際化対応（日本語/英語）

## ライセンス

Apache-2.0

---

開発に関する質問は、プロジェクトのIssueまでお願いします。

Test string for workflow trigger. 