import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StationAutocomplete from '../components/StationAutocomplete';
import ChatWidget from '../components/ChatWidget';
import { Alert } from '../components/Common';
import { todayIso } from '../utils/format';

function Disclaimer() {
  const [show, setShow] = useState(() => sessionStorage.getItem('disclaimerSeen') !== 'true');
  if (!show) return null;
  const close = () => { sessionStorage.setItem('disclaimerSeen', 'true'); setShow(false); };
  return (
    <div className="disclaimer-overlay" role="dialog" aria-modal="true" aria-labelledby="disc-title">
      <div className="disclaimer-box">
        <div className="disclaimer-head">
          <i className="bi bi-info-circle-fill" style={{ fontSize: '1.8rem' }} />
          <div>
            <div id="disc-title" style={{ fontWeight: 800, fontSize: '1.2rem' }}>Disclaimer</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.8 }}>Please read before continuing</div>
          </div>
        </div>
        <div className="disclaimer-body">
          <p style={{ fontSize: '1rem', color: '#333', lineHeight: 1.7, marginBottom: 15 }}>
            ⚠️ This project is built <strong>only for educational &amp; learning purposes</strong>.
          </p>
          <ul>
            <li>This is <strong>not</strong> the official IRCTC website.</li>
            <li>No real tickets are booked or payments processed.</li>
            <li>All data shown is for <strong>demo purposes only</strong>.</li>
            <li>IRCTC name &amp; logo are trademarks of Indian Railways.</li>
            <li>Built as a part of learning.</li>
          </ul>
          <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 20 }}>
            By clicking <strong>"I Understand"</strong>, you acknowledge this is a learning project, not an official service.
          </p>
          <button type="button" className="disclaimer-btn" onClick={close} autoFocus>✅ I Understand, Continue</button>
        </div>
      </div>
    </div>
  );
}

/** Port of home.jsp */
export default function Home() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState(location.state?.error || '');
  const [success, setSuccess] = useState(location.state?.success || '');

  const submit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) { setShowLoginModal(true); return; }
    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Source and destination cannot be the same.');
      return;
    }
    const q = new URLSearchParams({ source, destination, journeyDate });
    navigate(`/trains?${q.toString()}`);
  };

  const swap = () => { setSource(destination); setDestination(source); };

  return (
    <div className="page-home">
      <div className="container main-container mt-5">
        <div className="row">
          <div className="col-lg-5 col-md-7">
            <div className="card-form" style={{ overflow: 'hidden' }}>
              <div className="row g-0 text-center mb-4 header-tabs">
                <div className="col-6">
                  <Link to="/pnr" className="header-btn left"><i className="bi bi-search me-2" /> PNR Status</Link>
                </div>
                <div className="col-6">
                  <Link to="/live-status" className="header-btn"><i className="bi bi-broadcast me-2 text-danger" /> Live Status</Link>
                </div>
              </div>

              <h2><i className="bi bi-train-front-fill me-2" />Book Ticket</h2>
              <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>
              <Alert onClose={() => setError('')}>{error}</Alert>

              <form onSubmit={submit}>
                <div className="mb-3">
                  <label htmlFor="source" className="form-label">From</label>
                  <div className="input-group flex-nowrap">
                    <span className="input-group-text"><i className="bi bi-geo-alt-fill" /></span>
                    <StationAutocomplete id="source" value={source} onChange={setSource} placeholder="Enter source station" required />
                  </div>
                </div>
                <div className="swap-container">
                  <button type="button" className="btn btn-swap" title="Swap Stations" aria-label="Swap stations" onClick={swap}>
                    <i className="bi bi-arrow-down-up" />
                  </button>
                </div>
                <div className="mb-3">
                  <label htmlFor="destination" className="form-label">To</label>
                  <div className="input-group flex-nowrap">
                    <span className="input-group-text"><i className="bi bi-geo-alt-fill" /></span>
                    <StationAutocomplete id="destination" value={destination} onChange={setDestination} placeholder="Enter destination station" required />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="journeyDate" className="form-label">Date</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-calendar-event-fill" /></span>
                    <input type="date" id="journeyDate" className="form-control" required min={todayIso()}
                           value={journeyDate} onChange={(e) => setJourneyDate(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-orange w-100"><i className="bi bi-search me-2" />Search Trains</button>
              </form>
            </div>
          </div>
          <div className="col-lg-7 col-md-5 d-none d-md-block">
            <div className="irctc-tagline">
              <h1>INDIAN RAILWAYS</h1>
              <p>Safety | Security | Punctuality</p>
            </div>
          </div>
        </div>
      </div>

      {showLoginModal && (
        <div className="login-modal" style={{ display: 'block' }} onClick={() => setShowLoginModal(false)}>
          <div className="login-modal-content" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close-button btn btn-link p-0" aria-label="Close" onClick={() => setShowLoginModal(false)}>&times;</button>
            <p>Please log in to search for trains.</p>
            <Link to="/login" className="btn btn-primary"><i className="bi bi-box-arrow-in-right me-1" /> Go to Login</Link>
          </div>
        </div>
      )}

      <ChatWidget />
      <Disclaimer />
    </div>
  );
}
