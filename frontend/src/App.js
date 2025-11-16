import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import AssessorDashboard from './components/AssessorDashboard';
import UploaderDashboard from './components/UploaderDashboard';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Tree Assessment Platform</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            {user ? (
              <>
                <li className="nav-item">
                  <span className="navbar-text me-3">Welcome, {user.username} ({user.role})</span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-light" onClick={logout}>Logout</button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname === '/admin';
  const isUploaderPage = location.pathname === '/uploader';
  const isAssessorPage = location.pathname === '/assessor';
  const isDashboardPage = isAdminPage || isUploaderPage || isAssessorPage;

  return (
    <>
      {!isLoginPage && !isDashboardPage && <Navigation />}
      <div className={isLoginPage || isDashboardPage ? '' : 'container mt-4'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/assessor" element={
            <ProtectedRoute allowedRoles={['Assessor']}>
              <AssessorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/uploader" element={
            <ProtectedRoute allowedRoles={['Uploader']}>
              <UploaderDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;