#!/bin/bash

# Firebase デプロイスクリプト
# 使用方法: ./scripts/deploy-firebase.sh [all|functions|firestore|hosting]

set -e

echo "🚀 Firebase デプロイを開始します..."

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# デプロイタイプを確認
DEPLOY_TYPE=${1:-all}

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# Firebase CLIがインストールされているか確認
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLIがインストールされていません${NC}"
    echo "以下のコマンドでインストールしてください:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# ログイン状態を確認
echo -e "${YELLOW}📋 Firebaseログイン状態を確認中...${NC}"
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Firebaseにログインしていません${NC}"
    echo "以下のコマンドでログインしてください:"
    echo "firebase login"
    exit 1
fi

# 現在のプロジェクトを表示
CURRENT_PROJECT=$(firebase use)
echo -e "${GREEN}✅ 現在のプロジェクト: $CURRENT_PROJECT${NC}"

# デプロイ実行
case $DEPLOY_TYPE in
    "all")
        echo -e "${YELLOW}🔧 すべてのサービスをデプロイします${NC}"
        
        # Functions のビルド
        echo -e "${YELLOW}📦 Cloud Functions をビルド中...${NC}"
        cd functions
        npm run build
        cd ..
        
        # すべてデプロイ
        firebase deploy
        ;;
        
    "functions")
        echo -e "${YELLOW}🔧 Cloud Functions をデプロイします${NC}"
        
        # Functions のビルド
        echo -e "${YELLOW}📦 Cloud Functions をビルド中...${NC}"
        cd functions
        npm run build
        cd ..
        
        # Functions のみデプロイ
        firebase deploy --only functions
        ;;
        
    "firestore")
        echo -e "${YELLOW}🔧 Firestore ルールとインデックスをデプロイします${NC}"
        firebase deploy --only firestore
        ;;
        
    "rules")
        echo -e "${YELLOW}🔧 Firestore ルールのみデプロイします${NC}"
        firebase deploy --only firestore:rules
        ;;
        
    "indexes")
        echo -e "${YELLOW}🔧 Firestore インデックスのみデプロイします${NC}"
        firebase deploy --only firestore:indexes
        ;;
        
    *)
        echo -e "${RED}❌ 無効なデプロイタイプ: $DEPLOY_TYPE${NC}"
        echo "使用可能なオプション: all, functions, firestore, rules, indexes"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ デプロイが完了しました！${NC}"

# デプロイ後の確認
echo -e "${YELLOW}📋 デプロイ状況:${NC}"
firebase functions:list
echo ""
echo -e "${YELLOW}🔗 Firebase Console:${NC}"
echo "https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID"