// SetPassword.jsx
import React, { useState, useEffect } from "react";
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
import { FaEnvelope, FaLock } from "react-icons/fa";

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
  const [stepCompleted, setStepCompleted] = useState([
    !!email,
    !!password,
    !!confirm,
  ]);

  useEffect(() => {
    setStepCompleted([!!email, !!password, !!confirm]);
  }, [email, password, confirm]);

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

    // Validar existencia en Firestore
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
        "La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula, número y símbolo."
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

  return (
    <div className="auth-card">
      <h2>Crear tu contraseña</h2>
      <p className="info">Sigue estos pasos para asegurar tu cuenta</p>

      <div className={`step ${stepCompleted[0] ? "completed" : ""}`}>
        <span>1</span> Ingresa tu correo registrado
      </div>
      <div className={`step ${stepCompleted[1] ? "completed" : ""}`}>
        <span>2</span> Crea una contraseña segura
      </div>
      <div className={`step ${stepCompleted[2] ? "completed" : ""}`}>
        <span>3</span> Confirma tu contraseña
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <FaEnvelope />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tuemail@ejemplo.com"
          />
        </div>

        <div className="input-group">
          <FaLock />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="********"
          />
        </div>

        <div className="input-group">
          <FaLock />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="********"
          />
        </div>

        <button className="btn" disabled={loading}>
          {loading ? "Guardando..." : "Crear Contraseña"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
    </div>
  );
}
