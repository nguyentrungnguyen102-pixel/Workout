import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useUserStore } from './stores/userStore';

import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import Layout from './components/Layout';
import QuickAddPage from './pages/QuickAddPage';
import HistoryPage from './pages/HistoryPage';
import LogDetailPage from './pages/LogDetailPage';
import BodyPage from './pages/BodyPage';
import StatsPage from './pages/StatsPage';
import ExerciseProgressPage from './pages/ExerciseProgressPage';
import SettingsPage from './pages/SettingsPage';
import ProgramsPage from './pages/ProgramsPage';
import ProgramDetailPage from './pages/ProgramDetailPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useUserStore();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { setFirebaseUser, loadProfile } = useUserStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) loadProfile(user.uid);
    });
    return unsub;
  }, [setFirebaseUser, loadProfile]);

  return (
    <BrowserRouter basename="/Workout">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<AuthGuard><OnboardingPage /></AuthGuard>} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<QuickAddPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:logId" element={<LogDetailPage />} />
          <Route path="body" element={<BodyPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="stats/exercise/:presetId" element={<ExerciseProgressPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="programs/:id" element={<ProgramDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
