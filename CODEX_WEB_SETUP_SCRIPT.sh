#!/bin/bash

# MiraiCare Codex Web環境設定スクリプト
# ChatGPT CodexのSetup Scriptフィールドにコピペしてください

echo "🚀 MiraiCare環境設定開始..."

# 環境変数設定
export NODE_ENV=development
export npm_config_audit=false
export npm_config_fund=false
export npm_config_prefer_offline=true
export SKIP_PREFLIGHT_CHECK=true
export EXPO_NO_TELEMETRY=1
export JEST_WORKER_ID=1
export NODE_OPTIONS="--max-old-space-size=4096"
export TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}'

echo "✅ 環境変数設定完了"

# Node.js環境確認
echo "📋 Node.js環境確認"
node --version
npm --version

# 依存関係インストール
echo "📦 npm依存関係インストール中..."
npm install --no-audit --prefer-offline

# インストール確認
echo "🔍 インストール確認"
if npx jest --version > /dev/null 2>&1; then
    echo "✅ Jest インストール済み: $(npx jest --version)"
else
    echo "❌ Jest インストール失敗"
    # フォールバック
    npm install -g jest
fi

if npx eslint --version > /dev/null 2>&1; then
    echo "✅ ESLint インストール済み: $(npx eslint --version)"
else
    echo "❌ ESLint インストール失敗"
fi

if npx tsc --version > /dev/null 2>&1; then
    echo "✅ TypeScript インストール済み: $(npx tsc --version)"
else
    echo "❌ TypeScript インストール失敗"
fi

# 品質チェック
echo "🎯 品質チェック実行"
npm run typecheck || echo "⚠️ TypeScriptエラーあり"
npm run lint || echo "⚠️ ESLintエラーあり"

echo "🎉 MiraiCare環境設定完了！"
echo "📋 利用可能なテストスクリプト:"
npm run | grep test || echo "テストスクリプト確認中..."

# 最終確認
echo "✅ セットアップ完了 - タスク開始可能です"