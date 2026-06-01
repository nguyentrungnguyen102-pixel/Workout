import { useEffect } from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { auth } from '../services/firebase';
import { useUserStore } from '../stores/userStore';
import { saveFcmToken } from '../services/userService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications(uid: string): Promise<void> {
  if (!Device.isDevice) return;
  // expo-notifications is not available in Expo Go (SDK 53+)
  if ((Constants as any).executionEnvironment === 'storeClient') return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('workout_reminders', {
        name: 'Nhắc nhở tập luyện',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    const token = await Notifications.getDevicePushTokenAsync();
    if (token?.data) {
      await saveFcmToken(uid, token.data);
    }
  } catch {
    // FCM not configured or device token unavailable — silently ignore
  }
}

export function useAuth() {
  const { firebaseUser, profile, loading, setFirebaseUser, loadProfile } = useUserStore();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsub = onAuthStateChanged(auth, async (user: any) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile(user.uid);
        registerForPushNotifications(user.uid);
      }
    });
    return unsub;
  }, []);

  return { user: firebaseUser, profile, loading };
}
