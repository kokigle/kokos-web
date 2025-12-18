import React from "react";

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
          className={`admin-panel-notification admin-panel-notification-${notification.type}`}
        >
          {notification.message}
        </div>
      )}

      {/* Diálogo de Confirmación */}
      {confirmDialog && (
        <div className="admin-panel-confirm-overlay">
          <div className="admin-panel-confirm-dialog">
            <div className="admin-panel-confirm-icon">⚠️</div>
            <h3>Confirmación</h3>
            <p>{confirmDialog.message}</p>
            <div className="admin-panel-confirm-actions">
              <button
                onClick={handleCancel}
                className="admin-panel-btn-confirm-cancel"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="admin-panel-btn-confirm-ok"
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
        <div className="admin-panel-loading-overlay">
          <div className="admin-panel-loading-spinner"></div>
          <p>Procesando...</p>
        </div>
      )}
    </>
  );
};

export default AdminNotifications;
