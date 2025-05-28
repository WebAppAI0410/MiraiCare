#!/usr/bin/env node

console.log('🔍 ビルド前チェックを開始...\n');

const fs = require('fs');
const path = require('path');

// 必須パッケージのリスト
const requiredPackages = [
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-screens',
  'react-native-safe-area-context',
  '@react-native-masked-view/masked-view',
  'expo-dev-client',
  'expo-notifications',
  'expo-sensors',
  'expo-device',
  'expo-haptics',
  'expo-constants',
  'expo-application'
];

// package.jsonを読み込み
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

console.log('📦 必須パッケージの確認:\n');

let hasError = false;
const missingPackages = [];

requiredPackages.forEach(pkg => {
  if (allDeps[pkg]) {
    console.log(`✅ ${pkg}: ${allDeps[pkg]}`);
  } else {
    console.log(`❌ ${pkg}: 未インストール`);
    missingPackages.push(pkg);
    hasError = true;
  }
});

// アセットファイルの確認
console.log('\n🖼️ アセットファイルの確認:\n');

const requiredAssets = [
  'assets/icon.png',
  'assets/splash.png',
  'assets/adaptive-icon.png',
  'assets/favicon.png'
];

requiredAssets.forEach(asset => {
  const assetPath = path.join(__dirname, '..', asset);
  if (fs.existsSync(assetPath)) {
    console.log(`✅ ${asset}`);
  } else {
    console.log(`❌ ${asset}: 見つかりません`);
    hasError = true;
  }
});

// 設定ファイルの確認
console.log('\n⚙️ 設定ファイルの確認:\n');

const configFiles = [
  'app.config.js',
  'eas.json',
  '.easignore',
  'google-services.json',
  'GoogleService-Info.plist'
];

configFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️ ${file}: 見つかりません（必須ではない場合があります）`);
  }
});

// 結果サマリー
console.log('\n📊 チェック結果:\n');

if (missingPackages.length > 0) {
  console.log('❌ 不足しているパッケージがあります。以下のコマンドを実行してください:\n');
  console.log(`npm install ${missingPackages.join(' ')}\n`);
}

if (!hasError) {
  console.log('✅ すべてのチェックに合格しました！ビルドを開始できます。\n');
  console.log('実行コマンド:');
  console.log('eas build --profile development --platform all\n');
} else {
  console.log('⚠️ 問題を修正してから、再度このスクリプトを実行してください。\n');
  process.exit(1);
}