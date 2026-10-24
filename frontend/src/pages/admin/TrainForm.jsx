import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import { fmtTime } from '../../utils/format';

const EMPTY = { trainNumber: '', trainName: '', source: '', destination: '', departureTime: '', arrivalTime: '',
  totalSeats: '', availableSeats: '', fare: '' };

/** One component for both addTrain.jsp and editTrain.jsp (they were 95% identical). */
export default function TrainForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    adminApi.train(id).then((t) => {
      setF({ trainNumber: t.trainNumber, trainName: t.trainName, source: t.source, destination: t.destination,
        departureTime: fmtTime(t.departureTime), arrivalTime: fmtTime(t.arrivalTime), totalSeats: t.totalSeats,
        availableSeats: t.availableSeats, fare: t.farePerKm });
    }).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false));
  }, [id, editing]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const body = { ...f, totalSeats: Number(f.totalSeats), availableSeats: Number(f.availableSeats), fare: Number(f.fare) };
    try {
      if (editing) await adminApi.updateTrain(id, body); else await adminApi.createTrain(body);
      navigate('/admin/trains', { state: { success: `Train ${editing ? 'updated' : 'added'} successfully.` } });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const field = (k, label, icon, props = {}) => (
    <>
      <label className="form-label" htmlFor={k}>{label}</label>
      <div className="input-group">
        <span className="input-group-text">{icon.startsWith('bi') ? <i className={`bi ${icon}`} /> : icon}</span>
        <input id={k} className="form-control" required value={f[k]} onChange={set(k)} {...props} />
      </div>
    </>
  );

  return (
    <>
      <div className="page-header animate-entry">
        <div className="page-title"><i className={`bi ${editing ? 'bi-pencil-square' : 'bi-plus-circle-dotted'} me-2`} /> {editing ? 'Edit Train' : 'Add New Train'}</div>
        <Link to="/admin/trains" className="btn btn-outline-secondary fw-bold"><i className="bi bi-arrow-left me-1" /> Back to List</Link>
      </div>
      {error && <div className="alert alert-danger shadow-sm animate-entry"><i className="bi bi-exclamation-octagon-fill me-2" />{error}</div>}
      {loading ? <div className="text-center p-5"><div className="spinner-border text-primary" /></div> : (
        <div className="form-card animate-entry" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={submit}>
            <h5 className="mb-4 text-muted text-uppercase border-bottom pb-2">Train Details</h5>
            <div className="row g-3 mb-3">
              <div className="col-md-4">{field('trainNumber', 'Train Number', 'bi-123', { placeholder: 'e.g. 12951', maxLength: 10 })}</div>
              <div className="col-md-8">{field('trainName', 'Train Name', 'bi-train-front', { placeholder: 'e.g. Rajdhani Express', maxLength: 100 })}</div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">{field('source', 'Source Station', 'bi-geo-alt', { placeholder: 'Origin City' })}</div>
              <div className="col-md-6">{field('destination', 'Destination Station', 'bi-geo-alt-fill', { placeholder: 'Destination City' })}</div>
            </div>
            <h5 className="mb-3 mt-4 text-muted text-uppercase border-bottom pb-2">Schedule &amp; Capacity</h5>
            <div className="row g-3 mb-3">
              <div className="col-md-6"><label className="form-label" htmlFor="departureTime">Departure Time</label>
                <input type="time" id="departureTime" className="form-control" required value={f.departureTime} onChange={set('departureTime')} /></div>
              <div className="col-md-6"><label className="form-label" htmlFor="arrivalTime">Arrival Time</label>
                <input type="time" id="arrivalTime" className="form-control" required value={f.arrivalTime} onChange={set('arrivalTime')} /></div>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-4">{field('totalSeats', 'Total Seats', 'bi-grid-3x3', { type: 'number', min: 1, placeholder: 'Capacity' })}</div>
              <div className="col-md-4">{field('availableSeats', 'Available Seats', 'bi-check-square', { type: 'number', min: 0, placeholder: 'Initial' })}</div>
              <div className="col-md-4">{field('fare', 'Base Fare (₹/km)', '₹', { type: 'number', step: '0.01', min: 0, placeholder: 'Rate' })}</div>
            </div>
            <div className="text-end">
              <button type="submit" className="btn btn-success fw-bold px-5 py-2 shadow-sm" disabled={busy}>
                <i className="bi bi-save me-2" /> {editing ? 'Update Train' : 'Save Train'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
