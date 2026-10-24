import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useAdminAuth } from '../../context/AdminAuthContext';

/** Port of adminLogin.jsp ("Control Room"). */
export default function AdminLogin() {
  const { login, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.classList.add('admin-login-body');
    return () => document.body.classList.remove('admin-login-body');
  }, []);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token, admin } = await adminApi.login(form);
      login(token, admin);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="login-card">
      <div className="logo-wrapper"><img src="/assets/images/ir.png" alt="Indian Railways" className="logo-img" /></div>
      <div className="login-title">Control Room</div>
      <div className="login-subtitle">System Administrator Access</div>
      {error && (
        <div className="alert alert-danger alert-custom mb-4"><i className="bi bi-shield-slash-fill fs-5" /><div>{error}</div></div>
      )}
      {params.get('error') && !error && (
        <div className="alert alert-warning alert-custom mb-4" style={{ background: '#fff3cd', color: '#856404' }}>
          <i className="bi bi-clock-history fs-5" /><div>Session expired. Please login again.</div>
        </div>
      )}
      <form onSubmit={submit}>
        <div className="input-box">
          <i className="bi bi-person" />
          <input type="text" className="form-control" placeholder="Admin ID" aria-label="Admin ID" required autoComplete="username"
                 value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div className="input-box">
          <i className="bi bi-key" />
          <input type="password" className="form-control" placeholder="Secure Password" aria-label="Password" required
                 autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" className="btn-login" disabled={busy}>
          {busy ? 'Authenticating...' : <>Authenticate <i className="bi bi-box-arrow-in-right ms-2" /></>}
        </button>
      </form>
      <div className="mt-4 pt-3 border-top text-muted small"><i className="bi bi-lock-fill me-1" /> Restricted Area. Authorized Personnel Only.</div>
    </div>
  );
}
