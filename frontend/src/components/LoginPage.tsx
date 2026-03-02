import { FormEvent, useMemo, useState } from 'react';
import { Bug, LogIn } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fromPath = useMemo(() => {
    const state = location.state as LocationState | null;
    return state?.from?.pathname || '/';
  }, [location.state]);

  if (isAuthenticated) {
    return <Navigate to={fromPath} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const ok = await login(username.trim(), password);
    setIsSubmitting(false);

    if (!ok) {
      setError('ID またはパスワードが正しくありません。');
      return;
    }

    navigate(fromPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200 p-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Bug className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-purple-800">DebugMaster Login</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-1" htmlFor="username">
              ID
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="w-full rounded-lg border border-purple-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-1" htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-purple-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-medium text-pink-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-2.5 font-bold hover:from-purple-600 hover:to-pink-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
