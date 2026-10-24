import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Common';

/** Port of liveStatus.jsp */
export default function LiveStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trainNo, setTrainNo] = useState('');
  const submit = (e) => { e.preventDefault(); navigate(`/live-status/${trainNo.trim()}`); };
  return (
    <div className="container main-container mt-5">
      <div className="card-form text-center w-form-lg" style={{ margin: '50px auto' }}>
        <h2 className="mb-4" style={{ color: 'var(--irctc-blue)' }}><i className="bi bi-broadcast me-2 text-danger" />Live Train Status</h2>
        <Alert>{location.state?.error}</Alert>
        <form onSubmit={submit}>
          <div className="mb-4">
            <input type="text" inputMode="numeric" className="form-control form-control-lg text-center" placeholder="Enter 5-digit Train No."
                   aria-label="Train number" required maxLength={5} pattern="\d{5}" value={trainNo}
                   onChange={(e) => setTrainNo(e.target.value.replace(/\D/g, ''))} style={{ fontSize: '1.5rem', letterSpacing: 2 }} />
            <div className="form-text">Example: 12951 (Rajdhani Express)</div>
          </div>
          <button type="submit" className="btn btn-orange w-100 btn-lg">Track Train</button>
        </form>
        <div className="mt-3"><Link to="/" className="text-decoration-none">Back to Home</Link></div>
      </div>
    </div>
  );
}
