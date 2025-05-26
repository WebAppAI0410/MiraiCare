#!/bin/bash

# MiraiCare Codex環境セットアップスクリプト
# Codex Web環境でのnpm依存関係インストール

echo "🚀 MiraiCare Codex環境セットアップ開始..."

# Node.jsバージョン確認
echo "📋 Node.js環境確認"
node --version
npm --version

# 依存関係のインストール
echo "📦 npm依存関係インストール中..."
npm install --no-audit --prefer-offline

# インストール確認
echo "✅ インストール確認"
if command -v jest &> /dev/null; then
    echo "✅ Jest インストール済み"
    jest --version
else
    echo "❌ Jest インストール失敗"
fi

if command -v eslint &> /dev/null; then
    echo "✅ ESLint インストール済み"
    eslint --version
else
    echo "❌ ESLint インストール失敗"
fi

# TypeScript確認
if command -v tsc &> /dev/null; then
    echo "✅ TypeScript インストール済み"
    tsc --version
else
    echo "❌ TypeScript インストール失敗"
fi

echo "🎯 セットアップ完了！テスト実行可能です。"

# テストスクリプト確認
echo "📋 利用可能なテストスクリプト:"
npm run | grep test || echo "テストスクリプトなし"