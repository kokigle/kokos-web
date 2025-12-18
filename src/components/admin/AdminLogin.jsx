import React from "react";

const AdminLogin = ({ secret, setSecret, loginAdmin }) => {
  return (
    <div className="admin-panel-login-container">
      <div className="admin-panel-login-card">
        <div className="admin-panel-login-header">
          <h2>Panel Administrativo</h2>
          <p>Ingrese la clave para continuar</p>
        </div>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && loginAdmin()}
          placeholder="Clave de administrador"
          className="admin-panel-login-input"
        />
        <button onClick={loginAdmin} className="admin-panel-login-btn">
          Acceder
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
