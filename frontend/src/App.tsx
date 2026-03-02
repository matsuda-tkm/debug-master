import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import ChallengeEditor from './ChallengeEditor';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import { AdminGuard } from './components/guards/AdminGuard';
import { AuthGuard } from './components/guards/AuthGuard';
import ThemeSelection from './components/ThemeSelection';
import { API_ENDPOINTS } from './config/api';


function App() {
  useEffect(() => {
    (async () => {
      const res = await fetch(API_ENDPOINTS.HEALTH);
      const data = await res.json();
      console.log(data);
    })();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <ThemeSelection />
          </AuthGuard>
        }
      />
      <Route
        path="/challenge/:themeId"
        element={
          <AuthGuard>
            <ChallengeEditor />
          </AuthGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminPage />
          </AdminGuard>
        }
      />
    </Routes>
  );
}

export default App;
