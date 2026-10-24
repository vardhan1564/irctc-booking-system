import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Common';

/** Port of login.jsp + LoginServlet */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(location.state?.error || '');
  const [success, setSuccess] = useState(location.state?.success || '');
  const [busy, setBusy] = useState(false);
  const needsVerify = error.toLowerCase().includes('verify');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const { token, user } = await authApi.login(form);
      login(token, user);
      const from = location.state?.from;
      navigate(from ? `${from.pathname}${from.search || ''}` : '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container main-container mt-5">
      <div className="card-form w-form-md" style={{ margin: '20px auto' }}>
        <h2><i className="bi bi-person-circle me-2" />User Login</h2>
        <Alert>{error && <>
          {error}
          {needsVerify && <> <Link to="/verify-otp" state={{ email: form.email }} className="alert-link">Verify now</Link></>}
        </>}</Alert>
        <Alert type="success">{success}</Alert>
        <form onSubmit={submit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope-fill" /></span>
              <input type="email" id="email" className="form-control" placeholder="name@example.com" required autoComplete="email"
                     value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock-fill" /></span>
              <input type="password" id="password" className="form-control" placeholder="Enter your password" required
                     autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-orange w-100" disabled={busy}>
            {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-box-arrow-in-right me-2" />}Login
          </button>
        </form>
        <div className="text-center mt-3">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--irctc-orange)', fontWeight: 'bold', textDecoration: 'none' }}>Register here</Link>
        </div>
      </div>
    </div>
  );
}
