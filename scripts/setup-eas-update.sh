#!/bin/bash

# EAS Update セットアップスクリプト
# このスクリプトはEAS Updateの初期設定を行います

echo "🚀 EAS Update セットアップを開始します..."

# 1. EAS CLIがインストールされているか確認
if ! command -v eas &> /dev/null; then
    echo "📦 EAS CLIをインストールしています..."
    npm install -g eas-cli
fi

# 2. Expoアカウントにログイン確認
echo "🔐 Expoアカウントの確認..."
if ! eas whoami &> /dev/null; then
    echo "ℹ️  Expoアカウントにログインしてください:"
    eas login
fi

# 3. プロジェクト情報の確認
echo "📋 プロジェクト情報を確認しています..."
eas project:info

# 4. EAS Updateの初期化
echo "🔧 EAS Updateを初期化しています..."
eas update:configure

# 5. チャンネル情報の表示
echo "📺 利用可能なチャンネル:"
echo "  - production: 本番環境"
echo "  - development: 開発環境"
echo "  - preview: プレビュー環境"
echo "  - pr-*: PR専用チャンネル（自動生成）"

# 6. 初回アップデートの実行（オプション）
read -p "🤔 初回アップデートを実行しますか？ (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 開発環境にアップデートを公開しています..."
    eas update --branch development --message "Initial EAS Update setup"
fi

echo "✅ セットアップが完了しました！"
echo ""
echo "📖 次のステップ:"
echo "1. GitHub Secretsに EXPO_TOKEN を設定"
echo "2. PRを作成して自動デプロイをテスト"
echo "3. Expo Goアプリでプレビューを確認"
echo ""
echo "詳細は doc/eas-update-guide.md を参照してください。"