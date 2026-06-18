export default function Loading() {
  return (
    <div className="auth-screen">
      <div className="status-card status-card--loading">
        <div className="status-spinner" aria-hidden />
        <p>Loading lookbook…</p>
      </div>
    </div>
  );
}
