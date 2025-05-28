import React from 'react';
// レスポンシブ対応版のホーム画面を使用
import { ResponsiveElderlyHomeScreen } from './ResponsiveElderlyHomeScreen';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

// レスポンシブ対応版をエクスポート
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return <ResponsiveElderlyHomeScreen navigation={navigation} />;
};

export default HomeScreen;