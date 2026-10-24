import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

/** Port of adminNavbar.jsp + the admin page wrapper. Adds an admin-only body class for admin.css. */
export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('admin-body');
    return () => document.body.classList.remove('admin-body');
  }, []);

  const doLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin-wrapper">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <img src="/assets/images/irctc.png" alt="Logo"
               style={{ height: 35, background: 'white', padding: 2, borderRadius: 4, marginRight: 10 }} />
          <span>IRCTC ADMIN</span>
        </div>
        <ul className="sidebar-menu">
          <li><NavLink end to="/admin"><i className="bi bi-speedometer2" /> Dashboard</NavLink></li>
          <li><NavLink to="/admin/trains"><i className="bi bi-train-front-fill" /> Manage Trains</NavLink></li>
          <li><NavLink to="/admin/users"><i className="bi bi-people-fill" /> Manage Users</NavLink></li>
          <li><NavLink to="/admin/bookings"><i className="bi bi-ticket-perforated-fill" /> All Bookings</NavLink></li>
          <li style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button type="button" className="logout-link" onClick={doLogout}><i className="bi bi-power" /> Logout</button>
          </li>
        </ul>
        <div style={{ padding: 20, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 'auto' }}>
          Logged in as<br /><strong style={{ color: 'white' }}>{admin?.fullName}</strong>
        </div>
      </nav>
      <div className="main-content"><Outlet /></div>
    </div>
  );
}
