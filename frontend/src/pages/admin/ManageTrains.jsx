import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import { fmtTime } from '../../utils/format';

/** Port of manageTrains.jsp */
export default function ManageTrains() {
  const location = useLocation();
  const [trains, setTrains] = useState(null);
  const [msg, setMsg] = useState({ success: location.state?.success });

  const load = () => adminApi.trains().then(setTrains).catch((e) => { setMsg({ error: errorMessage(e) }); setTrains([]); });
  useEffect(() => { load(); }, []);

  const del = async (t) => {
    if (!window.confirm(`⚠️ WARNING ⚠️\n\nDeleting train ${t.trainNumber} is permanent.\nIt may affect historical booking data.\n\nProceed?`)) return;
    try { const r = await adminApi.deleteTrain(t.id); setMsg({ success: r.message }); load(); }
    catch (e) { setMsg({ error: errorMessage(e) }); }
  };

  return (
    <>
      <div className="page-header animate-entry">
        <div className="page-title"><i className="bi bi-train-front-fill me-2" /> Train Operations</div>
        <Link to="/admin/trains/new" className="btn btn-primary fw-bold shadow-sm"><i className="bi bi-plus-lg me-1" /> Add New Train</Link>
      </div>
      {msg.success && <div className="alert alert-success shadow-sm animate-entry"><i className="bi bi-check-circle-fill me-2" />{msg.success}</div>}
      {msg.error && <div className="alert alert-danger shadow-sm animate-entry"><i className="bi bi-exclamation-octagon-fill me-2" />{msg.error}</div>}
      <div className="admin-table-container animate-entry" style={{ animationDelay: '0.1s' }}>
        {trains === null ? <div className="text-center p-5"><div className="spinner-border text-primary" /></div> : trains.length ? (
          <table className="admin-table">
            <thead><tr><th>Train No</th><th>Name &amp; Route</th><th>Schedule</th><th>Capacity</th><th>Base Fare</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {trains.map((t) => (
                <tr key={t.id}>
                  <td className="fw-bold text-primary">#{t.trainNumber}</td>
                  <td>
                    <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{t.trainName}</div>
                    <div className="small text-muted"><i className="bi bi-geo-alt-fill text-secondary" /> {t.source} &rarr; {t.destination}</div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-dark border">Dep: {fmtTime(t.departureTime)}</span>
                      <i className="bi bi-arrow-right text-muted small" />
                      <span className="badge bg-light text-dark border">Arr: {fmtTime(t.arrivalTime)}</span>
                    </div>
                  </td>
                  <td>
                    {t.availableSeats === 0 ? <span className="badge bg-danger">FULL</span>
                      : t.availableSeats < 20 ? <span className="badge bg-warning text-dark">FAST FILLING</span>
                        : <span className="badge bg-success">AVAILABLE</span>}
                    <div className="small text-muted mt-1"><strong>{t.availableSeats}</strong> / {t.totalSeats} seats</div>
                  </td>
                  <td className="fw-bold text-dark">₹{Number(t.farePerKm).toFixed(2)} <span className="small text-muted fw-normal">/km</span></td>
                  <td className="text-end text-nowrap">
                    <Link to={`/admin/trains/${t.id}/edit`} className="btn-action-icon btn-icon-edit" title="Edit Train" aria-label={`Edit ${t.trainName}`}>
                      <i className="bi bi-pencil-fill" />
                    </Link>
                    <button type="button" className="btn-action-icon btn-icon-delete" title="Delete Train" aria-label={`Delete ${t.trainName}`} onClick={() => del(t)}>
                      <i className="bi bi-trash-fill" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-5">
            <i className="bi bi-train-lightrail-front text-muted display-4" />
            <p className="mt-3 text-muted">No trains found in the fleet.</p>
            <Link to="/admin/trains/new" className="btn btn-outline-primary btn-sm">Add First Train</Link>
          </div>
        )}
      </div>
    </>
  );
}
