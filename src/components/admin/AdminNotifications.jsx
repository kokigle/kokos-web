import React from "react";
import styles from "../../styles/admin-panel.module.css";

const AdminNotifications = ({
  notification,
  confirmDialog,
  handleCancel,
  handleConfirm,
  loading,
}) => {
  return (
    <>
      {/* Notificaciones */}
      {notification && (
        <div
          className={`${styles.adminPanelNotification} ${
            notification.type === "error" ? styles.adminPanelNotificationError :
            notification.type === "info" ? styles.adminPanelNotificationInfo :
            notification.type === "success" ? styles.adminPanelNotificationSuccess : ""
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Diálogo de Confirmación */}
      {confirmDialog && (
        <div className={styles.adminPanelConfirmOverlay}>
          <div className={styles.adminPanelConfirmDialog}>
            <div className={styles.adminPanelConfirmIcon}>⚠️</div>
            <h3>Confirmación</h3>
            <p>{confirmDialog.message}</p>
            <div className={styles.adminPanelConfirmActions}>
              <button
                onClick={handleCancel}
                className={styles.adminPanelBtnConfirmCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className={styles.adminPanelBtnConfirmOk}
                disabled={loading}
              >
                {loading ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay Global */}
      {loading && (
        <div className={styles.adminPanelLoadingOverlay}>
          <div className={styles.adminPanelLoadingSpinner}></div>
          <p>Procesando...</p>
        </div>
      )}
    </>
  );
};

export default AdminNotifications;
