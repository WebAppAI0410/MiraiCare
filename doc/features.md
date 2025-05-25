
# 機能一覧 — MiraiCare 360 MVP v2

| ID | 区分 | 機能 | 概要 | 技術スタック | MVP |
|----|------|------|------|-------------|-----|
| F01 | リスク | 歩行データ取得 | Google Fit / HealthKit 同期 | Expo Sensors | ✔︎ |
| F02 | リスク | 脈波測定 | カメラ×FFT→血管年齢 | TFLite | ✔︎ |
| F03 | リスク | リスクスコア | 7日平均で指数化し3段階表示 | Supabase Edge | ✔︎ |
| F04 | 行動 | 水分リマインド | 通知+ログ | FCM+Supabase | ✔︎ |
| F05 | 行動 | 服薬確認 | カメラOCR→錠剤数 | RN Vision | ✔︎ |
| F06 | 行動 | バッジ付与 | 達成条件で付与 | Supabase RPC | ✔︎ |
| F07 | 通知 | LINE週次レポ | 歩数+ムード集計 | LINE Notify | ✔︎ |
| F08 | 通知 | 異常即時通知 | リスク高/ムード低で送信 | FCM | ✔︎ |
| F09 | 共通 | 認証 | Magic Link+OTP | Supabase Auth | ✔︎ |
| F10 | 共通 | 多言語 | ja/en | i18n‑js | ✔︎ |
| F11 | メンタル | ムード・ミラー Chat | 質問3つ+感情分析+助言 | GPT‑4o API | ✔︎ |
| F12 | メンタル | レミニセンス | 回想→要約→画像生成 | GPT‑4o/Image Gen | ✔︎ |
| F13 | メンタル | CBT Mini‑Coach | 構造化質問→リフレーム | GPT‑4o function | ✔︎ |
