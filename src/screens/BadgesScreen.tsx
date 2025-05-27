import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../types';
import { auth } from '../config/firebase';
import { getUserBadges } from '../services/firestoreService';

interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isUnlocked: boolean;
  unlockedAt?: Date;
  condition: string;
}

export default function BadgesScreen() {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user');
        return;
      }

      // Firebaseからユーザーのバッジデータを取得
      const userBadges = await getUserBadges(currentUser.uid);
      const unlockedBadgeIds = new Set(userBadges.map(b => b.id));

      // 全バッジの定義（本来はFirebaseのバッジマスターコレクションから取得）
      const allBadges: Badge[] = [
        {
          id: 'badge-1',
          name: '初回ログイン',
          description: 'MiraiCareを初めて使用しました',
          iconName: 'star',
          isUnlocked: unlockedBadgeIds.has('badge-1'),
          unlockedAt: userBadges.find(b => b.id === 'badge-1')?.unlockedAt ? 
            new Date(userBadges.find(b => b.id === 'badge-1')!.unlockedAt!) : undefined,
          condition: 'アプリに初回ログイン'
        },
        {
          id: 'badge-2',
          name: '健康管理マスター',
          description: '7日連続でバイタルデータを記録',
          iconName: 'fitness',
          isUnlocked: unlockedBadgeIds.has('badge-2'),
          unlockedAt: userBadges.find(b => b.id === 'badge-2')?.unlockedAt ? 
            new Date(userBadges.find(b => b.id === 'badge-2')!.unlockedAt!) : undefined,
          condition: '7日連続でバイタルデータを記録'
        },
        {
          id: 'badge-3',
          name: 'ムードケア専門家',
          description: 'ムードミラーを30回使用',
          iconName: 'heart',
          isUnlocked: unlockedBadgeIds.has('badge-3'),
          unlockedAt: userBadges.find(b => b.id === 'badge-3')?.unlockedAt ? 
            new Date(userBadges.find(b => b.id === 'badge-3')!.unlockedAt!) : undefined,
          condition: 'ムードミラーを30回使用'
        },
        {
          id: 'badge-4',
          name: '歩数チャンピオン',
          description: '1日10,000歩を達成',
          iconName: 'walk',
          isUnlocked: unlockedBadgeIds.has('badge-4'),
          unlockedAt: userBadges.find(b => b.id === 'badge-4')?.unlockedAt ? 
            new Date(userBadges.find(b => b.id === 'badge-4')!.unlockedAt!) : undefined,
          condition: '1日10,000歩を達成'
        },
        {
          id: 'badge-5',
          name: '服薬管理エキスパート',
          description: '30日連続で服薬記録を完了',
          iconName: 'medical',
          isUnlocked: unlockedBadgeIds.has('badge-5'),
          unlockedAt: userBadges.find(b => b.id === 'badge-5')?.unlockedAt ? 
            new Date(userBadges.find(b => b.id === 'badge-5')!.unlockedAt!) : undefined,
          condition: '30日連続で服薬記録を完了'
        },
        {
          id: 'badge-6',
          name: 'コミュニティヒーロー',
          description: '他のユーザーを5人サポート',
          iconName: 'people',
          isUnlocked: unlockedBadgeIds.has('badge-6'),
          unlockedAt: userBadges.find(b => b.id === 'badge-6')?.unlockedAt ? 
            new Date(userBadges.find(b => b.id === 'badge-6')!.unlockedAt!) : undefined,
          condition: '他のユーザーを5人サポート'
        }
      ];
      
      setBadges(allBadges);
      
    } catch (error) {
      console.error('バッジデータの取得エラー:', error);
      Alert.alert(
        'データ取得エラー',
        'バッジデータの取得に失敗しました。',
        [{ text: 'OK' }]
      );
    }
  };

  const renderBadge = (badge: Badge) => (
    <TouchableOpacity
      key={badge.id}
      style={[
        styles.badgeCard,
        badge.isUnlocked ? styles.unlockedCard : styles.lockedCard
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${badge.name}バッジ。${badge.description}`}
      accessibilityHint={badge.isUnlocked ? '獲得済み' : '未獲得'}
    >
      <View style={styles.badgeHeader}>
        <View style={[
          styles.iconContainer,
          badge.isUnlocked ? styles.unlockedIcon : styles.lockedIcon
        ]}>
          <Ionicons
            name={badge.iconName}
            size={32}
            color={badge.isUnlocked ? Colors.white : Colors.gray}
          />
        </View>
        <View style={styles.badgeInfo}>
          <Text style={[
            styles.badgeName,
            badge.isUnlocked ? styles.unlockedText : styles.lockedText
          ]}>
            {badge.name}
          </Text>
          <Text style={[
            styles.badgeDescription,
            badge.isUnlocked ? styles.unlockedDescription : styles.lockedDescription
          ]}>
            {badge.description}
          </Text>
        </View>
        {badge.isUnlocked && (
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          </View>
        )}
      </View>
      
      <View style={styles.conditionContainer}>
        <Text style={styles.conditionLabel}>獲得条件:</Text>
        <Text style={styles.conditionText}>{badge.condition}</Text>
      </View>
      
      {badge.isUnlocked && badge.unlockedAt && (
        <View style={styles.unlockedAtContainer}>
          <Text style={styles.unlockedAtText}>
            獲得日: {badge.unlockedAt.toLocaleDateString('ja-JP')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const unlockedBadges = badges.filter(badge => badge.isUnlocked);
  const lockedBadges = badges.filter(badge => !badge.isUnlocked);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>バッジコレクション</Text>
        <Text style={styles.subtitle}>
          獲得バッジ: {unlockedBadges.length} / {badges.length}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(unlockedBadges.length / badges.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((unlockedBadges.length / badges.length) * 100)}% 完了
        </Text>
      </View>

      {unlockedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>獲得済みバッジ</Text>
          {unlockedBadges.map(renderBadge)}
        </View>
      )}

      {lockedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>未獲得バッジ</Text>
          {lockedBadges.map(renderBadge)}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          新しいバッジを獲得してMiraiCareを楽しみましょう！
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  badgeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  unlockedCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  lockedCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.lightGray,
    opacity: 0.7,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unlockedIcon: {
    backgroundColor: Colors.primary,
  },
  lockedIcon: {
    backgroundColor: Colors.lightGray,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unlockedText: {
    color: Colors.text,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  badgeDescription: {
    fontSize: 14,
  },
  unlockedDescription: {
    color: Colors.textSecondary,
  },
  lockedDescription: {
    color: Colors.gray,
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  conditionContainer: {
    marginBottom: 8,
  },
  conditionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  conditionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  unlockedAtContainer: {
    marginTop: 4,
  },
  unlockedAtText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});