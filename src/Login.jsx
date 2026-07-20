// Login.jsx
import React, { useState } from "react";
import { useAuth } from "./App";
import { useNavigate, Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { FaEnvelope, FaLock, FaUserPlus } from "react-icons/fa";
import styles from "./styles/login.module.css";
import { EyeIcon } from "./icons/EyeIcon"; // Import EyeIcon
import { EyeSlashIcon } from "./icons/EyeSlashIcon"; // Import EyeSlashIcon

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false); // Add state for visibility

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);

    const result = await login(email.trim().toLowerCase(), password);

    if (result.success) {
      // Verificar si el estado es "pendiente"
      if (result.client.status === "pendiente") {
        setMessage(
          "Tu cuenta está pendiente de aprobación. Te notificaremos cuando sea activada."
        );
        // Cerrar sesión automáticamente
        const auth = getAuth();
        await auth.signOut();
        return;
      }
      navigate("/");
    } else {
      setMessage(result.message || "Correo o contraseña incorrectos.");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginSplit}>
          {/* Left side - Form */}
          <div className={styles.loginFormSection}>
            <div className={styles.formHeader}>
              <h1>Bienvenido</h1>
              <p>Ingresa a tu cuenta</p>
            </div>

            <form onSubmit={handleLogin} className={styles.loginForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email">
                  <FaEnvelope /> Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="username"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">
                  <FaLock /> Contraseña
                </label>
                {/* Wrap input and icon */}
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="password"
                    name="password"
                    required
                    type={showPassword ? "text" : "password"} // Toggle type
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  {/* Add the icon toggle */}
                  <span
                    className={styles.passwordToggleIcon}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </span>
                </div>
              </div>

              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Verificando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>

            {message && (
              <div className={styles.alertMessage}>
                <span>⚠️</span>
                {message}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className={styles.loginActionsSection}>
            <div className={styles.actionsHeader}>
              <h2>¿No tienes cuenta?</h2>
              <p>Regístrate como cliente mayorista</p>
            </div>

            <div className={styles.actionCards}>
              <Link to="/register" className={styles.actionCard}>
                <div className={styles.actionIcons}>
                  <FaUserPlus />
                </div>
                <div className={styles.actionContent}>
                  <h3>Crear Nueva Cuenta</h3>
                  <p>Completa el formulario de registro y empieza a comprar</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
