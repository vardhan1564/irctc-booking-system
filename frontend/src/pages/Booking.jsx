import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingApi, trainApi } from '../api';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Loader } from '../components/Common';
import { fmtDate, inr } from '../utils/format';

const emptyPax = () => ({ name: '', age: '', gender: '', phone: '', email: '' });

/** Port of booking.jsp + BookingServlet (doGet = quote, doPost = create PENDING booking) */
export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const trainId = params.get('trainId');
  const source = params.get('source') || '';
  const destination = params.get('destination') || '';
  const journeyDate = params.get('journeyDate') || '';
  const classCode = params.get('classCode') || 'SL';

  const [quote, setQuote] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [primaryEmail, setPrimaryEmail] = useState(user?.email || '');
  const [pax, setPax] = useState([{ ...emptyPax(), name: user?.fullName || '', gender: user?.gender || '', phone: user?.phone || '', email: user?.email || '' }]);

  useEffect(() => {
    trainApi.quote(trainId, { source, destination, classCode })
      .then(setQuote)
      .catch((e) => setLoadError(errorMessage(e, 'Error fetching train or route details.')));
  }, [trainId, source, destination, classCode]);

  const setCount = (n) => setPax((list) => {
    const next = list.slice(0, n);
    while (next.length < n) next.push(emptyPax());
    return next;
  });
  const setField = (i, k, v) => setPax((list) => list.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await bookingApi.create({
        trainId: Number(trainId), journeyDate, source, destination, classCode, primaryEmail,
        passengers: pax.map((p) => ({ ...p, age: Number(p.age) })),
      });
      navigate(`/booking/${res.bookingId}/seats`);
    } catch (err) {
      setError(`Booking failed: ${errorMessage(err)}`);
      setBusy(false);
    }
  };

  if (loadError) return <div className="container main-container mt-5"><div className="card-form"><Alert>{loadError}</Alert></div></div>;
  if (!quote) return <Loader />;
  const max = quote.maxPassengers;

  return (
    <div className="container main-container mt-5">
      <div className="card-form">
        <h2><i className="bi bi-people-fill me-2" />Passenger Details</h2>
        <div className="booking-summary">
          <h3><i className="bi bi-train-front-fill me-2" />{quote.train.trainName} ({quote.train.trainNumber})</h3>
          <p>
            <i className="bi bi-geo-alt-fill me-1" style={{ color: 'var(--irctc-blue)' }} /> From: <strong>{source}</strong>
            <i className="bi bi-arrow-right mx-2" style={{ color: '#999' }} />
            <i className="bi bi-geo-alt-fill me-1" style={{ color: 'var(--irctc-blue)' }} /> To: <strong>{destination}</strong>
          </p>
          <p><i className="bi bi-calendar-event-fill me-1" style={{ color: 'var(--irctc-blue)' }} /> Journey Date: <strong>{fmtDate(journeyDate)}</strong>
            <span className="ms-3"><i className="bi bi-star-fill me-1" style={{ color: 'var(--irctc-blue)' }} /> Class: <strong>{quote.classCode}</strong></span></p>
          <p className="fare-details">Fare per Passenger: {inr(quote.farePerPassenger)}</p>
        </div>
        <Alert>{error}</Alert>
        {max === 0 ? <Alert>No seats are available on this train.</Alert> : (
          <form onSubmit={submit}>
            <div className="mb-3">
              <label htmlFor="primaryEmail" className="form-label">Contact Email (for ticket):</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-envelope-at-fill" /></span>
                <input type="email" id="primaryEmail" className="form-control" required value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} />
              </div>
              <div className="form-text">Your e-ticket will be sent to this email address.</div>
            </div>
            <div className="mb-3">
              <label htmlFor="passengers" className="form-label">Number of Passengers:</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person-lines-fill" /></span>
                <select id="passengers" className="form-select" value={pax.length} onChange={(e) => setCount(Number(e.target.value))}>
                  {Array.from({ length: max }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              </div>
              <div className="form-text">(Max {max} allowed. Available Seats: {quote.train.availableSeats})</div>
            </div>
            <hr className="my-4" style={{ color: 'var(--irctc-blue)' }} />
            {pax.map((p, i) => (
              <div className="passenger-form" key={i}>
                <h5><i className="bi bi-person-fill me-2" />Passenger {i + 1}{i === 0 ? ' (Primary)' : ''}</h5>
                <div className="mb-3">
                  <label htmlFor={`paxName${i}`} className="form-label">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-person-vcard" /></span>
                    <input id={`paxName${i}`} className="form-control" required placeholder="Name as per ID" maxLength={100}
                           value={p.name} onChange={(e) => setField(i, 'name', e.target.value)} />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor={`paxAge${i}`} className="form-label">Age</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-calendar3" /></span>
                      <input type="number" id={`paxAge${i}`} className="form-control" min={1} max={120} required placeholder="Age"
                             value={p.age} onChange={(e) => setField(i, 'age', e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor={`paxGender${i}`} className="form-label">Gender</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-gender-ambiguous" /></span>
                      <select id={`paxGender${i}`} className="form-select" required value={p.gender} onChange={(e) => setField(i, 'gender', e.target.value)}>
                        <option value="">-- Select --</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor={`paxPhone${i}`} className="form-label">Phone (Optional)</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-telephone" /></span>
                      <input type="tel" id={`paxPhone${i}`} className="form-control" placeholder="Mobile Number" value={p.phone}
                             onChange={(e) => setField(i, 'phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor={`paxEmail${i}`} className="form-label">Email (Optional)</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-envelope" /></span>
                      <input type="email" id={`paxEmail${i}`} className="form-control" placeholder="Email Address" value={p.email}
                             onChange={(e) => setField(i, 'email', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-orange w-100 py-2" style={{ fontSize: '1.2rem' }} disabled={busy}>
              {busy ? <span className="spinner-border spinner-border-sm me-2" /> : null}
              Proceed to Payment <i className="bi bi-arrow-right-circle-fill ms-2" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
