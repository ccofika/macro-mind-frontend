import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import AuthContext from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [suspendedMessage, setSuspendedMessage] = useState('');
  const [lockedMessage, setLockedMessage] = useState('');
  const { login, googleLogin, error, setError, isSuspended } = useContext(AuthContext);

  // Check for suspended/locked status on component mount
  useEffect(() => {
    const accountSuspended = localStorage.getItem('accountSuspended');
    const accountLocked = localStorage.getItem('accountLocked');
    const lockedUntil = localStorage.getItem('lockedUntil');

    if (accountSuspended === 'true') {
      setSuspendedMessage('Your account has been suspended. Please contact administrator.');
      localStorage.removeItem('accountSuspended');
    }

    if (accountLocked === 'true' && lockedUntil) {
      const unlockTime = new Date(lockedUntil);
      const now = new Date();
      
      if (now < unlockTime) {
        const remainingTime = Math.ceil((unlockTime - now) / (1000 * 60)); // minutes
        setLockedMessage(`Account temporarily locked due to failed login attempts. Try again in ${remainingTime} minutes.`);
      } else {
        // Lock has expired, clear it
        localStorage.removeItem('accountLocked');
        localStorage.removeItem('lockedUntil');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    await login(email, password);
  };

  const handleGoogleSuccess = async (response) => {
    await googleLogin(response.credential);
  };

  const handleGoogleError = () => {
    setError('Google login failed');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
                      <h2>Login to MacroMebit</h2>
        
        {suspendedMessage && (
          <div className="auth-error auth-suspended">
            <strong>⚠️ Account Suspended</strong>
            <p>{suspendedMessage}</p>
          </div>
        )}
        
        {lockedMessage && (
          <div className="auth-error auth-locked">
            <strong>🔒 Account Locked</strong>
            <p>{lockedMessage}</p>
          </div>
        )}
        
        {error && !suspendedMessage && !lockedMessage && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="you@mebit.io"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Your password"
              required
            />
          </div>
          
          <button type="submit" className="auth-button">Login</button>
        </form>
        
        <div className="auth-divider">
          <span>OR</span>
        </div>
        
        <div className="google-login-container">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            shape="rectangular"
            text="signin_with"
            logo_alignment="center"
          />
        </div>
        
        {/*<div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>*/}
      </div>
    </div>
  );
};

export default Login; 