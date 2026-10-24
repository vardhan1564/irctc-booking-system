import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bookingApi } from '../api';
import { errorMessage } from '../api/client';

/** Port of bookingSuccess.jsp */
export default function BookingSuccess() {
  const { id } = useParams();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { bookingApi.get(id).then((b) => setEmail(b.primaryEmail)).catch(() => {}); }, [id]);

  const download = async () => {
    setBusy(true); setErr('');
    try { await bookingApi.downloadTicket(id); } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div className="page-success container main-container mt-5">
      <div className="card-form text-center w-form-xl" style={{ margin: '20px auto' }}>
        <div className="success-icon"><i className="bi bi-check-circle-fill" /></div>
        <h2 style={{ color: '#28a745', marginTop: 15 }}>Booking Successful!</h2>
        <p className="lead" style={{ fontSize: '1.3rem' }}>
          Your e-ticket has been confirmed for PNR: <strong style={{ color: 'var(--irctc-blue)' }}>{id}</strong>
        </p>
        <p>A confirmation email with the PDF ticket has been sent to {email ? <strong>{email}</strong> : 'your primary email'}.</p>
        {err && <div className="alert alert-danger">{err}</div>}
        <hr className="my-4" />
        <div className="row g-2">
          <div className="col-md">
            <Link to="/bookings" className="btn btn-secondary w-100 py-2"><i className="bi bi-ticket-perforated-fill me-1" /> View My Bookings</Link>
          </div>
          <div className="col-md">
            <button type="button" className="btn btn-outline-primary w-100 py-2" onClick={download} disabled={busy}>
              <i className="bi bi-file-earmark-pdf-fill me-1" /> Download Ticket
            </button>
          </div>
          <div className="col-md">
            <Link to="/" className="btn btn-orange w-100 py-2"><i className="bi bi-train-front-fill me-1" /> Book Another Ticket</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
