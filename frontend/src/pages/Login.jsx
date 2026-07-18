import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, User, Phone, LogIn, ChevronRight } from 'lucide-react';

const Login = () => {
  const { login, signup, googleLogin, otpLogin, error, setError } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [useOtp, setUseOtp] = useState(false);

  // Forms states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      let loggedUser;
      if (useOtp) {
        if (!otpSent) {
          if (!phone) return setError('Please enter a mobile number.');
          setOtpSent(true);
          return;
        } else {
          loggedUser = await otpLogin(phone, otp);
        }
      } else if (isSignUp) {
        loggedUser = await signup(email, password, name, phone);
      } else {
        loggedUser = await login(email, password);
      }

      if (loggedUser) {
        if (loggedUser.profileCompleted) {
          navigate('/dashboard');
        } else {
          navigate('/profile');
        }
      }
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      try {
        // Fetch real user profile from Google UserInfo endpoint
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) {
          throw new Error('Failed to retrieve profile information from Google.');
        }
        const profile = await res.json();
        
        // profile contains: sub (UID), name, email, picture
        const loggedUser = await googleLogin(profile.email, profile.name, profile.sub, profile.picture, tokenResponse.access_token);
        if (loggedUser) {
          if (loggedUser.profileCompleted) {
            navigate('/dashboard');
          } else {
            navigate('/profile');
          }
        }
      } catch (err) {
        console.error("Google login error:", err);
        setError("Failed to complete Google Sign-In. Please try again.");
      }
    },
    onError: (err) => {
      console.error("Google Sign-In Failed:", err);
      setError("Google Sign-In failed or was cancelled. Please check your network or Client ID configuration.");
    },
  });

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your_google_client_id_here' || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      setError("⚠️ Google OAuth Client ID is not configured! Please set VITE_GOOGLE_CLIENT_ID in your .env file with your Google Cloud / Firebase OAuth Client ID.");
      return;
    }
    triggerGoogleLogin();
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1.5rem',
        backgroundImage: "linear-gradient(135deg, rgba(20, 50, 30, 0.72) 0%, rgba(12, 28, 38, 0.78) 100%), url('https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1920&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          boxShadow: '0 12px 50px rgba(46, 139, 87, 0.1)'
        }}
      >
        {/* App Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            marginBottom: '0.75rem'
          }}>
            N
          </div>
          <h1 style={{ fontSize: 'var(--font-xl)', margin: 0, color: 'var(--primary)' }}>
            {t("appName")}
          </h1>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {t("tagline")}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(229, 57, 53, 0.1)',
            color: '#E53935',
            fontSize: 'var(--font-xs)',
            marginBottom: '1.5rem',
            fontWeight: 500,
            borderLeft: '4px solid #E53935'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Sign Up Fields */}
          {isSignUp && !useOtp && (
            <div className="form-group">
              <label className="form-label">{t("profile") + " " + t("gender")}</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Full Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>
          )}

          {/* OTP Fields */}
          {useOtp ? (
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="e.g. +91 9876543210" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  disabled={otpSent}
                  required
                />
              </div>
              
              {otpSent && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Verification OTP</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter 6-digit OTP (123456)" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                    {t("otpMessage")}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Standard Email / Password fields */}
              <div className="form-group">
                <label className="form-label">{t("email")}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t("password")}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            <LogIn size={18} />
            <span>
              {useOtp 
                ? (otpSent ? t("verifyOtpBtn") : "Send OTP") 
                : (isSignUp ? t("signup") : t("login"))}
            </span>
            <ChevronRight size={18} />
          </button>
        </form>

        {/* Separator line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Google Login Trigger */}
        <button 
          onClick={handleGoogleLogin}
          className="btn btn-outline" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.75rem', borderColor: 'var(--border)', color: 'var(--text-main)', alignItems: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '0.25rem' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{t("googleLogin")}</span>
        </button>

        {/* Alternate login options footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: 'var(--font-xs)' }}>
          {/* Toggle OTP option */}
          <button 
            onClick={() => {
              setUseOtp(!useOtp);
              setOtpSent(false);
              setError(null);
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontWeight: 600 }}
          >
            {useOtp ? "Use Email & Password" : t("otpLogin")}
          </button>

          {/* Toggle Sign Up / Log In */}
          {!useOtp && (
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              {isSignUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
