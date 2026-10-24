import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { bookingApi, trainApi } from '../api';
import { errorMessage } from '../api/client';
import SeatMap from '../components/SeatMap';
import { Alert, Loader, useCountdown } from '../components/Common';
import { coachCode } from '../utils/seatLayout';

export const seatsKey = (id) => `irctc_seats_${id}`;

/** Port of seatSelection.jsp. All "pending*" session attributes now come from GET /api/bookings/{id}. */
export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [booked, setBooked] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    bookingApi.get(id).then((b) => {
      setBooking(b);
      if (b.status === 'PENDING') {
        trainApi.bookedSeats(b.trainId, b.journeyDate, coachCode(b.classCode)).then(setBooked).catch(() => setBooked([]));
      }
    }).catch((e) => setError(errorMessage(e)));
  }, [id]);

  const timer = useCountdown(booking?.status === 'PENDING' ? booking.expiresAt : null, () => {
    navigate('/', { state: { error: 'Session Expired! Your 10-minute booking window has ended.' } });
  });

  if (error) return <div className="container main-container mt-4"><div className="card-form mx-auto"><Alert>{error}</Alert></div></div>;
  if (!booking) return <Loader text="Loading Coach Layout..." />;
  if (booking.status === 'CONFIRMED') return <Navigate to={`/booking/${id}/success`} replace />;
  if (booking.status !== 'PENDING') return <Navigate to="/" replace state={{ error: 'This booking is no longer pending.' }} />;

  const max = booking.passengerCount;
  const toggle = (seat, full) => {
    setNotice('');
    if (full) { setNotice(`You can only select ${max} seat${max > 1 ? 's' : ''}.`); return; }
    setSelected((sel) => (sel.some((s) => s.no === seat.no) ? sel.filter((s) => s.no !== seat.no) : [...sel, seat]));
  };

  const go = (seats) => {
    sessionStorage.setItem(seatsKey(id), JSON.stringify(seats));
    navigate(`/booking/${id}/payment`);
  };

  return (
    <div className="page-seat container main-container mt-4">
      <div className="card-form mx-auto w-form-3xl" style={{ overflow: 'hidden' }}>
        <div className="seat-selection-header">
          <div className="header-title"><i className="bi bi-grid-3x3-gap-fill me-2" /> Select Your Seats</div>
          <div className="timer-pill" aria-live="polite">
            <i className="bi bi-stopwatch-fill text-warning" /><span>Time Left:</span>
            <span className={`timer-count${timer.critical ? ' text-danger' : ''}`}>{timer.text}</span>
          </div>
        </div>
        <div className="train-info-box">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h5 className="mb-1 text-dark">{booking.trainName}</h5>
              <span className="text-muted small">CLASS: <strong>{booking.classCode}</strong> &bull; COACH: <strong>{coachCode(booking.classCode)}</strong></span>
            </div>
            <div className="col-md-6 text-md-end mt-2 mt-md-0">
              <span className="text-muted">Passengers:</span>
              <span className="fs-5 fw-bold text-primary ms-2">{max}</span>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center flex-wrap gap-4 mb-4">
          <div className="d-flex align-items-center gap-2 legend-item"><div className="legend-box" style={{ border: '1px solid var(--irctc-blue)', background: 'white' }} /> Available</div>
          <div className="d-flex align-items-center gap-2 legend-item"><div className="legend-box" style={{ backgroundColor: '#e0e0e0', border: '1px solid #ccc' }} /> Booked</div>
          <div className="d-flex align-items-center gap-2 legend-item"><div className="legend-box" style={{ backgroundColor: 'var(--irctc-orange)', border: '1px solid var(--irctc-orange)' }} /> Selected</div>
        </div>
        {notice && <Alert type="warning" onClose={() => setNotice('')}>{notice}</Alert>}
        <div className="seat-scroll">
          <SeatMap classCode={booking.classCode} booked={booked} selected={selected} max={max} onToggle={toggle} />
        </div>
        <hr className="my-4" />
        <div className="seat-actions">
          <div>
            <span className="text-muted small text-uppercase fw-bold">Selected Seats</span><br />
            <span className="fs-5 fw-bold text-primary">
              {selected.length === 0 ? 'None' : selected.map((s, i) => <span key={s.no}>{i > 0 && ', '}<b>{s.no}</b> ({s.type})</span>)}
            </span>
          </div>
          <div className="btns">
            <button type="button" className="btn btn-outline-secondary" onClick={() => go([])}>Skip &amp; Auto-Assign</button>
            <button type="button" className="btn btn-orange px-4" disabled={selected.length !== max} onClick={() => go(selected.map((s) => s.no))}>
              Confirm &amp; Pay <i className="bi bi-arrow-right-circle-fill ms-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
