import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="auth-screen">
      <div className="status-card">
        <h2>Page not found</h2>
        <p>The page you are looking for does not exist.</p>
        <Link className="btn primary" href="/">Back to home</Link>
      </div>
    </div>
  );
}
