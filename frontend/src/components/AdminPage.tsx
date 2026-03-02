import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-purple-700 font-semibold hover:text-purple-900 transition"
          >
            ← ホームへ戻る
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-bold text-white hover:bg-pink-600 transition"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto rounded-2xl border border-purple-200 bg-white/90 p-8 shadow-lg text-center">
          <ShieldCheck className="mx-auto w-12 h-12 text-purple-600 mb-4" />
          <h1 className="text-2xl font-bold text-purple-800 mb-2">管理画面</h1>
          <p className="text-purple-700">管理機能はこの画面に追加されます。</p>
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
