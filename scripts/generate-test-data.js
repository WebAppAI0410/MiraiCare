/**
 * テストデータ生成スクリプト
 * 
 * 使用方法:
 * 1. Firebase Adminの初期化が必要
 * 2. node scripts/generate-test-data.js <userId>
 */

const admin = require('firebase-admin');

// Firebase Admin初期化（環境変数または直接設定）
const serviceAccount = require('../miraicare-360-mvp-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'miraicare-360-mvp'
});

const db = admin.firestore();

// 日付生成ヘルパー
function getDateString(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function getTimestamp(daysAgo = 0, hours = 12) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, 0, 0, 0);
  return date.toISOString();
}

// テストデータ生成関数
async function generateTestData(userId) {
  console.log(`ユーザー ${userId} のテストデータを生成中...`);

  try {
    // 1. ユーザープロファイル
    await db.collection('userProfiles').doc(userId).set({
      userId,
      email: 'test@example.com',
      fullName: 'テスト太郎',
      age: 75,
      gender: 'male',
      height: 165,
      weight: 60,
      emergencyContact: '090-1234-5678',
      medicalHistory: ['高血圧', '糖尿病'],
      medications: ['降圧剤', 'インスリン'],
      createdAt: getTimestamp(30),
      updatedAt: getTimestamp(0)
    });

    // 2. 30日分の歩数データ
    const stepDataBatch = db.batch();
    for (let i = 0; i < 30; i++) {
      const steps = 3000 + Math.floor(Math.random() * 7000); // 3000-10000歩
      const docRef = db.collection('stepData').doc();
      stepDataBatch.set(docRef, {
        userId,
        date: getDateString(i),
        steps,
        timestamp: getTimestamp(i, 20),
        distance: (steps * 0.7) / 1000, // km
        calories: Math.floor(steps * 0.04)
      });
    }
    await stepDataBatch.commit();
    console.log('✓ 歩数データ生成完了');

    // 3. 30日分のムードデータ
    const moodDataBatch = db.batch();
    const moods = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'];
    const moodLabels = ['とても良い', '良い', '普通', '悪い', 'とても悪い'];
    
    for (let i = 0; i < 30; i++) {
      const moodIndex = Math.floor(Math.random() * moods.length);
      const docRef = db.collection('moodData').doc();
      moodDataBatch.set(docRef, {
        userId,
        mood: moods[moodIndex],
        moodLabel: moodLabels[moodIndex],
        intensity: Math.floor(Math.random() * 5) + 1,
        timestamp: getTimestamp(i, 10),
        note: i % 3 === 0 ? '今日は調子が良い' : null
      });
    }
    await moodDataBatch.commit();
    console.log('✓ ムードデータ生成完了');

    // 4. リスクアセスメントデータ（週1回）
    const riskBatch = db.batch();
    for (let i = 0; i < 5; i++) {
      const weekAgo = i * 7;
      const riskScore = 20 + Math.floor(Math.random() * 60);
      let riskLevel = 'low';
      if (riskScore >= 70) riskLevel = 'high';
      else if (riskScore >= 40) riskLevel = 'medium';
      
      const docRef = db.collection('riskAssessments').doc();
      riskBatch.set(docRef, {
        userId,
        assessmentDate: getDateString(weekAgo),
        overallRiskScore: riskScore,
        overallRiskLevel: riskLevel,
        physicalRisk: Math.floor(Math.random() * 100),
        mentalRisk: Math.floor(Math.random() * 100),
        socialRisk: Math.floor(Math.random() * 100),
        timestamp: getTimestamp(weekAgo)
      });
    }
    await riskBatch.commit();
    console.log('✓ リスクアセスメントデータ生成完了');

    // 5. バイタルデータ（心拍数）
    const vitalBatch = db.batch();
    for (let i = 0; i < 30; i++) {
      const docRef = db.collection('vitalData').doc();
      vitalBatch.set(docRef, {
        userId,
        heartRate: 60 + Math.floor(Math.random() * 40), // 60-100
        bloodPressureHigh: 110 + Math.floor(Math.random() * 40), // 110-150
        bloodPressureLow: 60 + Math.floor(Math.random() * 30), // 60-90
        bodyTemperature: 36 + Math.random(), // 36.0-37.0
        timestamp: getTimestamp(i, 8)
      });
    }
    await vitalBatch.commit();
    console.log('✓ バイタルデータ生成完了');

    // 6. リマインダー
    const reminderBatch = db.batch();
    const reminderTypes = ['water', 'medication'];
    for (let i = 0; i < 5; i++) {
      const docRef = db.collection('reminders').doc();
      reminderBatch.set(docRef, {
        userId,
        type: reminderTypes[i % 2],
        title: i % 2 === 0 ? '水分補給' : '薬の服用',
        scheduledTime: `${8 + i * 3}:00`, // 8:00, 11:00, 14:00...
        completed: false,
        enabled: true,
        createdAt: getTimestamp(10)
      });
    }
    await reminderBatch.commit();
    console.log('✓ リマインダーデータ生成完了');

    console.log('\n✅ すべてのテストデータの生成が完了しました！');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// メイン実行
const userId = process.argv[2];
if (!userId) {
  console.error('使用方法: node generate-test-data.js <userId>');
  process.exit(1);
}

generateTestData(userId).then(() => {
  console.log('処理完了');
  process.exit(0);
});