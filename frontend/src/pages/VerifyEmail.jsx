import { useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import { errorMessage } from '../api/client';
import { Loader } from '../components/Common';

/** Landing page for the email verification link (old VerifyEmailServlet). */
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [result, setResult] = useState(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // React 18 StrictMode runs effects twice in dev
    ran.current = true;
    authApi.verifyEmail(params.get('token') || '')
      .then((r) => setResult({ success: r.message }))
      .catch((e) => setResult({ error: errorMessage(e) }));
  }, [params]);

  if (!result) return <Loader text="Verifying your email..." />;
  return <Navigate to="/login" replace state={result} />;
}
