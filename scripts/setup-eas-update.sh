#!/bin/bash

# EAS Update セットアップスクリプト

echo "🚀 MiraiCare EAS Update セットアップ"
echo "====================================="

# 必要なツールの確認
command -v eas >/dev/null 2>&1 || { 
    echo "❌ EAS CLIがインストールされていません。"
    echo "以下のコマンドでインストールしてください："
    echo "npm install -g eas-cli"
    exit 1
}

# EASログイン確認
if ! eas whoami >/dev/null 2>&1; then
    echo "📱 EASにログインしてください..."
    eas login
fi

# プロジェクトの設定
echo ""
echo "📋 プロジェクト設定の確認..."

# プロジェクトIDの取得または設定
PROJECT_ID=$(grep -o '"projectId":\s*"[^"]*"' app.config.js | grep -o '"[^"]*"$' | tr -d '"')

if [ -z "$PROJECT_ID" ]; then
    echo "⚠️  プロジェクトIDが設定されていません。"
    echo "新しいEASプロジェクトを作成しますか？ (y/n)"
    read -r response
    
    if [ "$response" = "y" ]; then
        eas init
        echo "✅ EASプロジェクトを作成しました"
    else
        echo "❌ セットアップを中止しました"
        exit 1
    fi
else
    echo "✅ プロジェクトID: $PROJECT_ID"
fi

# GitHub Secretsの設定案内
echo ""
echo "🔐 GitHub Secretsの設定"
echo "======================="
echo ""
echo "以下のシークレットをGitHubリポジトリに設定してください："
echo ""
echo "1. EXPO_TOKEN"
echo "   取得方法："
echo "   - https://expo.dev/accounts/[username]/settings/access-tokens"
echo "   - 'Create'をクリックして新しいトークンを作成"
echo "   - スコープは 'EAS Update' を含める"
echo ""
echo "2. 設定方法："
echo "   - GitHubリポジトリの Settings > Secrets and variables > Actions"
echo "   - 'New repository secret' をクリック"
echo "   - Name: EXPO_TOKEN"
echo "   - Value: 取得したトークン"
echo ""

# チャンネルの確認
echo "📡 更新チャンネルの設定"
echo "====================="
echo ""
echo "現在設定されているチャンネル："
echo "- production (本番環境)"
echo "- development (開発環境)"
echo "- pr-* (プレビュー環境)"
echo ""

# テスト更新の実行
echo "🧪 テスト更新を実行しますか？ (y/n)"
read -r test_response

if [ "$test_response" = "y" ]; then
    echo "開発環境にテスト更新を送信中..."
    eas update --branch development --message "Test update from setup script"
    echo "✅ テスト更新が完了しました"
    echo ""
    echo "確認方法："
    echo "1. Expo Goアプリで以下のURLを開く："
    echo "   exp://u.expo.dev/update/development"
    echo ""
fi

# 完了メッセージ
echo ""
echo "✅ セットアップが完了しました！"
echo ""
echo "次のステップ："
echo "1. GitHub Secretsの設定を完了する"
echo "2. PRを作成して自動プレビューを確認"
echo "3. doc/eas-update-guide.md を参照"
echo ""
echo "Happy coding! 🎉"