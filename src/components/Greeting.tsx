import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '../types';

interface GreetingProps {
  name: string;
}

const Greeting: React.FC<GreetingProps> = ({ name }) => {
  const displayName = name.trim() || '';
  const greetingText = displayName 
    ? `こんにちは、${displayName}さん！` 
    : 'こんにちは！';

  return (
    <View style={styles.container}>
      <Text 
        style={styles.text}
        accessibilityLabel="挨拶メッセージ"
        accessibilityRole="text"
      >
        {greetingText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  text: {
    fontSize: FontSizes.large,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});

export default Greeting;