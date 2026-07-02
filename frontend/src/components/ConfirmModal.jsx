export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content confirm-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="confirm-icon">⚠️</div>
        <h2>Confirm Delete</h2>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger-solid" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
