# 要件定義書 — MiraiCare 360 MVP v2

作成日: 2025-05-24

---

## 1. 目的
日本の高齢者が抱える **転倒・フレイル化・メンタルヘルス不安** をワンストップで軽減し、  
離れて暮らす家族が LINE を通じて健康状態と気分を把握できるようにする。  
自治体や介護施設に依存せず **個人課金（B2C2C）** で展開可能な SaaS を実現する。

## 2. 対象ユーザー

| ペルソナ | 年齢  | 主端末 | 主なニーズ |
|----------|-------|---------|------------|
| A. 子ども世代 | 35‑60 | iOS/Android | 親の健康・気分の異変をすぐ把握したい |
| B. 高齢者本人 | 65‑79 | iOS/Android | 面倒な操作なく転倒・寝たきり・気分の落ち込みを防ぎたい |

## 3. スコープ (MVP)

| 分類 | 機能 |
|------|------|
| フィジカル ヘルス | スマホ歩数・歩容・指先脈波を AI 解析し **フレイル・転倒リスク** を 3 段階表示 |
| 生活リマインド | 水分・服薬のプッシュ通知、カメラ認識で服薬確認 |
| メンタルヘルス | **ムード・ミラー Chat**（1日1回の気分対話）<br>**レミニセンス・タイムライン**（回想法＋画像化）<br>**5‑min CBT Mini‑Coach** |
| 家族連携 | LINE Notify に週次レポートと異常即時通知 |
| ゲーミフィケーション | 歩数・リマインド達成でバッジ・スタンプ付与 |

## 4. 技術要件

| 層 | 技術 |
|----|------|
| クライアント | **React Native (Expo)** ‑ iOS / Android / Web (PWA) |
| 認証 & DB | **Firebase** — Firestore (NoSQL) + Firebase Auth |
| 通知 & 分析 | **Firebase** — FCM / Analytics / Cloud Messaging |
| AI / 推論 | Edge TFLite (端末) ＋ Firebase Cloud Functions → OpenAI GPT‑4o |
| LINE 連携 | LINE Notify & Messaging API |
| インフラコスト | 月 1 万 MAU で総クラウド ≤ ¥100k |

### Firebase統合メリット
- **統一プラットフォーム**: 認証、DB、通知、分析、Cloud Functionsが同一環境
- **コスト効率**: Firebaseの無料枠（Spark Plan）でMVP開発可能
- **React Native統合**: 成熟したライブラリエコシステム
- **リアルタイム同期**: Firestoreによる自動同期機能
- **スケーラビリティ**: Googleインフラの信頼性

### Firebase移行ガイド

#### 1. 依存関係の変更
```bash
# Supabase削除
npm uninstall @supabase/supabase-js

# Firebase追加
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth @react-native-firebase/messaging @react-native-firebase/analytics @react-native-firebase/functions
```

#### 2. 設定ファイル
- `src/config/firebase.ts`: Firebaseクライアント設定
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

#### 3. データモデル (Firestore Collections)
```typescript
users/{userId}
vitals/{vitalId}
moods/{moodId}
reminders/{reminderId}
badges/{badgeId}
```

#### 4. セキュリティルール (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // その他のコレクション...
  }
}
```

#### 5. package.json の更新例
```json
{
  "dependencies": {
    "@react-native-firebase/app": "^19.0.0",
    "@react-native-firebase/auth": "^19.0.0",
    "@react-native-firebase/firestore": "^19.0.0",
    "@react-native-firebase/messaging": "^19.0.0",
    "@react-native-firebase/analytics": "^19.0.0",
    "@react-native-firebase/functions": "^19.0.0",
    "react-native": "^0.73.0",
    "expo": "^50.0.0"
  }
}
```

#### 6. 実装への影響
- **既存コード**: src/screens/*.tsx のインポート文をSupabaseからFirebaseに変更
- **認証フロー**: Firebase Auth の onAuthStateChanged リスナー実装
- **データ同期**: Firestoreのリアルタイムリスナーでstate更新
- **プッシュ通知**: FCMトークン管理とメッセージハンドリング

## 5. 非機能要件

- **アクセシビリティ** : 文字最小 18 pt、タップ領域 48 dp、音声読み上げ対応  
- **レスポンス** : 主要画面の初期描画 ≤ 1.5 s、チャット応答 ≤ 3 s  
- **セキュリティ** : OWASP MASVS L1、通信 TLS1.3、DB AES‑256 暗号化  
- **プライバシー** : メンタルチャットは端末暗号化保存がデフォルト。クラウド同期は OPT‑IN。  
- **法規制回避** : 医療判断を行わず助言に留める（医療機器プログラム外）  

## 6. 制約

- センサー／外部デバイスを必須にしない  
- 有料 API コストを ARPU ≤ ¥300 でまかなう  
- 70 歳以上の IT リテラシーを前提に UI を極力シンプル化  

## 7. ユーザーストーリー（抜粋）

```
US‑1 子として、親が転倒リスク「高」になったら LINE に通知が来てほしい。
US‑2 親として、朝アプリを開くだけで今日のリスクと水分目標を見たい。
US‑3 親として、気分が沈む時 AI と話して気持ちを整理したい。
US‑4 子として、親のムードが連日「低」なら声掛けタイミングを知りたい。
```

## 8. 受入れ基準

1. リスク指標がホーム画面表示まで 3 秒以内  
2. ムードチャット回答率 ≥ 70 %／週  
3. βテスト 10 家族で平均歩数 +10 %、ストレススコア −10 %  
4. LINE 週次レポート配信成功率 99 %  
