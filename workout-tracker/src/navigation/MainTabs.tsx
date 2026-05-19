import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { COLORS } from '../constants/colors';
import QuickAddScreen from '../screens/quickadd/QuickAddScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import BodyTrackingScreen from '../screens/body/BodyTrackingScreen';
import StatsScreen from '../screens/stats/StatsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  QuickAdd: ['barbell', 'barbell-outline'],
  History: ['calendar', 'calendar-outline'],
  Body: ['body', 'body-outline'],
  Stats: ['stats-chart', 'stats-chart-outline'],
  Settings: ['settings', 'settings-outline'],
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: string } }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          const [active, inactive] = ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="QuickAdd" component={QuickAddScreen} options={{ title: 'Quick Add' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Lịch sử' }} />
      <Tab.Screen name="Body" component={BodyTrackingScreen} options={{ title: 'Cơ thể' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Thống kê' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
    </Tab.Navigator>
  );
}
