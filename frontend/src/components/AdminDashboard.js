import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
import logoUrl from '../assets/choice-foundation-logo.png';

// Import the new child components from their files
import AdminMainDashboard from './admin/AdminMainDashboard';
import AdminUserManagement from './admin/AdminUserManagement';
import AdminCaseAudit from './admin/AdminCaseAudit';

function AdminDashboard() {
  const { logout, user } = useAuth();
  const [view, setView] = useState('welcome'); // 'welcome', 'dashboard', 'users', 'cases'

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <AdminMainDashboard setView={setView} />;
      case 'users':
        return <AdminUserManagement setView={setView} />;
      case 'cases':
        return <AdminCaseAudit setView={setView} />;
      case 'welcome':
      default:
        return (
          <div className="welcome-container">
            <div className="welcome-header">
              <div className="admin-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                  <path d="M12 14C6.47715 14 2 18.4772 2 24H22C22 18.4772 17.5228 14 12 14Z" fill="currentColor"/>
                </svg>
              </div>
              <h1 className="welcome-title">Welcome Back, {user?.username || 'Admin'}</h1>
              <p className="welcome-subtitle">System Administrator Dashboard</p>
            </div>

            <div className="welcome-cards-grid">
              <div className="welcome-card" onClick={() => setView('dashboard')}>
                <div className="card-icon dashboard-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
                  </svg>
                </div>
                <h3>Dashboard Analytics</h3>
                <p>View system metrics, performance statistics, and activity logs</p>
                <div className="card-action">Access Dashboard →</div>
              </div>

              <div className="welcome-card" onClick={() => setView('users')}>
                <div className="card-icon users-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
                  </svg>
                </div>
                <h3>User Management</h3>
                <p>Manage accounts, roles, and permissions for all system users</p>
                <div className="card-action">Manage Users →</div>
              </div>

              <div className="welcome-card" onClick={() => setView('cases')}>
                <div className="card-icon cases-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
                  </svg>
                </div>
                <h3>Case Audit</h3>
                <p>Review, audit, and reassign cases across all assessors</p>
                <div className="card-action">View Cases →</div>
              </div>
            </div>

            <div className="welcome-footer">
              <div className="system-info">
                <div className="info-item">
                  <span className="info-label">System Status</span>
                  <span className="info-value status-online">● Online</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Your Role</span>
                  <span className="info-value">{user?.role || 'Administrator'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Login</span>
                  <span className="info-value">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-left">
          <img src={logoUrl} alt="Choice Foundation" className="admin-logo" />
          <div className="header-title">
            <h2>HTP Analysis Platform</h2>
            <span className="header-subtitle">Administrative Control Panel</span>
          </div>
        </div>
        <div className="header-right">
          {view !== 'welcome' && (
            <button onClick={() => setView('welcome')} className="btn-home">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
              </svg>
              Home
            </button>
          )}
          <button onClick={logout} className="logout-button">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
            </svg>
            Logout
          </button>
        </div>
      </header>
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default AdminDashboard;