import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Port of navbar.jsp. The collapse is React state, so it closes automatically after navigating. */
export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/', { state: { success: 'You have been logged out successfully.' } });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-custom fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src="/assets/images/irctc.png" alt="IRCTC Logo" style={{ height: 30, marginRight: 5 }} />
          IRCTC Clone
        </Link>
        <button className="navbar-toggler" type="button" aria-controls="navbarNav" aria-expanded={open}
                aria-label="Toggle navigation" onClick={() => setOpen((o) => !o)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse${open ? ' show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            {!isLoggedIn ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login"><i className="bi bi-box-arrow-in-right me-1" /> Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/register"><i className="bi bi-person-plus-fill me-1" /> Register</NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/profile" title="View Profile">
                    <i className="bi bi-person-circle me-1" /> Welcome, {user.fullName}!
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/bookings"><i className="bi bi-ticket-perforated-fill me-1" /> My Bookings</NavLink>
                </li>
                <li className="nav-item">
                  <button type="button" className="nav-link btn btn-link text-start w-100" onClick={handleLogout}>
                    <i className="bi bi-power me-1" /> Logout
                  </button>
                </li>
              </>
            )}
            <li className="nav-item">
              <img src="/assets/images/ir.png" alt="Indian Railways Logo" style={{ height: 35, marginLeft: 15 }} />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
