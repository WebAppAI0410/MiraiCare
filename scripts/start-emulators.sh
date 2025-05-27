#!/bin/bash

# Firebase エミュレーター起動スクリプト
# 使用方法: ./scripts/start-emulators.sh

set -e

echo "🚀 Firebase エミュレーターを起動します..."

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# Firebase CLIがインストールされているか確認
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLIがインストールされていません${NC}"
    echo "以下のコマンドでインストールしてください:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Functions の依存関係チェック
if [ ! -d "functions/node_modules" ]; then
    echo -e "${YELLOW}📦 Functions の依存関係をインストール中...${NC}"
    cd functions
    npm install
    cd ..
fi

# エミュレーターを起動
echo -e "${GREEN}✅ エミュレーターを起動中...${NC}"
echo ""
echo -e "${YELLOW}エミュレーターURL:${NC}"
echo "  Firestore: http://localhost:8080"
echo "  Functions: http://localhost:5001"
echo "  Emulator UI: http://localhost:4000"
echo ""

firebase emulators:start

echo -e "${GREEN}✅ エミュレーターが終了しました${NC}"