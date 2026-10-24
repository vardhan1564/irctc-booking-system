import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { bookingApi, paymentApi } from '../api';
import { errorMessage } from '../api/client';
import { Alert, Loader, useCountdown } from '../components/Common';
import { inr } from '../utils/format';
import { seatsKey } from './SeatSelection';

/** Port of payment.jsp + PaymentServlet (dummy) + StripeSessionServlet */
export default function Payment() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [gateway, setGateway] = useState('stripe');
  const [error, setError] = useState(params.get('error') === 'cancelled' ? 'Payment was cancelled. You can try again.' : '');
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const seats = (() => { try { return JSON.parse(sessionStorage.getItem(seatsKey(id))) || []; } catch { return []; } })();

  useEffect(() => {
    bookingApi.get(id).then(setBooking).catch((e) => setLoadError(errorMessage(e)));
  }, [id]);

  const timer = useCountdown(booking?.status === 'PENDING' ? booking.expiresAt : null, () => {
    navigate('/', { state: { error: 'Session Expired! Your 10-minute booking window has ended.' } });
  });

  const done = () => { sessionStorage.removeItem(seatsKey(id)); navigate(`/booking/${id}/success`, { replace: true }); };

  const payStripe = async () => {
    setBusy(true); setError('');
    try {
      const { url } = await paymentApi.stripeSession(Number(id), seats);
      window.location.href = url; // Stripe-hosted checkout; it redirects back to /payment/stripe-success
    } catch (e) {
      setError(`Payment Error: ${errorMessage(e)}`);
      setBusy(false);
    }
  };

  const payDummy = async () => {
    setBusy(true); setError('');
    try {
      await paymentApi.dummy(Number(id), seats);
      done();
    } catch (e) {
      if (e.response?.status === 410) {
        navigate('/', { state: { error: errorMessage(e) } });
        return;
      }
      setError(`Payment Failed: ${errorMessage(e)}`);
      setBusy(false);
    }
  };

  if (loadError) return <div className="container main-container mt-4"><div className="card-form mx-auto"><Alert>{loadError}</Alert></div></div>;
  if (!booking) return <Loader />;
  if (booking.status === 'CONFIRMED') return <Navigate to={`/booking/${id}/success`} replace />;

  return (
    <div className="page-payment container main-container mt-4">
      <div className="card-form mx-auto w-form-xl" style={{ overflow: 'hidden' }}>
        <div className="payment-header">
          <div className="header-title"><i className="bi bi-credit-card-2-front-fill" /> Payment</div>
          <div className="timer-pill" aria-live="polite">
            <i className="bi bi-hourglass-split text-warning" /><span>Time Left:</span>
            <span className={`timer-count${timer.critical ? ' text-danger' : ''}`}>{timer.text}</span>
          </div>
        </div>

        {booking.status !== 'PENDING' ? (
          <div className="alert alert-danger text-center">
            <i className="bi bi-exclamation-triangle-fill me-2" /> Session expired.
            <div className="mt-2"><Link to="/" className="btn btn-sm btn-primary">Back to Home</Link></div>
          </div>
        ) : (
          <>
            <Alert>{error}</Alert>
            <div className="pay-summary">
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <span className="text-muted small text-uppercase fw-bold">Total Amount</span>
                <span className="fs-3 fw-bold" style={{ color: 'var(--irctc-blue)' }}>{inr(booking.totalAmount)}</span>
              </div>
              <div className="small text-muted"><i className="bi bi-train-front me-1" /> {booking.trainName} &bull; {booking.classCode} &bull; PNR {booking.bookingId}</div>
              <div className="small text-muted mt-1">
                <i className="bi bi-grid-3x3-gap me-1" /> Seats: {seats.length ? seats.join(', ') : 'Auto-assign'}
              </div>
            </div>

            <span className="form-label text-muted fw-bold small mb-3 text-uppercase d-block">Select Payment Method</span>
            <div className="row g-3 mb-4">
              <div className="col-6">
                <button type="button" className={`gateway-option${gateway === 'stripe' ? ' active' : ''}`} aria-pressed={gateway === 'stripe'} onClick={() => setGateway('stripe')}>
                  <i className="bi bi-stripe gateway-icon" style={{ color: '#635bff' }} />
                  <div className="fw-bold">Stripe</div>
                  <div className="small text-muted">Credit/Debit Cards</div>
                </button>
              </div>
              <div className="col-6">
                <button type="button" className={`gateway-option${gateway === 'dummy' ? ' active' : ''}`} aria-pressed={gateway === 'dummy'} onClick={() => setGateway('dummy')}>
                  <i className="bi bi-wallet2 gateway-icon" style={{ color: '#6c757d' }} />
                  <div className="fw-bold">Dummy Pay</div>
                  <div className="small text-muted">Test Simulator</div>
                </button>
              </div>
            </div>

            {gateway === 'stripe' ? (
              <div className="payment-section">
                <div className="stripe-box">
                  <i className="bi bi-shield-check text-success fs-1 mb-3 d-block" />
                  <h5 className="mb-2">Secure Checkout</h5>
                  <p className="text-muted small mb-4">You will be redirected to Stripe's secure payment page to complete your transaction.</p>
                  <button type="button" className="btn-stripe shadow-sm" onClick={payStripe} disabled={busy}>
                    {busy ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</> : `Pay ${inr(booking.totalAmount)}`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="payment-section">
                <div className="card p-3 bg-light border-0 mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" id="dummyCard" checked readOnly />
                    <label className="form-check-label" htmlFor="dummyCard">Dummy Card Payment</label>
                  </div>
                </div>
                <button type="button" className="btn btn-secondary w-100 py-3 fw-bold" onClick={payDummy} disabled={busy}>
                  {busy ? <span className="spinner-border spinner-border-sm me-2" /> : null}Simulate Success
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
