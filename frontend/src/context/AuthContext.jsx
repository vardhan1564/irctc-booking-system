import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { USER_KEY, USER_TOKEN_KEY } from '../api/client';

/**
 * Replaces session.setAttribute("loggedInUser", user).
 * The JWT and a copy of the user are kept in localStorage so a page refresh keeps you logged in.
 */
const AuthContext = createContext(null);

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (localStorage.getItem(USER_TOKEN_KEY) ? readUser() : null));

  const login = useCallback((token, u) => {
    localStorage.setItem(USER_TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((u) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [logout]);

  const value = useMemo(() => ({ user, isLoggedIn: !!user, login, logout, updateUser }), [user, login, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
