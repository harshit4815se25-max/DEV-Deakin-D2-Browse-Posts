export default function Notice({ notice, onClose }) {
  if (!notice) return null;
  return (
    <div className={`notice ${notice.type}`} role="status">
      <span>{notice.message}</span>
      <button aria-label="Close message" onClick={onClose}>×</button>
    </div>
  );
}
