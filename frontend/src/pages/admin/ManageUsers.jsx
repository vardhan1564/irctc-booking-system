import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import { fmtDateSpaced } from '../../utils/format';

/** Port of manageUsers.jsp */
export default function ManageUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  const load = () => adminApi.users().then(setUsers).catch((e) => { setError(errorMessage(e)); setUsers([]); });
  useEffect(() => { load(); }, []);

  const toggleBlock = async (u) => {
    setError('');
    try {
      const updated = u.blocked ? await adminApi.unblock(u.id) : await adminApi.block(u.id);
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) { setError(errorMessage(e)); }
  };

  const del = async (u) => {
    if (!window.confirm(`⚠️ NUCLEAR OPTION ⚠️\n\nDeleting User #${u.id} will WIPE:\n- Their Account\n- All Bookings\n- All Payments\n\nAre you absolutely sure?`)) return;
    setError('');
    try { await adminApi.deleteUser(u.id); load(); } catch (e) { setError(errorMessage(e)); }
  };

  return (
    <>
      <div className="page-header animate-entry">
        <div className="page-title"><i className="bi bi-people-fill me-2" /> User Management</div>
        <div className="text-muted">Total Users: <strong>{users?.length ?? '…'}</strong></div>
      </div>
      {error && <div className="alert alert-danger shadow-sm mb-4"><i className="bi bi-exclamation-octagon-fill me-2" />{error}</div>}
      <div className="admin-table-container animate-entry" style={{ animationDelay: '0.1s' }}>
        {users === null ? <div className="text-center p-5"><div className="spinner-border text-primary" /></div> : users.length ? (
          <table className="admin-table">
            <thead><tr><th>ID</th><th>User Details</th><th>Contact Info</th><th>Status</th><th>Joined On</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={u.blocked ? { borderLeft: '4px solid #e74a3b' } : undefined}>
                  <td className="fw-bold text-secondary">#{u.id}</td>
                  <td>
                    <div className="fw-bold text-dark">{u.fullName}</div>
                    <div className="small text-muted">{u.gender}{u.age ? `, Age: ${u.age}` : ''}</div>
                  </td>
                  <td>
                    <div className="text-dark"><i className="bi bi-envelope me-1" /> {u.email}</div>
                    <div className="small text-muted"><i className="bi bi-telephone me-1" /> {u.phone}</div>
                  </td>
                  <td>
                    {u.blocked ? <span className="badge bg-danger">BLOCKED</span>
                      : u.verified ? <span className="badge bg-success">VERIFIED</span>
                        : <span className="badge bg-warning text-dark">PENDING</span>}
                  </td>
                  <td className="text-muted small">{fmtDateSpaced(u.createdAt)}</td>
                  <td className="text-end text-nowrap">
                    <button type="button" className={`btn-action-icon ${u.blocked ? 'btn-icon-unblock' : 'btn-icon-block'}`}
                            title={u.blocked ? 'Unblock User' : 'Block User'} aria-label={`${u.blocked ? 'Unblock' : 'Block'} ${u.fullName}`}
                            onClick={() => toggleBlock(u)}>
                      <i className={`bi ${u.blocked ? 'bi-unlock-fill' : 'bi-lock-fill'}`} />
                    </button>
                    <button type="button" className="btn-action-icon btn-icon-delete" title="Delete User" aria-label={`Delete ${u.fullName}`} onClick={() => del(u)}>
                      <i className="bi bi-trash-fill" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-5"><i className="bi bi-people text-muted display-4" /><p className="mt-3 text-muted">No users found in the database.</p></div>
        )}
      </div>
    </>
  );
}
