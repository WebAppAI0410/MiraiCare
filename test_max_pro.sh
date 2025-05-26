#!/bin/bash

echo "🔍 Claude Max Pro動作確認テスト"
echo "================================"

echo "📋 1. Claude CLIバージョン確認"
claude --version

echo -e "\n📋 2. 設定確認"
claude config list

echo -e "\n📋 3. 簡単なタスク実行テスト"
claude --print "Hello Max Pro! 簡単な計算: 2+2は？"

echo -e "\n📋 4. 中程度のタスク実行テスト"
claude --print "TypeScriptでReact Nativeの簡単なコンポーネントを作成してください"

echo -e "\n📋 5. Development Partner Program確認"
if claude --help | grep -q "Development Partner"; then
    echo "✅ Development Partner Programアクセス確認済み"
else
    echo "❌ Development Partner Programアクセス未確認"
fi

echo -e "\n🎯 テスト完了"