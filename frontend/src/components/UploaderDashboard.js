import React, { useState, useEffect, useCallback } from 'react';
import './UploaderDashboard.css';
import logoUrl from '../assets/choice-foundation-logo.png';
import * as api from '../api';

// Import child components
import UploaderHome from './uploader/UploaderHome';
import UploadForm from './uploader/UploadForm';
import SubmissionStatus from './uploader/SubmissionStatus';

function UploaderDashboard() {
  const [view, setView] = useState('home'); // 'home', 'upload', 'status'
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getMyDrawingsWithCases();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch submission history.", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch history only when the status view is active or for the first time
    if (view === 'status' || history.length === 0) {
        fetchHistory();
    }
  }, [view, fetchHistory, history.length]);

  const handleUploadSuccess = () => {
      fetchHistory().then(() => {
          setView('status'); // After successful upload, show the status page
      });
  };

  const renderContent = () => {
    switch (view) {
      case 'upload':
        return <UploadForm setView={setView} onUploadSuccess={handleUploadSuccess} />;
      case 'status':
        return <SubmissionStatus setView={setView} history={history} loading={loading} />;
      case 'home':
      default:
        return <UploaderHome setView={setView} />;
    }
  };

  const { logout, user } = require('../context/AuthContext').useAuth();

  return (
    <div className="uploader-container">
      <header className="uploader-header">
        <div className="header-left">
          <img src={logoUrl} alt="Choice Foundation" className="uploader-logo" />
          <div className="header-title">
            <h2>HTP Analysis Platform</h2>
            <span className="header-subtitle">Uploader Portal</span>
          </div>
        </div>
        <div className="header-right">
          {view !== 'home' && (
            <button onClick={() => setView('home')} className="btn-home">
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
      <main className="uploader-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default UploaderDashboard;