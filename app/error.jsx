'use client';

export default function Error({ error, reset }) {
  return (
    <div className="auth-screen">
      <div className="status-card">
        <h2>Something went wrong</h2>
        <p>{error?.message || 'An unexpected error occurred.'}</p>
        <button type="button" className="btn primary" onClick={() => reset()}>Try again</button>
      </div>
    </div>
  );
}
