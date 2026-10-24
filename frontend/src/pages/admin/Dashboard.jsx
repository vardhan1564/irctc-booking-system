import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';

/** Port of admin/dashboard.jsp + AdminDashboardServlet + "God Mode" form of AdminActionServlet */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [id, setId] = useState('');
  const [action, setAction] = useState('BLOCK_USER');
  const [msg, setMsg] = useState({});

  const load = () => adminApi.dashboard().then(setStats).catch((e) => setMsg({ error: errorMessage(e) }));
  useEffect(() => { load(); }, []);

  const execute = async (e) => {
    e.preventDefault();
    const label = action === 'BLOCK_USER' ? `block user #${id}` : `force-cancel PNR ${id}`;
    if (!window.confirm(`Are you sure you want to ${label}?`)) return;
    setMsg({});
    try {
      const r = action === 'BLOCK_USER' ? await adminApi.block(id) : await adminApi.forceCancel(id);
      setMsg({ success: r.message || `User #${id} blocked.` });
      setId('');
      load();
    } catch (err) {
      setMsg({ error: errorMessage(err) });
    }
  };

  return (
    <>
      <div className="page-header animate-entry">
        <div className="page-title"><i className="bi bi-speedometer2 me-2" /> Dashboard Overview</div>
        <div className="text-muted">System Status: <span className="badge bg-success">ONLINE</span></div>
      </div>
      {msg.error && <div className="alert alert-danger shadow-sm">{msg.error}</div>}
      {msg.success && <div className="alert alert-success shadow-sm">{msg.success}</div>}

      <div className="row g-4 mb-5 animate-entry" style={{ animationDelay: '0.1s' }}>
        <div className="col-md-6 col-xl-3">
          <div className="stat-card card-revenue">
            <div className="stat-val"><small style={{ fontSize: '1rem' }}>₹</small> {stats ? Math.round(Number(stats.revenue)).toLocaleString('en-IN') : '…'}</div>
            <div className="stat-label">Total Revenue</div>
            <i className="bi bi-currency-rupee stat-icon" />
          </div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="stat-card card-users"><div className="stat-val">{stats?.users ?? '…'}</div>
            <div className="stat-label">Registered Users</div><i className="bi bi-people-fill stat-icon" /></div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="stat-card card-blocked"><div className="stat-val text-danger">{stats?.blocked ?? '…'}</div>
            <div className="stat-label">Blocked Accounts</div><i className="bi bi-slash-circle-fill stat-icon" /></div>
        </div>
        <div className="col-md-6 col-xl-3">
          <div className="stat-card card-trains"><div className="stat-val text-warning">{stats?.trains ?? '…'}</div>
            <div className="stat-label">Active Trains</div><i className="bi bi-train-front-fill stat-icon" /></div>
        </div>
      </div>

      <div className="row g-4 animate-entry" style={{ animationDelay: '0.2s' }}>
        <div className="col-lg-5">
          <div className="admin-table-container h-100">
            <h5 className="mb-4 fw-bold text-dark"><i className="bi bi-lightning-charge-fill text-warning me-2" /> God Mode Actions</h5>
            <form onSubmit={execute} className="mb-4">
              <label className="form-label small text-muted text-uppercase fw-bold" htmlFor="godId">Emergency Override</label>
              <div className="input-group mb-3 flex-wrap flex-sm-nowrap">
                <input id="godId" type="number" min={1} className="form-control" placeholder="Enter ID (User/PNR)" required
                       value={id} onChange={(e) => setId(e.target.value)} />
                <select className="form-select" style={{ maxWidth: '9.5rem', minWidth: '8.5rem', fontWeight: 600 }} value={action} onChange={(e) => setAction(e.target.value)} aria-label="Action">
                  <option value="BLOCK_USER">Block User</option>
                  <option value="FORCE_CANCEL_BOOKING">Cancel PNR</option>
                </select>
                <button type="submit" className="btn btn-danger fw-bold">EXECUTE</button>
              </div>
            </form>
            <div className="alert alert-light border small text-muted">
              <i className="bi bi-info-circle me-1" /> <strong>Note:</strong> "Force Cancel" bypasses all refund rules. "Block User" prevents future logins and ends active sessions.
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="admin-table-container h-100">
            <h5 className="mb-4 fw-bold text-dark">System Shortcuts</h5>
            <div className="row g-3">
              <div className="col-sm-6"><Link to="/admin/trains/new" className="btn btn-outline-primary w-100 p-3 text-start fw-bold"><i className="bi bi-plus-circle-fill me-2" /> Add New Train</Link></div>
              <div className="col-sm-6"><Link to="/admin/users" className="btn btn-outline-dark w-100 p-3 text-start fw-bold"><i className="bi bi-person-gear me-2" /> Manage Users</Link></div>
              <div className="col-sm-6"><Link to="/admin/bookings" className="btn btn-outline-success w-100 p-3 text-start fw-bold"><i className="bi bi-ticket-detailed-fill me-2" /> View Booking Logs</Link></div>
              <div className="col-sm-6"><a href="/" target="_blank" rel="noreferrer" className="btn btn-outline-secondary w-100 p-3 text-start fw-bold"><i className="bi bi-box-arrow-up-right me-2" /> Open User Site</a></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
