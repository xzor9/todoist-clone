import React from 'react';
import styles from './ConfirmationModal.module.css';

export default function ConfirmationModal({ title, message, onConfirm, onCancel, confirmLabel = "Delete", cancelLabel = "Cancel", isDangerous = false }) {
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`${styles.confirmBtn} ${isDangerous ? styles.dangerous : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
