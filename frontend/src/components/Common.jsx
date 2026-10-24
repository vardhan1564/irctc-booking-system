import { useEffect, useState } from 'react';

export function Loader({ text = 'Loading...' }) {
  return (
    <div className="text-center p-5 text-muted" role="status">
      <div className="spinner-border text-primary mb-3" />
      <div>{text}</div>
    </div>
  );
}

/** Bootstrap alert with the same icons/classes the JSPs used. */
export function Alert({ type = 'danger', children, onClose, className = '' }) {
  if (!children) return null;
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'info' ? 'bi-info-circle-fill' : 'bi-exclamation-triangle-fill';
  const cls = type === 'success' ? 'success-message' : type === 'danger' ? 'error-message' : '';
  return (
    <div className={`alert alert-${type} message ${cls} d-flex align-items-start ${className}`} role="alert">
      <i className={`bi ${icon} me-2 mt-1`} />
      <div className="flex-grow-1">{children}</div>
      {onClose && <button type="button" className="btn-close ms-2" aria-label="Close" onClick={onClose} />}
    </div>
  );
}

/**
 * Countdown to a server-provided expiry time (ISO string with offset).
 * The old app stored its own expiry in sessionStorage, so two tabs could disagree with the server.
 */
export function useCountdown(expiresAt, onExpire) {
  const [left, setLeft] = useState(() => (expiresAt ? new Date(expiresAt).getTime() - Date.now() : null));
  useEffect(() => {
    if (!expiresAt) return undefined;
    const end = new Date(expiresAt).getTime();
    let fired = false;
    const tick = () => {
      const ms = end - Date.now();
      setLeft(ms);
      if (ms <= 0 && !fired) { fired = true; onExpire?.(); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);
  if (left == null) return { text: '10:00', critical: false, expired: false };
  const s = Math.max(0, Math.floor(left / 1000));
  return {
    text: `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
    critical: s < 60,
    expired: left <= 0,
  };
}
