// Login.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./App";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaUserPlus, FaKey } from "react-icons/fa";
import "./styles/login.css";

const GOOGLE_FORM_LINK = "https://forms.gle/YOUR_FORM_LINK";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);

    const result = await login(email.trim().toLowerCase(), password);

    if (result.success) {
      navigate("/");
    } else if (result.setPassword) {
      navigate("/set-password", {
        state: { email, clientId: result.client.id },
      });
    } else {
      setMessage(result.message || "Correo o contraseña incorrectos.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-split">
          {/* Left side - Form */}
          <div className="login-form-section">
            <div className="form-header">
              <h1>Bienvenido</h1>
              <p>Ingresa a tu cuenta</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">
                  <FaEnvelope /> Correo electrónico
                </label>
                <input
                  id="email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <FaLock /> Contraseña
                </label>
                <input
                  id="password"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Verificando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>

            {message && (
              <div className="alert-message">
                <span>⚠️</span>
                {message}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="login-actions-section">
            <div className="actions-header">
              <h2>¿No tienes cuenta?</h2>
              <p>Elige una opción para comenzar</p>
            </div>

            <div className="action-cards">
              <a
                href={GOOGLE_FORM_LINK}
                target="_blank"
                rel="noreferrer"
                className="action-card"
              >
                <div className="action-icons">
                  <FaUserPlus />
                </div>
                <div className="action-content">
                  <h3>Crear Nueva Cuenta</h3>
                  <p>Completa el formulario de registro</p>
                </div>
              </a>

              <Link to="/set-password" className="action-card">
                <div className="action-icons">
                  <FaKey />
                </div>
                <div className="action-content">
                  <h3>Configurar Contraseña</h3>
                  <p>Ya fuiste aceptado? Crea tu contraseña aquí</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
