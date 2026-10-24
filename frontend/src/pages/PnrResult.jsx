import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { publicApi } from '../api';
import { errorMessage } from '../api/client';
import { Loader } from '../components/Common';

function StatusBadge({ status }) {
  const s = status || '';
  if (s.includes('CNF') || s === 'CONFIRMED') return <span className="status-badge status-cnf"><i className="bi bi-check-circle-fill" /> {s}</span>;
  if (s.includes('CAN') || s.includes('MOD')) return <span className="status-badge status-can"><i className="bi bi-x-circle-fill" /> {s}</span>;
  return <span className="status-badge status-wl"><i className="bi bi-hourglass-split" /> {s}</span>;
}

/** Port of pnrResult.jsp + PublicPnrServlet (local booking or live IRCTC data, same layout). */
export default function PnrResult() {
  const { pnr } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null); setError('');
    publicApi.pnr(pnr).then(setData).catch((e) => setError(errorMessage(e, 'PNR not found.')));
  }, [pnr]);

  if (error) return <Navigate to="/pnr" replace state={{ error }} />;
  if (!data) return <Loader text="Fetching PNR status..." />;
  const isLocal = data.source === 'LOCAL';

  return (
    <div className="page-pnr-result container main-container">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="ticket-card">
            <div className="ticket-header">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="fs-4 fw-bold text-dark">PNR: {data.pnr}</span>
                <span className={`source-badge ${isLocal ? 'bg-primary text-white' : 'bg-warning text-dark'}`}>
                  {isLocal ? 'Internal Booking' : 'Live IRCTC Data'}
                </span>
              </div>
              <Link to="/pnr" className="btn btn-outline-secondary btn-sm fw-bold"><i className="bi bi-search me-1" /> Check Another</Link>
            </div>
            <div className="ticket-body">
              <div className="row mb-5">
                <div className="col-md-4 mb-3 mb-md-0">
                  <div className="info-label">Train</div>
                  <div className="info-value"><i className="bi bi-train-front text-secondary me-2" />{data.trainInfo}</div>
                </div>
                <div className="col-md-4 mb-3 mb-md-0 text-md-center">
                  <div className="info-label">Journey Route</div>
                  <div className="route-line">{data.from} <i className="bi bi-arrow-right mx-2 text-muted" /> {data.to}</div>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="info-label">Date of Journey</div>
                  <div className="info-value"><i className="bi bi-calendar-event text-secondary me-2" />{data.journeyDate}</div>
                </div>
              </div>
              <h6 className="text-muted text-uppercase fw-bold mb-3 pb-2 border-bottom">Passenger Details</h6>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light"><tr><th>Passenger</th><th>Current Status</th><th>Coach / Berth</th></tr></thead>
                  <tbody>
                    {data.passengers.map((p, i) => (
                      <tr key={i}>
                        <td className="fw-bold text-muted"><i className="bi bi-person-fill me-2" />{p.name}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td>{p.coach ? <><strong>{p.coach} / {p.berth}</strong>{p.berthType && <span className="text-muted small"> [{p.berthType}]</span>}</> : '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
