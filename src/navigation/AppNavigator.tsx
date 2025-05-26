import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MoodMirrorScreen from '../screens/MoodMirrorScreen';
import ReminderScreen from '../screens/ReminderScreen';
import { Colors } from '../types';

const Tab = createBottomTabNavigator();

interface AppNavigatorProps {
  showOnboarding: boolean;
  onOnboardingComplete: () => void;
}

export default function AppNavigator({ showOnboarding, onOnboardingComplete }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Activity') {
              iconName = focused ? 'activity' : 'activity-outline';
            } else if (route.name === 'MoodMirror') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Reminder') {
              iconName = focused ? 'notifications' : 'notifications-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.gray,
          tabBarStyle: {
            backgroundColor: Colors.white,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'ホーム' }}
        />
        <Tab.Screen 
          name="Activity" 
          component={ActivityScreen}
          options={{ title: 'アクティビティ' }}
        />
        <Tab.Screen 
          name="MoodMirror" 
          component={MoodMirrorScreen}
          options={{ title: 'ムードミラー' }}
        />
        <Tab.Screen 
          name="Reminder" 
          component={ReminderScreen}
          options={{ title: 'リマインダー' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}