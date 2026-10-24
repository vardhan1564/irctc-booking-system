import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container main-container mt-5">
      <div className="card-form text-center w-form-lg" style={{ margin: '50px auto' }}>
        <i className="bi bi-signpost-split text-irctc" style={{ fontSize: '3rem' }} />
        <h2 className="mt-3">Page not found</h2>
        <p className="text-muted">This page doesn't exist. Head back home to search for a train.</p>
        <Link to="/" className="btn btn-orange">Go to Home</Link>
      </div>
    </div>
  );
}
