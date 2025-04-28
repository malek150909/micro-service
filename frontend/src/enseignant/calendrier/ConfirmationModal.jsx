import styles from "./calendar.module.css"

function ConfirmationModal({ isOpen, onConfirm, onCancel, message }) {
  if (!isOpen) return null

  return (
    <div className={styles['CLD-modal-wrapper']}>
      <div className={styles['CLD-modal']}>
        <div className={styles['CLD-modal-content']}>
          <h2>Confirmation</h2>
          <p>{message}</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button onClick={onCancel}>Annuler</button>
            <button onClick={onConfirm}>Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal