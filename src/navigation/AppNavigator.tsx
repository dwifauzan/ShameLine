import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { t } from '../i18n';
import TasksScreen from '../screens/TasksScreen';
import HallOfShameScreen from '../screens/HallOfShameScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1a1a2e',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarLabel: t('tabs.tasks'),
          tabBarIcon: () => <TabIcon emoji="📋" />,
        }}
      />
      <Tab.Screen
        name="HallOfShame"
        component={HallOfShameScreen}
        options={{
          tabBarLabel: t('tabs.hallOfShame'),
          tabBarIcon: () => <TabIcon emoji="😱" />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: t('tabs.stats'),
          tabBarIcon: () => <TabIcon emoji="📊" />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: () => <TabIcon emoji="⚙️" />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
