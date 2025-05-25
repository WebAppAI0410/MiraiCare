import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../types';
import i18n from '../config/i18n';

const { width, height } = Dimensions.get('window');

interface OnboardingStepProps {
  title: string;
  description: string;
  iconName: string;
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({ title, description, iconName }) => (
  <View style={styles.stepContainer}>
    <View style={styles.iconContainer}>
      <Text style={styles.iconText}>{iconName}</Text>
    </View>
    <Text style={styles.stepTitle}>{title}</Text>
    <Text style={styles.stepDescription}>{description}</Text>
  </View>
);

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: i18n.t('onboarding.step1.title'),
      description: i18n.t('onboarding.step1.description'),
      iconName: '📊',
    },
    {
      title: i18n.t('onboarding.step2.title'),
      description: i18n.t('onboarding.step2.description'),
      iconName: '💧',
    },
    {
      title: i18n.t('onboarding.step3.title'),
      description: i18n.t('onboarding.step3.description'),
      iconName: '💭',
    },
    {
      title: i18n.t('onboarding.step4.title'),
      description: i18n.t('onboarding.step4.description'),
      iconName: '👨‍👩‍👧‍👦',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // オンボーディング完了 - ホーム画面へナビゲート
      onComplete();
    }
  };

  const handleSkip = () => {
    // スキップ - ホーム画面へナビゲート
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>{i18n.t('onboarding.title')}</Text>
            <Text style={styles.subtitle}>{i18n.t('onboarding.subtitle')}</Text>
          </View>

          {/* ステップインジケータ */}
          <View style={styles.stepIndicator}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>

          {/* 現在のステップ */}
          <View style={styles.stepWrapper}>
            <OnboardingStep
              title={steps[currentStep].title}
              description={steps[currentStep].description}
              iconName={steps[currentStep].iconName}
            />
          </View>

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            {currentStep < steps.length - 1 ? (
              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  accessibilityRole="button"
                  accessibilityLabel={i18n.t('common.skip')}
                >
                  <Text style={styles.skipButtonText}>{i18n.t('common.skip')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  accessibilityRole="button"
                  accessibilityLabel={i18n.t('common.next')}
                >
                  <Text style={styles.nextButtonText}>{i18n.t('common.next')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={handleNext}
                accessibilityRole="button"
                accessibilityLabel={i18n.t('onboarding.getStarted')}
              >
                <Text style={styles.getStartedButtonText}>
                  {i18n.t('onboarding.getStarted')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.surface,
    textAlign: 'center',
    opacity: 0.9,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: Colors.surface,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  iconText: {
    fontSize: 48,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 18,
    color: Colors.surface,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.9,
  },
  buttonContainer: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 18,
    color: Colors.surface,
    opacity: 0.8,
  },
  nextButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minHeight: 48,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  getStartedButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 200,
  },
  getStartedButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
});

export default OnboardingScreen; 