import React from 'react';
import { Text, View } from 'react-native';

interface GreetingProps {
  name?: string;
}

const Greeting: React.FC<GreetingProps> = ({ name = 'Guest' }) => {
  return (
    <View>
      <Text>Hello, {name}!</Text>
    </View>
  );
};

export default Greeting; 