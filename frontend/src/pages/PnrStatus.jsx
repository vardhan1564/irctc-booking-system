import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Common';

/** Port of pnrStatus.jsp */
export default function PnrStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pnr, setPnr] = useState('');
  const submit = (e) => { e.preventDefault(); navigate(`/pnr/${pnr.trim()}`); };
  return (
    <div className="container main-container mt-5">
      <div className="card-form text-center w-form-lg" style={{ margin: '50px auto' }}>
        <h2 className="mb-4" style={{ color: 'var(--irctc-blue)' }}><i className="bi bi-search me-2" />Check PNR Status</h2>
        <Alert>{location.state?.error}</Alert>
        <form onSubmit={submit}>
          <div className="mb-4">
            <input type="text" inputMode="numeric" className="form-control form-control-lg text-center" placeholder="Enter PNR Number"
                   aria-label="PNR number" required maxLength={10} pattern="\d{1,10}" value={pnr}
                   onChange={(e) => setPnr(e.target.value.replace(/\D/g, ''))} style={{ fontSize: '1.5rem', letterSpacing: 2 }} />
            <div className="form-text">Enter 10-digit PNR for real trains or Booking ID for clone.</div>
          </div>
          <button type="submit" className="btn btn-orange w-100 btn-lg">Get Status</button>
        </form>
        <div className="mt-3"><Link to="/" className="text-decoration-none">Back to Home</Link></div>
      </div>
    </div>
  );
}
