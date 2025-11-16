import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-brand">
            <div className="brand-icon">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10 L35 35 L20 35 L20 55 L50 55 L65 35 L80 35 L80 55 L50 90 L20 55" 
                      stroke="currentColor" strokeWidth="3" fill="none"/>
                <circle cx="50" cy="25" r="8" fill="currentColor"/>
              </svg>
            </div>
            <h1>HTP Analysis Platform</h1>
            <p className="brand-subtitle">ML-Assisted Psychological Assessment</p>
          </div>
          
          <div className="login-info">
            <div className="info-card">
              <h3>House-Tree-Person</h3>
              <p>Advanced AI-powered analysis of children's projective drawings for early psychological screening</p>
            </div>
            
            <div className="info-features">
              <div className="feature-item">
                <span className="feature-bullet">✓</span>
                <span>Secure role-based access control</span>
              </div>
              <div className="feature-item">
                <span className="feature-bullet">✓</span>
                <span>AI-assisted preliminary screening</span>
              </div>
              <div className="feature-item">
                <span className="feature-bullet">✓</span>
                <span>Expert assessor review workflow</span>
              </div>
              <div className="feature-item">
                <span className="feature-bullet">✓</span>
                <span>Comprehensive case management</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">👤</span>
                  Username
                </label>
                <input 
                  type="text" 
                  name="username" 
                  className="form-input" 
                  onChange={handleChange}
                  value={formData.username}
                  placeholder="Enter your username"
                  required 
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <input 
                  type="password" 
                  name="password" 
                  className="form-input" 
                  onChange={handleChange}
                  value={formData.password}
                  placeholder="Enter your password"
                  required 
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <button 
                type="submit" 
                className="btn-login" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="login-footer">
              <p className="help-text">
                Need help? Contact your system administrator
              </p>
              <p className="security-notice">
                🔐 All connections are encrypted and secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;