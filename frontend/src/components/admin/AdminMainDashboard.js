import React, { useState, useEffect } from 'react';
import * as api from '../../api';

function AdminMainDashboard({ setView }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          api.getAdminStats(),
          api.getAdminLogs(),
        ]);
        setStats(statsRes.data);
        setLogs(logsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchData();
  }, []);

  // Export system data handler
  const handleExportSystemData = async () => {
    try {
      const response = await api.exportSystemData();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'system_data.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export system data.');
    }
  };

  return (
    <div className="dashboard-main">
      <div className="dashboard-header-section">
        <h2 className="dashboard-title">Dashboard Analytics</h2>
        <p className="dashboard-subtitle">Real-time system performance and metrics</p>
      </div>

      {stats ? (
        <div className="modern-stats-grid">
          <div className="modern-stat-card stat-blue">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="currentColor"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalDrawingsScreened}</div>
              <div className="stat-label">Total Drawings Processed</div>
            </div>
          </div>

          <div className="modern-stat-card stat-orange">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.flaggedCasesPending}</div>
              <div className="stat-label">Flagged Cases Pending</div>
            </div>
          </div>

          <div className="modern-stat-card stat-green">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.averageReviewTime}</div>
              <div className="stat-label">Avg. Review Time</div>
            </div>
          </div>

          <div className="modern-stat-card stat-purple">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.activeAssessors}</div>
              <div className="stat-label">Active Psychologists</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading dashboard metrics...</p>
        </div>
      )}

      <div className="dashboard-section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="action-btn action-primary" onClick={() => setView('users')}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
            </svg>
            <div>
              <div className="action-title">Manage User Accounts</div>
              <div className="action-desc">Create, edit, and manage system users</div>
            </div>
          </button>

          <button className="action-btn action-secondary" onClick={() => setView('cases')}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
            </svg>
            <div>
              <div className="action-title">Case Audit & Reassignment</div>
              <div className="action-desc">Review and manage all assessment cases</div>
            </div>
          </button>

          <button className="action-btn action-tertiary" onClick={handleExportSystemData}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" fill="currentColor"/>
            </svg>
            <div>
              <div className="action-title">Export System Data</div>
              <div className="action-desc">Download complete system data as JSON</div>
            </div>
          </button>
        </div>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Recent System Activity</h3>
        <div className="activity-log-modern">
          {logs.length > 0 ? (
            logs.map(log => (
              <div key={log._id} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p className="activity-message">{log.message}</p>
                  <span className="activity-time">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-activity">No recent activity to display</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminMainDashboard;