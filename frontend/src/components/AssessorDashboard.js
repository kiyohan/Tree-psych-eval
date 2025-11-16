import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../api';
import './AssessorDashboard.css'; // Import our new CSS file
import ReviewView from './ReviewView'; // Import the new component

// Logo URL - replace with your actual logo if available
import logoUrl from '../assets/choice-foundation-logo.png'; // Example logo

// Helper component for the dashboard view
const DashboardView = ({ cases, onSelectCase }) => {
    const [activeTab, setActiveTab] = useState('flagged');
    const [completedFilter, setCompletedFilter] = useState('all');

    const filteredCases = useMemo(() => {
        switch (activeTab) {
            case 'flagged':
                return cases.filter(c => c.status === 'Flagged for Review');
            case 'pending':
                // Note: The mockups also show 'Initial Screening', so let's include that.
                return cases.filter(c => c.status === 'Initial Screening' || c.status === 'Flagged for Review');
            case 'completed':
                if (completedFilter === 'all') {
                    return cases.filter(c => c.status.startsWith('Completed'));
                }
                return cases.filter(c => c.status === completedFilter);
            default:
                return [];
        }
    }, [cases, activeTab, completedFilter]);

    const getStatusClass = (status) => {
        if (status === 'Flagged for Review') return 'status-flagged';
        if (status === 'Completed - Follow-up Needed') return 'status-followup';
        if (status === 'Completed - No Concerns') return 'status-completed';
        if (status === 'Initial Screening') return 'status-screening';
        return '';
    };

    return (
        <div className="dashboard-card">
            <div className="text-center">
                <img src={logoUrl} alt="Choice Foundation" className="foundation-logo" />
                <h2>Caseload Dashboard</h2>
            </div>
            <div className="dashboard-tabs">
                <button className={`tab-button ${activeTab === 'flagged' ? 'active' : ''}`} onClick={() => setActiveTab('flagged')}>Flagged for Review</button>
                <button className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending Cases</button>
                <button className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>Completed</button>
            </div>
            <div className="queue-info">
                <span>Queue: {activeTab.toUpperCase()} ({filteredCases.length} cases)</span>
                {activeTab === 'completed' && (
                    <select className="form-select form-select-sm w-auto" value={completedFilter} onChange={e => setCompletedFilter(e.target.value)}>
                        <option value="all">All Completed</option>
                        <option value="Completed - No Concerns">No Concerns</option>
                        <option value="Completed - Follow-up Needed">Follow Up</option>
                    </select>
                )}
            </div>
            <table className="case-table">
                <thead>
                    <tr><th>CHILD ID</th><th>AGE</th><th>UPLOAD DATE</th><th>STATUS</th></tr>
                </thead>
                <tbody>
                    {filteredCases.map(c => (
                        <tr key={c._id} onClick={() => onSelectCase(c)} style={{ cursor: 'pointer' }}>
                            <td>{c.drawing?.childId || 'N/A'}</td>
                            <td>{c.drawing?.childAge || 'N/A'}</td>
                            <td>{c.drawing ? new Date(c.drawing.createdAt).toLocaleDateString() : 'N/A'}</td>
                            <td className={getStatusClass(c.status)}>{c.status.replace('Completed - ', '')}</td>
                        </tr>
                    ))}
                     {filteredCases.length === 0 && (
                        <tr>
                            <td colSpan="4" className="text-center text-muted">No cases in this queue.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// Main AssessorDashboard Component
function AssessorDashboard() {
  const [view, setView] = useState('welcome'); // 'welcome', 'dashboard', 'review'
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getAssignedCases();
      setCases(data);
    } catch (error) {
      console.error("Failed to fetch cases", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);
  
  const handleSelectCase = (caseData) => {
      setSelectedCase(caseData);
      setView('review');
  };

  const handleReturnToDashboard = () => {
      setSelectedCase(null);
      setView('dashboard');
      fetchCases(); // Refresh data after an action
  }

  const handleSaveReview = async (caseId, reportText, finalStatus) => {
    setIsSubmitting(true);
    try {
        await api.submitReview(caseId, { assessorReport: reportText, finalStatus });
        alert('Review submitted successfully!');
        handleReturnToDashboard();
    } catch (error) {
        alert('Failed to submit review.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const { logout } = require('../context/AuthContext').useAuth();

  return (
    <div className="assessor-container">
      <header className="assessor-header">
        <div className="header-left">
          <img src={logoUrl} alt="Choice Foundation" className="assessor-logo" />
          <div className="header-title">
            <h2>HTP Analysis Platform</h2>
            <span className="header-subtitle">Assessor Portal</span>
          </div>
        </div>
        <div className="header-right">
          {view === 'review' && (
            <button onClick={handleReturnToDashboard} className="btn-back">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
              </svg>
              Back to Dashboard
            </button>
          )}
          {view !== 'welcome' && view !== 'dashboard' && (
            <button onClick={() => { setView('dashboard'); setSelectedCase(null); }} className="btn-home">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
              </svg>
              Dashboard
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
      
      <main className="assessor-main">
        {loading && (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading cases...</p>
          </div>
        )}
        {!loading && view === 'welcome' && (
          <div className="welcome-container">
            <div className="welcome-header">
              <div className="assessor-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                </svg>
              </div>
              <h1 className="welcome-title">Welcome, Assessor</h1>
              <p className="welcome-subtitle">Your ML-assisted HTP interpretation platform is ready</p>
            </div>

            <div className="welcome-card" style={{maxWidth: '600px', margin: '0 auto', cursor: 'pointer'}} onClick={() => setView('dashboard')}>
              <div className="card-icon" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', margin: '0 auto 1.5rem'}}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                </svg>
              </div>
              <h3 style={{textAlign: 'center'}}>Start Reviewing Cases</h3>
              <p style={{textAlign: 'center'}}>Review cases quickly and efficiently using AI-generated analysis</p>
              <div className="card-action" style={{textAlign: 'center'}}>Access Caseload Dashboard →</div>
            </div>
          </div>
        )}
        {!loading && view === 'dashboard' && <DashboardView cases={cases} onSelectCase={handleSelectCase} />}
        
        {!loading && view === 'review' && selectedCase && (
          <ReviewView 
              caseData={selectedCase} 
              onSave={handleSaveReview} 
              onBack={handleReturnToDashboard}
              isSubmitting={isSubmitting}
              isReadOnly={selectedCase.status.startsWith('Completed')}
          />
        )}
      </main>
    </div>
  );
}

export default AssessorDashboard;