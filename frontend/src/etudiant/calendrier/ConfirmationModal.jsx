import styles from "./calendar.module.css"

function ConfirmationModal({ isOpen, onConfirm, onCancel, message }) {
  if (!isOpen) return null

  return (
    <div className={styles['CLD-modal']}>
      <div className={styles['CLD-modal-content']}>
        <h2>Confirmation</h2>
        <p>{message}</p>
        <button onClick={onConfirm}>Confirmer</button>
        <button onClick={onCancel}>Annuler</button>
      </div>
    </div>
  )
}

export default ConfirmationModal