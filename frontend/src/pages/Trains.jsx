import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { trainApi } from '../api';
import { errorMessage } from '../api/client';
import { Alert, Loader } from '../components/Common';
import { fmtDateLong, fmtTime, parseLocalDate, toIsoDate } from '../utils/format';

// Same display multipliers and simulated per-class availability as trains.jsp
const CLASSES = [
  { code: 'SL', title: 'Sleeper (SL)', mult: 1.0, seatOffset: 0 },
  { code: '3A', title: 'AC 3 Tier (3A)', mult: 1.8, seatOffset: 25 },
  { code: '2A', title: 'AC 2 Tier (2A)', mult: 2.5, seatOffset: 45 },
  { code: '1A', title: 'AC First (1A)', mult: 4.0, seatOffset: 55 },
];

function statusFor(seats) {
  if (seats > 0) return { cls: '', text: `AVL ${seats}` };
  if (seats > -20) return { cls: 'status-rac', text: `RAC ${Math.abs(seats)}` };
  return { cls: 'status-wl', text: `WL ${Math.abs(seats)}` };
}

function TrainCard({ train, journeyDate, source, destination }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [dateIdx, setDateIdx] = useState(0);
  const isRajdhani = /rajdhani/i.test(train.trainName);
  const classes = CLASSES.filter((c) => !(isRajdhani && c.code === 'SL'));
  const base = Number(train.ticketPrice || 0);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = parseLocalDate(journeyDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const choose = (c) => { setActive(c); setDateIdx(0); };
  const seatsOn = (i) => train.availableSeats - active.seatOffset - i * 8;

  const book = () => {
    // Improvement: the date card you pick is the date that gets booked (it was display-only before).
    const q = new URLSearchParams({
      trainId: train.id, classCode: active.code, journeyDate: toIsoDate(dates[dateIdx]), source, destination,
    });
    navigate(`/booking?${q.toString()}`);
  };

  return (
    <div className="train-card">
      <div className="card-top">
        <div className="train-info">
          <div className="train-name">{train.trainName} ({train.trainNumber})</div>
          <div className="runs-on"><i className="bi bi-calendar-week me-1" /> Runs Daily</div>
        </div>
        <div className="train-schedule">
          <div className="text-end">
            <div className="time-val">{fmtTime(train.segmentDepartureTime || train.departureTime)}</div>
            <div className="stn-val">DEP</div>
          </div>
          <div className="duration-line"><span className="duration-text">Direct</span></div>
          <div className="text-start">
            <div className="time-val">{fmtTime(train.segmentArrivalTime || train.arrivalTime)}</div>
            <div className="stn-val">ARR</div>
          </div>
        </div>
      </div>
      <div className="class-tabs" role="tablist">
        {classes.map((c) => (
          <button type="button" key={c.code} role="tab" aria-selected={active?.code === c.code}
                  className={`class-btn${active?.code === c.code ? ' active' : ''}`} onClick={() => choose(c)}>
            <span className="cls-title">{c.title}</span>
            <span className="cls-sub">Refresh <i className="bi bi-arrow-clockwise" /></span>
          </button>
        ))}
      </div>
      {active && (
        <div className="availability-panel">
          <div className="date-slider">
            {dates.map((d, i) => {
              const st = statusFor(seatsOn(i));
              return (
                <button type="button" key={i} className={`date-card${i === dateIdx ? ' selected' : ''}`} onClick={() => setDateIdx(i)}>
                  <div className="date-val">{d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                  <div className={`status-val ${st.cls}`}>{st.text}</div>
                </button>
              );
            })}
          </div>
          <div className="book-action">
            <div className="d-flex flex-column">
              <span className="text-muted small fw-bold text-uppercase">Total Base Fare</span>
              <div className="final-price">₹ {Math.round(base * active.mult)}</div>
            </div>
            <button type="button" className="btn btn-orange fw-bold px-5 py-3 fs-5 shadow-sm rounded-pill" onClick={book}>Book Now</button>
          </div>
          <button type="button" className="btn-minimize" title="Close" aria-label="Close availability" onClick={() => setActive(null)}>
            <i className="bi bi-chevron-up" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Port of trains.jsp + TrainListServlet */
export default function Trains() {
  const [params] = useSearchParams();
  const source = params.get('source') || '';
  const destination = params.get('destination') || '';
  const journeyDate = params.get('journeyDate') || toIsoDate(new Date());
  const [trains, setTrains] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setTrains(null); setError('');
    trainApi.search(source, destination)
      .then(setTrains)
      .catch((e) => { setError(errorMessage(e, 'An error occurred while searching.')); setTrains([]); });
  }, [source, destination]);

  return (
    <div className="page-trains container main-container mt-4">
      <div className="search-header">
        <div>
          <h4 className="mb-1 text-white" style={{ fontWeight: 800 }}>
            {source} <i className="bi bi-arrow-right text-white-50 mx-2" /> {destination}
          </h4>
          <div className="text-white-50 small">
            <i className="bi bi-calendar-event me-1" /> <strong>{fmtDateLong(journeyDate)}</strong>
            {trains && <> &bull; {trains.length} Trains Found</>}
          </div>
        </div>
        <Link to="/" className="btn btn-outline-light btn-sm fw-bold"><i className="bi bi-pencil-square me-1" /> Modify Search</Link>
      </div>
      <Alert>{error}</Alert>
      {trains === null ? <Loader text="Searching trains..." /> : trains.length > 0 ? (
        trains.map((t) => <TrainCard key={t.id} train={t} journeyDate={journeyDate} source={source} destination={destination} />)
      ) : !error && (
        <div className="alert alert-warning text-center p-5 shadow-sm border-0">
          <i className="bi bi-exclamation-circle display-4 text-warning mb-3 d-block" />
          <h4>No Trains Found</h4>
          <p className="text-muted">Try changing the date or station.</p>
          <Link to="/" className="btn btn-outline-primary mt-2">Search Again</Link>
        </div>
      )}
    </div>
  );
}
