import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';

/** Replaces "if (session.getAttribute("loggedInUser") == null) redirect to login.jsp". */
export function RequireUser({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location, error: 'Please login to continue.' }} />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { isAdmin, expired } = useAdminAuth();
  if (!isAdmin) return <Navigate to={`/admin/login${expired ? '?error=expired' : ''}`} replace />;
  return children;
}
