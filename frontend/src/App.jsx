import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider, useAuth } from './store/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Discovery from './pages/Discovery';
import Inbox from './pages/Inbox';
import MarketingHub from './pages/MarketingHub';
import MapView from './pages/MapView';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="flex flex-col items-center gap-4">
          <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
            <path d="M50 5 L90 20 L90 55 C90 75 70 92 50 98 C30 92 10 75 10 55 L10 20 Z"
              fill="none" stroke="#FAD485" strokeWidth="4" strokeLinejoin="round"/>
            <path d="M28 38 L37 68 L50 50 L63 68 L72 38"
              fill="none" stroke="#FAD485" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="wise-spinner" />
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#000000' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #000000 0%, #050503 100%)' }}>
          <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
            <Routes>
              <Route path="/"             element={<Dashboard />} />
              <Route path="/leads"        element={<Leads />} />
              <Route path="/marketing"    element={<MarketingHub />} />
              <Route path="/discovery"    element={<Discovery />} />
              <Route path="/conversations" element={<Inbox />} />
              <Route path="/map"          element={<MapView />} />
              <Route path="/settings"     element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center p-8 text-center space-y-4"
      style={{ background: '#000', color: '#E8E6DF' }}>
      <div className="text-4xl mb-2">⚠️</div>
      <h2 className="text-xl font-bold" style={{ color: '#FAD485' }}>Algo deu errado</h2>
      <pre className="text-left text-xs p-4 rounded-xl overflow-auto max-w-4xl text-red-400 font-mono"
        style={{ background: '#0A0A07', border: '1px solid rgba(239,68,68,0.2)', maxHeight: '40vh' }}>
        {error.message}{'\n\n'}{error.stack}
      </pre>
      <button onClick={resetErrorBoundary} className="btn-primary mt-4">
        Tentar Novamente
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
