import { useEffect, Component } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { useUserStore } from './stores/userStore';

import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import Layout from './components/Layout';
import QuickAddPage from './pages/QuickAddPage';
import LogDetailPage from './pages/LogDetailPage';
import DayDetailPage from './pages/DayDetailPage';
import BodyPage from './pages/BodyPage';
import StatsPage from './pages/StatsPage';
import ExerciseProgressPage from './pages/ExerciseProgressPage';
import SettingsPage from './pages/SettingsPage';
import ProgramsPage from './pages/ProgramsPage';
import ProgramDetailPage from './pages/ProgramDetailPage';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-card border border-danger/30 rounded-2xl p-6">
            <p className="text-danger font-black text-lg mb-2">Lỗi khởi động app</p>
            <p className="text-text-secondary text-sm font-mono break-all">{err.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<AuthGuard><OnboardingPage /></AuthGuard>} />
          <Route element={<AuthGuard><Layout /></AuthGuard>}>
            <Route index element={<QuickAddPage />} />
            {/* /history merged into /stats (W4) — path 'history' (exact) does
                not match 'history/day/:date' or 'history/:logId' in v7, so
                this redirect can't swallow those still-live sub-routes. */}
            <Route path="history" element={<Navigate to="/stats" replace />} />
            <Route path="history/day/:date" element={<DayDetailPage />} />
            <Route path="history/:logId" element={<LogDetailPage />} />
            <Route path="body" element={<Navigate to="/settings/body" replace />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="stats/exercise/:presetId" element={<ExerciseProgressPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/body" element={<BodyPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="programs/:id" element={<ProgramDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
