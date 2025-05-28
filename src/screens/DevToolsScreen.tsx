import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, FontSizes, Spacing } from '../types';
import { auth, db } from '../config/firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';

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

export const DevToolsScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const generateTestData = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('エラー', 'ログインしてください');
      return;
    }

    Alert.alert(
      'テストデータ生成',
      '30日分のテストデータを生成しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '生成する', onPress: () => startDataGeneration(user.uid) }
      ]
    );
  };

  const startDataGeneration = async (userId: string) => {
    setLoading(true);
    setProgress('データ生成を開始します...');

    try {
      // 1. ユーザープロファイル
      setProgress('ユーザープロファイルを作成中...');
      await setDoc(doc(db, 'userProfiles', userId), {
        userId,
        email: auth.currentUser?.email || 'test@example.com',
        fullName: 'テストユーザー',
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
      setProgress('歩数データを生成中...');
      for (let i = 0; i < 30; i++) {
        const steps = 3000 + Math.floor(Math.random() * 7000);
        await addDoc(collection(db, 'stepData'), {
          userId,
          date: getDateString(i),
          steps,
          timestamp: getTimestamp(i, 20),
          distance: (steps * 0.7) / 1000,
          calories: Math.floor(steps * 0.04)
        });
      }

      // 3. 30日分のムードデータ
      setProgress('ムードデータを生成中...');
      const moods = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'];
      const moodLabels = ['とても良い', '良い', '普通', '悪い', 'とても悪い'];
      
      for (let i = 0; i < 30; i++) {
        const moodIndex = Math.floor(Math.random() * moods.length);
        await addDoc(collection(db, 'moodData'), {
          userId,
          mood: moods[moodIndex],
          moodLabel: moodLabels[moodIndex],
          intensity: Math.floor(Math.random() * 5) + 1,
          timestamp: getTimestamp(i, 10),
          note: i % 3 === 0 ? '今日は調子が良い' : null
        });
      }

      // 4. リスクアセスメントデータ（週1回）
      setProgress('リスクアセスメントデータを生成中...');
      for (let i = 0; i < 5; i++) {
        const weekAgo = i * 7;
        const riskScore = 20 + Math.floor(Math.random() * 60);
        let riskLevel = 'low';
        if (riskScore >= 70) riskLevel = 'high';
        else if (riskScore >= 40) riskLevel = 'medium';
        
        await addDoc(collection(db, 'riskAssessments'), {
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

      // 5. バイタルデータ
      setProgress('バイタルデータを生成中...');
      for (let i = 0; i < 30; i++) {
        await addDoc(collection(db, 'vitalData'), {
          userId,
          heartRate: 60 + Math.floor(Math.random() * 40),
          bloodPressureHigh: 110 + Math.floor(Math.random() * 40),
          bloodPressureLow: 60 + Math.floor(Math.random() * 30),
          bodyTemperature: 36 + Math.random(),
          timestamp: getTimestamp(i, 8)
        });
      }

      // 6. リマインダー
      setProgress('リマインダーデータを生成中...');
      const reminderTypes = ['water', 'medication'];
      for (let i = 0; i < 5; i++) {
        await addDoc(collection(db, 'reminders'), {
          userId,
          type: reminderTypes[i % 2],
          title: i % 2 === 0 ? '水分補給' : '薬の服用',
          scheduledTime: `${8 + i * 3}:00`,
          completed: false,
          enabled: true,
          createdAt: getTimestamp(10)
        });
      }

      setProgress('');
      Alert.alert('完了', 'テストデータの生成が完了しました！');
    } catch (error) {
      console.error('データ生成エラー:', error);
      Alert.alert('エラー', 'データ生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('エラー', 'ログインしてください');
      return;
    }

    Alert.alert(
      '警告',
      'すべてのデータを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除する', 
          style: 'destructive',
          onPress: () => Alert.alert('未実装', 'データ削除機能は未実装です')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>開発者ツール</Text>
        <Text style={styles.subtitle}>テスト用の機能です</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={generateTestData}
            >
              <Text style={styles.buttonText}>テストデータを生成</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={clearAllData}
            >
              <Text style={styles.buttonText}>すべてのデータを削除</Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>生成されるデータ：</Text>
              <Text style={styles.infoText}>• 30日分の歩数データ</Text>
              <Text style={styles.infoText}>• 30日分のムードデータ</Text>
              <Text style={styles.infoText}>• 5週間分のリスクアセスメント</Text>
              <Text style={styles.infoText}>• 30日分のバイタルデータ</Text>
              <Text style={styles.infoText}>• 5件のリマインダー</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.screenPadding,
  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  button: {
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    fontSize: FontSizes.button,
    fontWeight: 'bold',
    color: Colors.surface,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  progressText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  infoContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.xl,
  },
  infoTitle: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
});