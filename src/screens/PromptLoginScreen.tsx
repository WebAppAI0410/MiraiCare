import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../types';

interface PromptLoginScreenProps {
  onLogin: () => void;
  onContinueGuest: () => void;
}

const { width } = Dimensions.get('window');

export default function PromptLoginScreen({ onLogin, onContinueGuest }: PromptLoginScreenProps) {
  const benefits = [
    {
      icon: 'save',
      title: 'データを安全に保存',
      description: '健康記録をずっと保管し、\n過去のデータと比較できます',
    },
    {
      icon: 'family-restroom',
      title: 'ご家族と共有',
      description: 'お子様やお孫さんに\n健康状況をお知らせできます',
    },
    {
      icon: 'trending-up',
      title: '詳細な健康レポート',
      description: '週・月・年の変化を\nグラフで分かりやすく表示',
    },
    {
      icon: 'notification-important',
      title: 'かしこいリマインダー',
      description: 'お薬や健康習慣を\n忘れないようにお知らせ',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ヘッダーセクション */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.headerSection}
      >
        <MaterialIcons name="favorite" size={64} color="white" />
        <Text style={styles.headerTitle}>
          MiraiCare 360を{'\n'}もっと活用しませんか？
        </Text>
        <Text style={styles.headerSubtitle}>
          体験版はいかがでしたか？{'\n'}
          完全版では、さらに多くの機能をご利用いただけます
        </Text>
      </LinearGradient>

      {/* 体験版での制限 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>体験版の制限</Text>
        <View style={styles.limitationCard}>
          <MaterialIcons name="block" size={32} color={Colors.warning} />
          <View style={styles.limitationContent}>
            <Text style={styles.limitationText}>
              • データは保存されません{'\n'}
              • ご家族との共有はできません{'\n'}
              • 詳細なレポートは見られません{'\n'}
              • アプリを閉じると記録が消えます
            </Text>
          </View>
        </View>
      </View>

      {/* 完全版のメリット */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>完全版で利用できること</Text>
        {benefits.map((benefit, index) => {
          return (
            <View key={`benefit-${index}`} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <MaterialIcons 
                  name={benefit.icon as any} 
                  size={32} 
                  color={Colors.primary} 
                />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 安心ポイント */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>安心してご利用ください</Text>
        <View style={styles.safetyCard}>
          <MaterialIcons name="security" size={24} color={Colors.success} />
          <Text style={styles.safetyText}>
            <Text style={styles.safetyBold}>完全無料</Text> - 料金は一切かかりません{'\n'}
            <Text style={styles.safetyBold}>簡単登録</Text> - メールアドレスだけで始められます{'\n'}
            <Text style={styles.safetyBold}>いつでも退会</Text> - 不要になったらすぐに削除できます
          </Text>
        </View>
      </View>

      {/* ボタンエリア */}
      <View style={styles.buttonSection}>
        {/* メインボタン */}
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={onLogin}
          accessibilityLabel="無料会員登録"
        >
          <MaterialIcons name="person-add" size={24} color="white" />
          <Text style={styles.loginButtonText}>
            無料会員登録{'\n'}（おすすめ）
          </Text>
        </TouchableOpacity>

        {/* サブボタン */}
        <TouchableOpacity 
          style={styles.guestButton}
          onPress={onContinueGuest}
          accessibilityLabel="体験版を続ける"
        >
          <Text style={styles.guestButtonText}>
            もう少し体験版を使う
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxlarge,
    paddingHorizontal: Spacing.large,
  },
  headerTitle: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: Spacing.large,
    marginBottom: Spacing.medium,
    lineHeight: 40,
  },
  headerSubtitle: {
    fontSize: FontSizes.large,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
  },
  section: {
    paddingHorizontal: Spacing.large,
    marginTop: Spacing.xlarge,
  },
  sectionTitle: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.large,
    textAlign: 'center',
  },
  limitationCard: {
    backgroundColor: Colors.warningLight,
    flexDirection: 'row',
    padding: Spacing.large,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  limitationContent: {
    flex: 1,
    marginLeft: Spacing.medium,
  },
  limitationText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  benefitCard: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    padding: Spacing.large,
    borderRadius: 16,
    marginBottom: Spacing.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    flex: 1,
    marginLeft: Spacing.medium,
  },
  benefitTitle: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  benefitDescription: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  safetyCard: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    padding: Spacing.large,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  safetyText: {
    flex: 1,
    marginLeft: Spacing.medium,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  safetyBold: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  buttonSection: {
    paddingHorizontal: Spacing.large,
    marginTop: Spacing.xlarge,
    gap: Spacing.medium,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.xlarge,
    borderRadius: 16,
    gap: Spacing.medium,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loginButtonText: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.border,
    paddingVertical: Spacing.large,
    paddingHorizontal: Spacing.xlarge,
    borderRadius: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: Spacing.xxlarge,
  },
}); 