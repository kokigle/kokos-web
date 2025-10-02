// SetPassword.jsx
import React, { useState } from "react";
import { useAuth } from "./App";
import { useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "./App";
import {
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import "./styles/setpassword.css";

export default function SetPassword() {
  const { setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { email: locationEmail } = location.state || {};
  const [email, setEmail] = useState(locationEmail || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const passwordRequirements = [
    { text: "8+ caracteres", test: (pwd) => pwd.length >= 8 },
    { text: "Mayúscula", test: (pwd) => /[A-Z]/.test(pwd) },
    { text: "Minúscula", test: (pwd) => /[a-z]/.test(pwd) },
    { text: "Número", test: (pwd) => /[0-9]/.test(pwd) },
    { text: "Símbolo", test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
  ];

  const validatePassword = (pwd) =>
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) return setError("Debes ingresar tu correo registrado.");

    const q = query(
      collection(db, "clients"),
      where("email", "==", email.toLowerCase())
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return setError("Este correo no está registrado en nuestro sistema.");
    }

    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    if (!validatePassword(password))
      return setError(
        "La contraseña no cumple con los requisitos de seguridad."
      );

    setLoading(true);
    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, email, password);

      const clientDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "clients", clientDoc.id), { hasPassword: true });

      const client = { id: clientDoc.id, ...clientDoc.data() };
      setUser(client);
      localStorage.setItem("kokos_user", JSON.stringify(client));

      navigate("/");
    } catch (err) {
      setError("Error al guardar contraseña: " + err.message);
    }
    setLoading(false);
  };

  const allRequirementsMet =
    password && passwordRequirements.every((req) => req.test(password));
  const passwordsMatch = password && confirm && password === confirm;

  return (
    <div className="setpassword-container">
      <div className="setpassword-card">
        <div className="setpassword-split">
          {/* Left side - Form */}
          <div className="setpassword-form-section">
            <div className="form-header">
              <h1>Crear Contraseña</h1>
              <p>Configura tu contraseña de acceso</p>
            </div>

            <form onSubmit={handleSubmit} className="setpassword-form">
              <div className="form-group">
                <label htmlFor="email">
                  <FaEnvelope /> Correo registrado
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <FaLock /> Nueva contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm">
                  <FaLock /> Confirmar contraseña
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                {confirm && (
                  <div
                    className={`match-indicator ${
                      passwordsMatch ? "match" : "no-match"
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <FaCheckCircle /> Coinciden
                      </>
                    ) : (
                      <>
                        <FaTimesCircle /> No coinciden
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !allRequirementsMet || !passwordsMatch}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Guardando...
                  </>
                ) : (
                  "Crear Contraseña"
                )}
              </button>
            </form>

            {error && (
              <div className="error-message">
                <span>⚠️</span>
                {error}
              </div>
            )}
          </div>

          {/* Right side - Requirements */}
          <div className="setpassword-requirements-section">
            <div className="requirements-header">
              <h2>Requisitos</h2>
              <p>Tu contraseña debe incluir:</p>
            </div>

            <div className="requirements-grid">
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className={`requirement-chip ${
                    password && req.test(password) ? "met" : ""
                  }`}
                >
                  {password && req.test(password) ? (
                    <FaCheckCircle />
                  ) : (
                    <FaTimesCircle />
                  )}
                  <span>{req.text}</span>
                </div>
              ))}
            </div>

            <div className="security-badge">
              <div className="badge-icon">🔒</div>
              <p>Encriptación segura garantizada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
