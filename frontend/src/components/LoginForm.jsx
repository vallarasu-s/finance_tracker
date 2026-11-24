import React, { useState } from 'react';
import { 
  Wallet, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import { loginUser, registerUser, DEFAULT_USER } from '../services/storage';

export default function LoginForm({ onLogin, settings, onUpdateSettings }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    email: '',
    password: '',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleTheme = () => {
    const nextTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    if (onUpdateSettings) {
      onUpdateSettings({ theme: nextTheme });
    }
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      try {
        let user;
        if (isRegister) {
          if (!formData.name.trim()) {
            throw new Error('Please enter your full name or account name.');
          }
          user = registerUser({
            name: formData.name.trim(),
            username: formData.name.trim().toLowerCase().replace(/\s+/g, ''),
            email: formData.email.trim(),
          });
        } else {
          if (!formData.identifier.trim()) {
            throw new Error('Please enter your user name or email.');
          }
          user = loginUser({
            identifier: formData.identifier.trim(),
            password: formData.password,
            rememberMe: formData.rememberMe,
          });
        }

        setIsLoading(false);
        if (onLogin) {
          onLogin(user);
        }
      } catch (err) {
        setIsLoading(false);
        setError(err.message || 'Authentication failed. Please check credentials.');
      }
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const user = loginUser({
        identifier: DEFAULT_USER.name,
        password: 'password123',
        rememberMe: true,
      });
      setIsLoading(false);
      if (onLogin) {
        onLogin(user);
      }
    }, 300);
  };

  return (
    <div className="auth-page">
      {/* Background Decorative Gradient Blobs */}
      <div className="auth-glow-blob auth-glow-1" aria-hidden="true" />
      <div className="auth-glow-blob auth-glow-2" aria-hidden="true" />

      {/* Top Floating Controls */}
      <div className="auth-top-bar">
        <div className="auth-pill-badge">
          <span className="auth-dot-pulse"></span>
          <span>100% Offline-First & Private</span>
        </div>
        <button 
          className="btn btn-secondary btn-icon-only auth-theme-toggle"
          onClick={toggleTheme}
          title="Toggle Dark / Light Theme"
          aria-label="Toggle Theme"
          type="button"
        >
          {settings?.theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>
      </div>

      <div className="auth-container">
        {/* Main Auth Card */}
        <div className="auth-card">
          {/* Header & App Branding */}
          <div className="auth-header">
            <div className="auth-logo">
              <Wallet size={32} />
            </div>
            <h1 className="auth-title">Finance Tracker</h1>
            <p className="auth-subtitle">
              {isRegister 
                ? 'Create your local profile to start tracking wealth & goals'
                : 'Sign in to access your personal dashboard & budget'}
            </p>
          </div>

          {/* Quick Demo One-Click Login */}
          <div className="auth-quick-login-banner">
            <div className="auth-quick-info">
              <div className="auth-quick-icon">
                <Zap size={16} />
              </div>
              <div>
                <span className="auth-quick-title">Instant Access</span>
                <span className="auth-quick-desc">One-click sign in as <strong>Finance Tracker</strong></span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-outline-brand auth-quick-btn"
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
            >
              <Sparkles size={14} />
              <span>Quick Login</span>
            </button>
          </div>

          <div className="auth-divider">
            <span>OR CONTINUE WITH CREDENTIALS</span>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs" role="tablist">
            <button 
              type="button"
              role="tab"
              aria-selected={!isRegister}
              className={`auth-tab ${!isRegister ? 'active' : ''}`}
              onClick={() => { setIsRegister(false); setError(''); }}
            >
              Sign In
            </button>
            <button 
              type="button"
              role="tab"
              aria-selected={isRegister}
              className={`auth-tab ${isRegister ? 'active' : ''}`}
              onClick={() => { setIsRegister(true); setError(''); }}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="auth-error-alert" role="alert">
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isRegister ? (
              <>
                <div className="form-group">
                  <label htmlFor="reg-name" className="form-label">
                    Full Name / Account Name
                  </label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" aria-hidden="true" />
                    <input 
                      id="reg-name"
                      name="name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Finance Tracker or Alex Morgan"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      enterKeyHint="next"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-email" className="form-label">
                    Email Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional for offline)</span>
                  </label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" aria-hidden="true" />
                    <input 
                      id="reg-email"
                      name="email"
                      type="email"
                      className="form-input"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      inputMode="email"
                      enterKeyHint="next"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="login-identifier" className="form-label">
                  User Name or Email
                </label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" aria-hidden="true" />
                  <input 
                    id="login-identifier"
                    name="identifier"
                    type="text"
                    className="form-input"
                    placeholder="Enter your user name (e.g. Finance Tracker)"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                    enterKeyHint="next"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="login-password" className="form-label">
                  Password
                </label>
                {!isRegister && (
                  <span className="auth-hint-text">
                    Any password works locally
                  </span>
                )}
              </div>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" aria-hidden="true" />
                <input 
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  enterKeyHint="done"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input 
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="custom-checkbox"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary auth-submit-btn"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Signing In...' : (isRegister ? 'Create Profile & Sign In' : 'Sign In to Finance Tracker')}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Footer Highlights */}
          <div className="auth-footer-badges">
            <div className="auth-badge-item">
              <ShieldCheck size={14} className="badge-icon-green" />
              <span>Zero cloud leak</span>
            </div>
            <div className="auth-badge-item">
              <CheckCircle2 size={14} className="badge-icon-blue" />
              <span>Local Storage Mirror</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
