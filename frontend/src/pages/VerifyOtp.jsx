import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { errorMessage } from '../api/client';
import { Alert } from '../components/Common';

/** Port of verifyOtp.jsp. The email comes from navigation state instead of session "registeringEmail". */
export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setInfo('');
    try {
      const res = await authApi.verifyOtp({ email, otp });
      navigate('/login', { state: { success: res.message } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!email) { setError('Enter your email first.'); return; }
    setError('');
    try { setInfo((await authApi.resendOtp(email)).message); } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <div className="container main-container mt-5">
      <div className="card-form mx-auto w-form-sm" style={{ textAlign: 'center' }}>
        <div className="mb-3"><i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '3rem' }} /></div>
        <h2>Verify Account</h2>
        {location.state?.email ? (
          <p className="text-muted mb-4">We have sent a 6-digit code to<br /><strong>{email}</strong></p>
        ) : (
          <div className="mb-3 text-start">
            <label htmlFor="otp-email" className="form-label">Email used to register</label>
            <input type="email" id="otp-email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        )}
        <Alert className="py-2 mb-3">{error}</Alert>
        <Alert type="info" className="py-2 mb-3">{info}</Alert>
        <form onSubmit={submit}>
          <div className="mb-4">
            <input type="text" inputMode="numeric" autoComplete="one-time-code" className="form-control form-control-lg text-center"
                   placeholder="Enter 6-digit OTP" maxLength={6} pattern="\d{6}" required value={otp} aria-label="One-time password"
                   onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                   style={{ letterSpacing: 5, fontWeight: 'bold', fontSize: '1.5rem' }} />
          </div>
          <button type="submit" className="btn btn-orange w-100 py-2" disabled={busy}>Verify &amp; Login</button>
        </form>
        <div className="mt-3">
          <small className="text-muted">Did not receive code?{' '}
            <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={resend}>Resend</button>
          </small>
        </div>
        <div className="mt-2"><Link to="/login" className="small">Back to Login</Link></div>
      </div>
    </div>
  );
}
