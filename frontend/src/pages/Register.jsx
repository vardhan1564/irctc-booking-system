import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { errorMessage } from '../api/client';
import { Alert } from '../components/Common';

/** Port of register.jsp + RegisterServlet */
export default function Register() {
  const navigate = useNavigate();
  const [f, setF] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '',
    gender: '', address: '', verificationMethod: 'OTP' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await authApi.register(f);
      if (res.method === 'OTP') navigate('/verify-otp', { state: { email: res.email } });
      else navigate('/login', { state: { success: res.message } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container main-container mt-5">
      <div className="card-form w-form-xl" style={{ margin: '20px auto' }}>
        <h2><i className="bi bi-person-plus-fill me-2" />Create an Account</h2>
        <Alert>{error}</Alert>
        <form onSubmit={submit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person-vcard-fill" /></span>
                <input id="fullName" className="form-control" required placeholder="First and Last Name" autoComplete="name"
                       value={f.fullName} onChange={set('fullName')} maxLength={100} />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-telephone-fill" /></span>
                <input type="tel" id="phone" className="form-control" required placeholder="10-digit number" autoComplete="tel"
                       pattern="[0-9+\- ]{10,15}" title="10 to 15 digits" value={f.phone} onChange={set('phone')} />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope-fill" /></span>
              <input type="email" id="email" className="form-control" required placeholder="name@example.com" autoComplete="email"
                     value={f.email} onChange={set('email')} />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock-fill" /></span>
                <input type="password" id="password" className="form-control" required placeholder="Min 6 characters" minLength={6}
                       autoComplete="new-password" value={f.password} onChange={set('password')} />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock-fill" /></span>
                <input type="password" id="confirmPassword" className="form-control" required placeholder="Re-enter password"
                       autoComplete="new-password" value={f.confirmPassword} onChange={set('confirmPassword')} />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="gender" className="form-label">Gender</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-gender-ambiguous" /></span>
              <select id="gender" className="form-select" required value={f.gender} onChange={set('gender')}>
                <option value="">-- Select Gender --</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="address" className="form-label">Address</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-house-fill" /></span>
              <textarea id="address" className="form-control" rows={3} placeholder="Enter your full address" required
                        maxLength={255} value={f.address} onChange={set('address')} />
            </div>
          </div>
          <div className="mb-4">
            <span className="form-label d-block">Select Verification Method:</span>
            {[['OTP', 'verifyOTP', 'bi-shield-lock-fill', 'Send OTP'], ['LINK', 'verifyLink', 'bi-link-45deg', 'Send Email Link']].map(([v, id, ic, label]) => (
              <div className="form-check form-check-inline" key={v}>
                <input className="form-check-input" type="radio" name="verificationMethod" id={id} value={v}
                       checked={f.verificationMethod === v} onChange={set('verificationMethod')} />
                <label className="form-check-label" htmlFor={id}><i className={`bi ${ic} me-1`} /> {label}</label>
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn-orange w-100" disabled={busy}>
            {busy ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-person-check-fill me-2" />} Register
          </button>
        </form>
        <div className="text-center mt-3">
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--irctc-orange)', fontWeight: 'bold', textDecoration: 'none' }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}
