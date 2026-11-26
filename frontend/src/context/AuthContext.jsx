import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  getCurrentUser,
  setCurrentUser as persistCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  saveUserInformation,
} from '../services/authService';

const AuthContext = createContext(null);

/**
 * Global authentication & active user profile context provider.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());

  const setCurrentUser = useCallback((user) => {
    persistCurrentUser(user);
    setCurrentUserState(user);
  }, []);

  const login = useCallback((credentials, { isOnline = false } = {}) => {
    const user = loginUser(credentials);
    setCurrentUserState(user);
    if (isOnline && user) {
      saveUserInformation(user);
    }
    return user;
  }, []);

  const register = useCallback((payload, { isOnline = false } = {}) => {
    const user = registerUser(payload);
    setCurrentUserState(user);
    if (isOnline && user) {
      saveUserInformation(user);
    }
    return user;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setCurrentUserState(null);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      setCurrentUser,
      login,
      register,
      logout,
    }),
    [currentUser, setCurrentUser, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access current authenticated user and auth actions.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
