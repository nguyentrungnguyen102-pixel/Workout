import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const REMINDER_ID = 'workout_daily_reminder';

function isExpoGoStoreClient(): boolean {
  return (Constants as any).executionEnvironment === 'storeClient';
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!Device.isDevice || isExpoGoStoreClient()) return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleWorkoutReminder(time: string, enabled: boolean): Promise<void> {
  try {
    await cancelWorkoutReminders();
    if (!enabled) return;
    if (!Device.isDevice || isExpoGoStoreClient()) return;

    const granted = await requestNotificationPermission();
    if (!granted) return;

    const [hourStr, minStr] = (time || '07:30').split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);
    if (isNaN(hour) || isNaN(minute)) return;

    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: {
        title: '💪 Đến giờ tập rồi!',
        body: 'Đừng quên buổi tập hôm nay. Chỉ 10 phút để bắt đầu!',
        sound: 'default',
        data: { type: 'workout_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      } as any,
    });
  } catch {
    // Notifications not available in this environment — safe to ignore
  }
}

export async function cancelWorkoutReminders(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  } catch {
    // Notification may not exist yet — safe to ignore
  }
}
