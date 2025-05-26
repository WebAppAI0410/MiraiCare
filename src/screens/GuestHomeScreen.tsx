import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, TouchTargets, Spacing, GuestExperienceData, GUEST_LIMITATIONS } from '../types';

interface GuestHomeScreenProps {
  onPromptLogin: () => void;
}

const { width } = Dimensions.get('window');

export default function GuestHomeScreen({ onPromptLogin }: GuestHomeScreenProps) {
  // ゲスト体験用のサンプルデータ
  const [guestData, setGuestData] = useState<GuestExperienceData>({
    steps: 5420,
    mood: '元気',
    waterIntake: 3,
    medicationTaken: true,
    showPromptLogin: false,
  });

  const [interactionCount, setInteractionCount] = useState(0);

  // 3回操作したらログイン促進
  useEffect(() => {
    if (interactionCount >= 3) {
      setTimeout(() => {
        setGuestData(prev => ({ ...prev, showPromptLogin: true }));
        onPromptLogin();
      }, 1000);
    }
  }, [interactionCount, onPromptLogin]);

  const handleInteraction = (action: string) => {
    setInteractionCount(prev => prev + 1);
    
    // ゲスト制限アラート
    Alert.alert(
      '体験版モード',
      `${action}を体験しました！\n実際にデータを保存するには会員登録が必要です。`,
      [
        { text: 'もう少し体験', style: 'cancel' },
        { text: '今すぐ登録', onPress: onPromptLogin }
      ]
    );
  };

  const handleMoodChange = () => {
    const moods = ['元気', '普通', '疲れ気味', '絶好調'];
    const currentIndex = moods.indexOf(guestData.mood);
    const nextMood = moods[(currentIndex + 1) % moods.length];
    setGuestData(prev => ({ ...prev, mood: nextMood }));
    handleInteraction('気分の記録');
  };

  const handleWaterIntake = () => {
    setGuestData(prev => ({ 
      ...prev, 
      waterIntake: Math.min(prev.waterIntake + 1, 8) 
    }));
    handleInteraction('水分摂取記録');
  };

  const handleMedicationToggle = () => {
    setGuestData(prev => ({ 
      ...prev, 
      medicationTaken: !prev.medicationTaken 
    }));
    handleInteraction('服薬記録');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ゲストモード表示 */}
      <View style={styles.guestBanner}>
        <MaterialIcons name="visibility" size={20} color={Colors.primary} />
        <Text style={styles.guestText}>体験モード - 操作を試してみてください</Text>
      </View>

      {/* 挨拶セクション */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>おはようございます</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('ja-JP')}</Text>
      </View>

      {/* 歩数カード */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.stepsCard}
      >
        <View style={styles.stepsContent}>
          <MaterialIcons name="directions-walk" size={48} color="white" />
          <View style={styles.stepsText}>
            <Text style={styles.stepsNumber}>{guestData.steps.toLocaleString()}</Text>
            <Text style={styles.stepsLabel}>歩</Text>
          </View>
        </View>
        <Text style={styles.stepsSubtext}>今日の歩数（体験データ）</Text>
      </LinearGradient>

      {/* 今日の気分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日の気分</Text>
        <TouchableOpacity 
          style={styles.moodCard}
          onPress={handleMoodChange}
          accessibilityLabel="気分を変更"
        >
          <Text style={styles.moodEmoji}>😊</Text>
          <Text style={styles.moodText}>{guestData.mood}</Text>
          <Text style={styles.moodHint}>タップして変更</Text>
        </TouchableOpacity>
      </View>

      {/* 今日の記録 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日の記録</Text>
        
        {/* 水分摂取 */}
        <TouchableOpacity 
          style={styles.recordCard}
          onPress={handleWaterIntake}
        >
          <MaterialIcons name="local-drink" size={32} color={Colors.primary} />
          <View style={styles.recordContent}>
            <Text style={styles.recordTitle}>水分摂取</Text>
            <Text style={styles.recordValue}>{guestData.waterIntake}/8 杯</Text>
          </View>
          <MaterialIcons name="add-circle" size={24} color={Colors.primary} />
        </TouchableOpacity>

        {/* 服薬記録 */}
        <TouchableOpacity 
          style={styles.recordCard}
          onPress={handleMedicationToggle}
        >
          <MaterialIcons name="medication" size={32} color={Colors.primary} />
          <View style={styles.recordContent}>
            <Text style={styles.recordTitle}>お薬</Text>
            <Text style={styles.recordValue}>
              {guestData.medicationTaken ? '服用済み' : '未服用'}
            </Text>
          </View>
          <MaterialIcons 
            name={guestData.medicationTaken ? "check-circle" : "radio-button-unchecked"} 
            size={24} 
            color={guestData.medicationTaken ? Colors.success : Colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* 体験版制限の説明 */}
      <View style={styles.limitationsCard}>
        <MaterialIcons name="info" size={24} color={Colors.warning} />
        <View style={styles.limitationsContent}>
          <Text style={styles.limitationsTitle}>体験版の制限</Text>
          <Text style={styles.limitationsText}>
            • データは保存されません{'\n'}
            • 詳細レポートは利用できません{'\n'}
            • 家族との共有はできません
          </Text>
        </View>
      </View>

      {/* 登録促進ボタン */}
      <TouchableOpacity 
        style={styles.registerButton}
        onPress={onPromptLogin}
      >
        <Text style={styles.registerButtonText}>
          完全版を利用する（無料会員登録）
        </Text>
        <MaterialIcons name="arrow-forward" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.medium,
    marginHorizontal: Spacing.medium,
    marginTop: Spacing.medium,
    borderRadius: 12,
    gap: Spacing.small,
  },
  guestText: {
    fontSize: FontSizes.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  greetingSection: {
    padding: Spacing.large,
    alignItems: 'center',
  },
  greeting: {
    fontSize: FontSizes.xxxlarge,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  date: {
    fontSize: FontSizes.large,
    color: Colors.textSecondary,
  },
  stepsCard: {
    marginHorizontal: Spacing.medium,
    padding: Spacing.large,
    borderRadius: 20,
    marginBottom: Spacing.large,
  },
  stepsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepsText: {
    alignItems: 'flex-end',
  },
  stepsNumber: {
    fontSize: FontSizes.numbers,
    fontWeight: 'bold',
    color: 'white',
  },
  stepsLabel: {
    fontSize: FontSizes.large,
    color: 'white',
    marginTop: -8,
  },
  stepsSubtext: {
    fontSize: FontSizes.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.small,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: Spacing.medium,
    marginBottom: Spacing.large,
  },
  sectionTitle: {
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
  },
  moodCard: {
    backgroundColor: 'white',
    padding: Spacing.large,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moodEmoji: {
    fontSize: 48,
    marginBottom: Spacing.small,
  },
  moodText: {
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  moodHint: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  recordCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.large,
    borderRadius: 16,
    marginBottom: Spacing.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordContent: {
    flex: 1,
    marginLeft: Spacing.medium,
  },
  recordTitle: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  recordValue: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  limitationsCard: {
    backgroundColor: Colors.warningLight,
    flexDirection: 'row',
    padding: Spacing.large,
    marginHorizontal: Spacing.medium,
    borderRadius: 16,
    marginBottom: Spacing.large,
  },
  limitationsContent: {
    flex: 1,
    marginLeft: Spacing.medium,
  },
  limitationsTitle: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: Spacing.small,
  },
  limitationsText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.large,
    marginHorizontal: Spacing.medium,
    borderRadius: 16,
    gap: Spacing.medium,
  },
  registerButtonText: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacing: {
    height: Spacing.xxlarge,
  },
}); 