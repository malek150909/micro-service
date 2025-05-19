import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import React from 'react';
import styles from "../module.module.css";

const DeleteConfirmationModal = ({ onConfirm, onCancel }) => {
  return createPortal(
    <motion.div
      className={styles['ADM-MDL-modal-overlay']}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <motion.div
        className={styles['ADM-MDL-modal-content']}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3>Confirmer la suppression</h3>
        <p>Êtes-vous sûr de vouloir supprimer ce module ? Cette action est irréversible.</p>
        <div className={styles['ADM-MDL-modal-actions']}>
          <button
            onClick={onConfirm}
            className={`${styles['ADM-MDL-button']} ${styles['ADM-MDL-delete-button']}`}
          >
            Supprimer
          </button>
          <button
            onClick={onCancel}
            className={styles['ADM-MDL-button']}
          >
            Annuler
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default DeleteConfirmationModal;