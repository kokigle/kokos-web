// Login.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./App";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import "./styles/login-setpassword.css";
const GOOGLE_FORM_LINK = "https://forms.gle/YOUR_FORM_LINK";
export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [stepCompleted, setStepCompleted] = useState([false, false]);
  const navigate = useNavigate();

  useEffect(() => {
    setStepCompleted([!!email, !!password]);
  }, [email, password]);

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
    <div className="auth-card">
      <h2>Iniciar sesión</h2>
      <p className="info">Sigue estos pasos para acceder a tu cuenta</p>

      <div className={`step ${stepCompleted[0] ? "completed" : ""}`}>
        <span>1</span> Ingresa tu correo registrado
      </div>
      <div className={`step ${stepCompleted[1] ? "completed" : ""}`}>
        <span>2</span> Ingresa tu contraseña
      </div>

      <form onSubmit={handleLogin}>
        <div className="input-group">
          <FaEnvelope />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tuemail@ejemplo.com"
          />
        </div>

        <div className="input-group">
          <FaLock />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>

        <button className="btn" disabled={loading}>
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </form>

      {message && <div className="alert">{message}</div>}

      <div style={{ marginTop: "25px", textAlign: "center" }}>
        <p>
          <span>SI QUERÉS CREAR TU CUENTA LLENA FORMULARIO: </span>
          <p>
            <a
              href={GOOGLE_FORM_LINK}
              target="_blank"
              rel="noreferrer"
              className="link-text"
            >
              CLICK AQUI PARA IR AL FORMULARIO
            </a>
          </p>
        </p>
        <p>
          <span>SI YA FUISTE ACEPTADO Y NO TENES CONTRASEÑA: </span>
          <p>
            <Link to="/set-password" className="link-text">
              CLICK AQUI PARA CREAR TU CONTRASEÑA
            </Link>
          </p>
        </p>
      </div>
    </div>
  );
}
