import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../api';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Loader } from '../components/Common';
import { fmtDate } from '../utils/format';

/** Port of profile.jsp + UpdateProfileServlet */
export default function Profile() {
  const { updateUser } = useAuth();
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    userApi.me().then((u) => {
      setMe(u);
      setForm({ fullName: u.fullName || '', phone: u.phone || '', address: u.address || '' });
    }).catch((e) => setMsg({ error: errorMessage(e) }));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg({});
    try {
      const u = await userApi.update(form);
      setMe(u); updateUser(u);
      setMsg({ success: 'Profile updated successfully!' });
    } catch (err) {
      setMsg({ error: errorMessage(err, 'Failed to update profile. Please try again.') });
    } finally {
      setBusy(false);
    }
  };

  if (!me) return msg.error ? <div className="container mt-5"><Alert>{msg.error}</Alert></div> : <Loader />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="page-profile container main-container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="card-form" style={{ maxWidth: '100%' }}>
            <div className="text-center mb-4">
              <i className="bi bi-person-circle profile-header-icon" />
              <h2 className="mt-2">My Profile</h2>
              <p className="text-muted">Manage your personal details</p>
            </div>
            <Alert type="success">{msg.success}</Alert>
            <Alert>{msg.error}</Alert>
            <form onSubmit={save}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold" htmlFor="uid">User ID</label>
                  <input id="uid" className="form-control" value={me.id} disabled readOnly />
                </div>
                <div className="col-md-8 mb-3">
                  <span className="form-label fw-bold d-block">Account Status</span>
                  <div className="form-control bg-light d-flex align-items-center flex-wrap gap-2">
                    {me.verified
                      ? <span className="verified-badge"><i className="bi bi-patch-check-fill me-1" /> Verified</span>
                      : <span className="unverified-badge"><i className="bi bi-exclamation-circle-fill me-1" /> Not Verified</span>}
                    <span className="ms-auto text-muted small">Joined: {fmtDate(me.createdAt)}</span>
                  </div>
                </div>
              </div>
              <hr />
              <div className="mb-3">
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-person-vcard-fill" /></span>
                  <input id="fullName" className="form-control" required value={form.fullName} onChange={set('fullName')} maxLength={100} />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label" htmlFor="pemail">Email Address <span className="text-muted small">(Cannot be changed)</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light"><i className="bi bi-envelope-fill text-muted" /></span>
                    <input id="pemail" type="email" className="form-control bg-light" value={me.email} disabled readOnly />
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="phone" className="form-label">Phone Number</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-telephone-fill" /></span>
                    <input type="tel" id="phone" className="form-control" required pattern="[0-9+\- ]{10,15}" value={form.phone} onChange={set('phone')} />
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="address" className="form-label">Address</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-house-fill" /></span>
                  <textarea id="address" className="form-control" rows={2} required maxLength={255} value={form.address} onChange={set('address')} />
                </div>
              </div>
              <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                <Link to="/" className="btn btn-secondary me-md-2">Cancel</Link>
                <button type="submit" className="btn btn-orange" disabled={busy}><i className="bi bi-floppy-fill me-2" /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
