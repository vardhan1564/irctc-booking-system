import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { publicApi } from '../api';
import { errorMessage } from '../api/client';
import { Loader } from '../components/Common';

/** Port of liveStatusResult.jsp + LiveStatusServlet. "Refresh" re-fetches instead of reloading the page. */
export default function LiveStatusResult() {
  const { trainNo } = useParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    return publicApi.live(trainNo).then(setD).catch((e) => setError(errorMessage(e))).finally(() => setRefreshing(false));
  }, [trainNo]);

  useEffect(() => { load(); }, [load]);

  if (error) return <Navigate to="/live-status" replace state={{ error }} />;
  if (!d) return <Loader text="Locating train..." />;
  const pct = d.totalDistance > 0 ? Math.min(100, Math.max(0, (d.distanceCovered / d.totalDistance) * 100)) : 0;

  return (
    <div className="page-live container main-container">
      <div className="live-card">
        <div className="live-header">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div>
              <h2 className="mb-1 fw-bold">{d.trainName}</h2>
              <div className="opacity-75">
                Train #{d.trainNumber} &bull;{' '}
                {d.delayMinutes > 0
                  ? <span className="text-warning fw-bold"><i className="bi bi-clock-history" /> Late by {d.delayMinutes} min</span>
                  : <span className="text-success fw-bold"><i className="bi bi-check-circle-fill" /> On Time</span>}
              </div>
            </div>
            <button type="button" onClick={load} disabled={refreshing} className="btn btn-light btn-sm fw-bold text-primary border-0 shadow-sm">
              <i className="bi bi-arrow-clockwise" /> Refresh
            </button>
          </div>
        </div>
        <div className="tracker-container">
          <div className="d-flex justify-content-between align-items-end mb-2">
            <div><small className="text-muted text-uppercase fw-bold">Distance Covered</small><div className="fs-4 fw-bold text-primary">{Math.round(d.distanceCovered)} km</div></div>
            <div className="text-end"><small className="text-muted text-uppercase fw-bold">Total Distance</small><div className="fs-4 fw-bold text-dark">{Math.round(d.totalDistance)} km</div></div>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: `${pct}%` }}>
              <div className="train-icon-puck"><i className="bi bi-train-front-fill" /></div>
            </div>
          </div>
          <div className="track-labels"><span>Start</span><span>Destination</span></div>
        </div>
        <div className="timeline-wrapper">
          <h6 className="text-muted text-uppercase fw-bold mb-4 ps-2"><i className="bi bi-list-ul me-2" />Journey Timeline</h6>
          <div className="timeline-row next">
            <div className="col-time"><span className="t-label">ETA</span><span className="t-val text-primary">{d.nextStoppageEta || '--'}</span></div>
            <div className="col-line"><div className="v-line" /><div className="v-dot" /></div>
            <div className="col-content">
              <span className="status-pill text-primary">UPCOMING</span>
              <div className="station-title">{d.nextStoppage || '--'}</div>
              <div className="station-desc">Next scheduled halt.</div>
            </div>
          </div>
          <div className="timeline-row current">
            <div className="col-time"><span className="t-label">ARRIVAL</span><span className="t-val text-danger">{d.currentEta || '--'}</span></div>
            <div className="col-line"><div className="v-line" /><div className="v-dot" /></div>
            <div className="col-content">
              <span className="status-pill pill-current">CURRENT LOCATION</span>
              <div className="station-title text-dark" style={{ fontSize: '1.3rem' }}>{d.currentStation || '--'}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mb-5"><Link to="/live-status" className="btn btn-secondary">Track Another Train</Link></div>
    </div>
  );
}
