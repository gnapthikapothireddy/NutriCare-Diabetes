import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('nutricare_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('nutricare_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nutricare_user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name, phone) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.signup(email, password, name, phone);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (email, name, googleId, photo, credential) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.googleLogin(email, name, googleId, photo, credential);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const otpLogin = async (phone, otp) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.otpLogin(phone, otp);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.updateProfile(user._id, profileData);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, error, setError,
      login, signup, googleLogin, otpLogin, logout, updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
