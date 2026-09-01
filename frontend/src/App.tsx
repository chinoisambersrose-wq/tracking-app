import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/public/HomePage';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AgentPage from './pages/agent/AgentPage';
import PublicTrackingPage from './pages/public/PublicTrackingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider } from './lib/i18n';

export default function App() {
  return (
    <I18nProvider>
      <ErrorBoundary label="app">
        <AppRoutes />
      </ErrorBoundary>
    </I18nProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/track"
        element={
          <ErrorBoundary label="suivi public">
            <PublicTrackingPage />
          </ErrorBoundary>
        }
      />
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
            <ErrorBoundary label="dashboard admin">
              <AdminDashboard />
            </ErrorBoundary>
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