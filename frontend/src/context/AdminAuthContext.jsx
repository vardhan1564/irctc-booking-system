import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ADMIN_KEY, ADMIN_TOKEN_KEY } from '../api/client';

/** Separate from the user login, exactly like the old "loggedInAdmin" session attribute. */
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) return null;
    try { return JSON.parse(localStorage.getItem(ADMIN_KEY)); } catch { return null; }
  });
  const [expired, setExpired] = useState(false);

  const login = useCallback((token, a) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(a));
    setExpired(false);
    setAdmin(a);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setAdmin(null);
  }, []);

  useEffect(() => {
    const onExpired = () => { setExpired(true); logout(); };
    window.addEventListener('admin:expired', onExpired);
    return () => window.removeEventListener('admin:expired', onExpired);
  }, [logout]);

  const value = useMemo(() => ({ admin, isAdmin: !!admin, expired, login, logout }), [admin, expired, login, logout]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => useContext(AdminAuthContext);
