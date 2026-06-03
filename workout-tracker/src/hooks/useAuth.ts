import { useEffect } from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { auth } from '../services/firebase';
import { useUserStore } from '../stores/userStore';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (!Device.isDevice) return;
  if ((Constants as any).executionEnvironment === 'storeClient') return;
  try {
    await Notifications.setNotificationChannelAsync('workout_reminders', {
      name: 'Nhắc nhở tập luyện',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  } catch {
    // Channel setup failed — local reminders still work without it
  }
}

export function useAuth() {
  const { firebaseUser, profile, loading, setFirebaseUser, loadProfile } = useUserStore();

  useEffect(() => {
    setupAndroidNotificationChannel();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsub = onAuthStateChanged(auth, async (user: any) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile(user.uid);
      }
    });
    return unsub;
  }, []);

  return { user: firebaseUser, profile, loading };
}
