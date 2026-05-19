import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from './types';
import { COLORS } from '../constants/colors';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/auth/LoginScreen';
import WorkoutSummaryModal from '../screens/quickadd/WorkoutSummaryModal';
import ExercisePickerModal from '../screens/quickadd/ExercisePickerModal';
import HistoryDetailScreen from '../screens/history/HistoryDetailScreen';
import AddMetricModal from '../screens/body/AddMetricModal';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="WorkoutSummary"
              component={WorkoutSummaryModal}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="ExercisePicker"
              component={ExercisePickerModal}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="LogDetail" component={HistoryDetailScreen} />
            <Stack.Screen
              name="AddMetric"
              component={AddMetricModal}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
