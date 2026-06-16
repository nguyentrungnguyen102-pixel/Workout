import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useUserStore } from '../stores/userStore';

export default function LoginPage() {
  const { firebaseUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (firebaseUser) return <Navigate to="/" replace />;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Nhập email và mật khẩu'); return; }
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      const code = err.code || '';
      setError(
        code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-login-credentials'
          ? 'Email hoặc mật khẩu không đúng'
          : code === 'auth/email-already-in-use' ? 'Email đã được sử dụng'
          : code === 'auth/weak-password' ? 'Mật khẩu phải có ít nhất 6 ký tự'
          : code === 'auth/invalid-email' ? 'Email không hợp lệ'
          : code === 'auth/too-many-requests' ? 'Quá nhiều lần thử. Thử lại sau'
          : code === 'auth/network-request-failed' ? 'Lỗi kết nối. Kiểm tra WiFi'
          : `Lỗi: ${code || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">💪</div>
          <h1 className="text-3xl font-black text-text-main">WorkoutTracker</h1>
          <p className="text-text-secondary mt-2 text-sm">Ghi nhận dưới 10 giây. Không có lý do để nghỉ.</p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-3">
          {isSignUp && (
            <input
              className="w-full bg-card border border-border rounded-xl px-4 py-4 text-text-main placeholder-text-muted focus:border-primary transition-colors"
              placeholder="Tên của bạn"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <input
            className="w-full bg-card border border-border rounded-xl px-4 py-4 text-text-main placeholder-text-muted focus:border-primary transition-colors"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full bg-card border border-border rounded-xl px-4 py-4 text-text-main placeholder-text-muted focus:border-primary transition-colors"
            placeholder="Mật khẩu"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />

          {error && <p className="text-danger text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-black text-base py-4 rounded-xl mt-2 disabled:opacity-50 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
          >
            {loading ? 'Đang xử lý...' : isSignUp ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-primary font-semibold text-sm text-center mt-2"
          >
            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
