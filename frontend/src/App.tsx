import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/public/HomePage';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AgentPage from './pages/agent/AgentPage';
import PublicTrackingPage from './pages/public/PublicTrackingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { I18nProvider } from './lib/i18n';

export default function App() {
  return (
    <I18nProvider>
      <AppRoutes />
    </I18nProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/track" element={<PublicTrackingPage />} />
      <Route path="/" element={<HomePage />} />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent"
        element={
          <ProtectedRoute roles={['AGENT']}>
            <AgentPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
