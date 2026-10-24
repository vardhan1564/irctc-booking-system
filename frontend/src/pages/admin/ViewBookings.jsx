import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import { fmtDateShort } from '../../utils/format';

/** Port of viewBookings.jsp */
export default function ViewBookings() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  const load = () => adminApi.bookings().then(setList).catch((e) => { setError(errorMessage(e)); setList([]); });
  useEffect(() => { load(); }, []);

  const forceCancel = async (id) => {
    if (!window.confirm(`⚠️ FORCE CANCEL PNR ${id}?\n\nThis will bypass normal cancellation rules.\nProceed?`)) return;
    setError('');
    try { await adminApi.forceCancel(id); load(); } catch (e) { setError(errorMessage(e)); }
  };

  return (
    <>
      <div className="page-header animate-entry">
        <div className="page-title"><i className="bi bi-ticket-perforated-fill me-2" /> Global Booking Log</div>
        <button type="button" className="btn btn-light border shadow-sm fw-bold" onClick={() => window.print()}><i className="bi bi-printer me-1" /> Print Report</button>
      </div>
      {error && <div className="alert alert-danger shadow-sm animate-entry"><i className="bi bi-exclamation-triangle-fill me-2" />{error}</div>}
      <div className="admin-table-container animate-entry" style={{ animationDelay: '0.1s' }}>
        {list === null ? <div className="text-center p-5"><div className="spinner-border text-primary" /></div> : list.length ? (
          <table className="admin-table">
            <thead><tr><th>PNR</th><th>User Email</th><th>Train Info</th><th>Route</th><th>Date</th><th>Amount</th><th>Status</th><th className="text-end">God Mode</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.bookingId}>
                  <td className="fw-bold text-primary">#{b.bookingId}</td>
                  <td className="text-muted small"><i className="bi bi-person me-1" /> {b.userEmail}</td>
                  <td className="fw-bold text-dark">{b.trainNumber}</td>
                  <td className="small">
                    <div className="d-flex align-items-center">
                      <span className="text-uppercase fw-bold">{b.segmentSource}</span>
                      <i className="bi bi-arrow-right mx-2 text-muted" />
                      <span className="text-uppercase fw-bold">{b.segmentDestination}</span>
                    </div>
                  </td>
                  <td className="text-muted small">{fmtDateShort(b.journeyDate)}</td>
                  <td className="fw-bold text-dark">₹{Math.round(Number(b.totalAmount)).toLocaleString('en-IN')}</td>
                  <td>
                    {b.status === 'CONFIRMED' ? <span className="badge bg-success">CONFIRMED</span>
                      : b.status === 'CANCELLED' ? <span className="badge bg-danger">CANCELLED</span>
                        : <span className="badge bg-warning text-dark">{b.status}</span>}
                  </td>
                  <td className="text-end">
                    {b.status === 'CONFIRMED' ? (
                      <button type="button" className="btn btn-sm btn-outline-danger fw-bold" style={{ fontSize: '0.7rem' }} onClick={() => forceCancel(b.bookingId)}>
                        <i className="bi bi-x-circle-fill me-1" /> Force Cancel
                      </button>
                    ) : <span className="text-muted small fst-italic">--</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-5"><i className="bi bi-journal-x text-muted display-4" /><p className="mt-3 text-muted">No bookings found in system records.</p></div>
        )}
      </div>
    </>
  );
}
