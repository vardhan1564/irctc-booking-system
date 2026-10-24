import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../api';
import { errorMessage } from '../api/client';
import { Alert, Loader } from '../components/Common';

/** Stripe redirects here; we ask the backend to verify the session and confirm the booking. */
export default function StripeSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    paymentApi.stripeConfirm(params.get('session_id') || '')
      .then((r) => {
        sessionStorage.removeItem(`irctc_seats_${r.bookingId}`);
        navigate(`/booking/${r.bookingId}/success`, { replace: true });
      })
      .catch((e) => setError(errorMessage(e)));
  }, [params, navigate]);

  if (!error) return <Loader text="Confirming your payment..." />;
  return (
    <div className="container main-container mt-5">
      <div className="card-form mx-auto w-form-xl text-center">
        <Alert>{error}</Alert>
        <p className="text-muted">If money was deducted, it will show in My Bookings once confirmed.</p>
        <Link to="/bookings" className="btn btn-orange">View My Bookings</Link>
      </div>
    </div>
  );
}
