import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useUserStore } from '../stores/userStore';

export function useAuth() {
  const { firebaseUser, profile, loading, setFirebaseUser, loadProfile } = useUserStore();

  useEffect(() => {
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
