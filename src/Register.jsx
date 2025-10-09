// Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./App";
import {
  FaUser,
  FaBuilding,
  FaIdCard,
  FaPhone,
  FaEnvelope,
  FaLock,
  FaMapMarkerAlt,
  FaMailBulk,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
} from "react-icons/fa";
import "./styles/register.css";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    razonSocial: "",
    posicionFiscal: "",
    cuit: "",
    telefonoMovil: "",
    email: "",
    password: "",
    confirmPassword: "",
    ciudad: "",
    codigoPostal: "",
    provincia: "",
  });

  const posicionesFiscales = [
    "Consumidor Final",
    "Monotributista",
    "Responsable Exento",
    "Responsable Inscripto",
  ];

  const provincias = [
    "Buenos Aires",
    "CABA",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Córdoba",
    "Corrientes",
    "Entre Ríos",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquén",
    "Río Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego",
    "Tucumán",
  ];

  const passwordRequirements = [
    { text: "8+ caracteres", test: (pwd) => pwd.length >= 8 },
    { text: "Mayúscula", test: (pwd) => /[A-Z]/.test(pwd) },
    { text: "Minúscula", test: (pwd) => /[a-z]/.test(pwd) },
    { text: "Número", test: (pwd) => /[0-9]/.test(pwd) },
  ];

  const validatePassword = (pwd) =>
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /[0-9]/.test(pwd);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateCUIT = (cuit) => {
    const cleaned = cuit.replace(/[^0-9]/g, "");
    return cleaned.length === 11;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.posicionFiscal) {
      return setError("Debes seleccionar una posición fiscal.");
    }

    if (!validateCUIT(formData.cuit)) {
      return setError("El CUIT debe tener 11 dígitos.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Las contraseñas no coinciden.");
    }

    if (!validatePassword(formData.password)) {
      return setError(
        "La contraseña no cumple con los requisitos de seguridad."
      );
    }

    setLoading(true);

    try {
      const auth = getAuth();

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.toLowerCase(),
        formData.password
      );

      // Guardar datos en Firestore
      await addDoc(collection(db, "clients"), {
        nombre: formData.nombre,
        apellido: formData.apellido,
        razonSocial: formData.razonSocial,
        posicionFiscal: formData.posicionFiscal,
        cuit: formData.cuit.replace(/[^0-9]/g, ""),
        telefonoMovil: formData.telefonoMovil,
        email: formData.email.toLowerCase(),
        ciudad: formData.ciudad,
        codigoPostal: formData.codigoPostal,
        provincia: formData.provincia,
        status: "pendiente",
        hasPassword: true,
        createdAt: new Date().toISOString(),
        uid: userCredential.user.uid,
      });

      setSuccess(true);

      // Cerrar sesión automáticamente
      await auth.signOut();

      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 10000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo electrónico ya está registrado.");
      } else {
        setError("Error al crear la cuenta: " + err.message);
      }
    }

    setLoading(false);
  };

  const allRequirementsMet =
    formData.password &&
    passwordRequirements.every((req) => req.test(formData.password));
  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  if (success) {
    return (
      <div className="register-container">
        <div className="register-success-card">
          <div className="register-success-icon">
            <FaCheckCircle />
          </div>
          <h1>¡Registro Exitoso!</h1>
          <p>
            Tu cuenta ha sido creada y está pendiente de aprobación. Te
            notificaremos por correo cuando sea activada.
          </p>
          <div className="register-success-redirect">
            Redirigiendo al inicio de sesión...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <Link to="/login" className="register-back-btn">
            <FaArrowLeft /> Volver
          </Link>
          <h1>Crear Cuenta</h1>
          <p>Completa el formulario para registrarte como cliente mayorista</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {/* Datos Personales */}
          <div className="register-section">
            <h2 className="register-section-title">Datos Personales</h2>
            <div className="register-form-grid">
              <div className="register-form-group">
                <label htmlFor="nombre">
                  <FaUser /> Nombre *
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre"
                />
              </div>

              <div className="register-form-group">
                <label htmlFor="apellido">
                  <FaUser /> Apellido *
                </label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  placeholder="Tu apellido"
                />
              </div>
            </div>
          </div>

          {/* Datos Fiscales */}
          <div className="register-section">
            <h2 className="register-section-title">Datos Fiscales</h2>
            <div className="register-form-grid">
              <div className="register-form-group register-form-group-full">
                <label htmlFor="razonSocial">
                  <FaBuilding /> Razón Social *
                </label>
                <input
                  id="razonSocial"
                  name="razonSocial"
                  type="text"
                  value={formData.razonSocial}
                  onChange={handleChange}
                  required
                  placeholder="Nombre de la empresa o razón social"
                />
              </div>

              <div className="register-form-group">
                <label htmlFor="posicionFiscal">
                  <FaIdCard /> Posición Fiscal *
                </label>
                <select
                  id="posicionFiscal"
                  name="posicionFiscal"
                  value={formData.posicionFiscal}
                  onChange={handleChange}
                  required
                  className="register-select"
                >
                  <option value="">Seleccionar...</option>
                  {posicionesFiscales.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="register-form-group">
                <label htmlFor="cuit">
                  <FaIdCard /> CUIT *
                </label>
                <input
                  id="cuit"
                  name="cuit"
                  type="text"
                  value={formData.cuit}
                  onChange={handleChange}
                  required
                  placeholder="20-12345678-9"
                  maxLength="13"
                />
              </div>
            </div>
          </div>

          {/* Datos de Contacto */}
          <div className="register-section">
            <h2 className="register-section-title">Datos de Contacto</h2>
            <div className="register-form-grid">
              <div className="register-form-group">
                <label htmlFor="telefonoMovil">
                  <FaPhone /> Teléfono Móvil *
                </label>
                <input
                  id="telefonoMovil"
                  name="telefonoMovil"
                  type="tel"
                  value={formData.telefonoMovil}
                  onChange={handleChange}
                  required
                  placeholder="+54 9 11 1234-5678"
                />
              </div>

              <div className="register-form-group">
                <label htmlFor="email">
                  <FaEnvelope /> Correo Electrónico *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="tu@email.com"
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="register-section">
            <h2 className="register-section-title">Ubicación</h2>
            <div className="register-form-grid">
              <div className="register-form-group">
                <label htmlFor="provincia">
                  <FaMapMarkerAlt /> Provincia *
                </label>
                <select
                  id="provincia"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  required
                  className="register-select"
                >
                  <option value="">Seleccionar...</option>
                  {provincias.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div className="register-form-group">
                <label htmlFor="ciudad">
                  <FaMapMarkerAlt /> Ciudad *
                </label>
                <input
                  id="ciudad"
                  name="ciudad"
                  type="text"
                  value={formData.ciudad}
                  onChange={handleChange}
                  required
                  placeholder="Tu ciudad"
                />
              </div>

              <div className="register-form-group">
                <label htmlFor="codigoPostal">
                  <FaMailBulk /> Código Postal *
                </label>
                <input
                  id="codigoPostal"
                  name="codigoPostal"
                  type="text"
                  value={formData.codigoPostal}
                  onChange={handleChange}
                  required
                  placeholder="1234"
                />
              </div>
            </div>
          </div>

          {/* Contraseña */}
          <div className="register-section">
            <h2 className="register-section-title">Contraseña</h2>
            <div className="register-form-grid">
              <div className="register-form-group">
                <label htmlFor="password">
                  <FaLock /> Contraseña *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
              </div>

              <div className="register-form-group">
                <label htmlFor="confirmPassword">
                  <FaLock /> Confirmar Contraseña *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
                {formData.confirmPassword && (
                  <div
                    className={`register-match-indicator ${
                      passwordsMatch ? "register-match" : "register-no-match"
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
            </div>

            {/* Requisitos de contraseña */}
            <div className="register-password-requirements">
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className={`register-requirement-chip ${
                    formData.password && req.test(formData.password)
                      ? "register-requirement-met"
                      : ""
                  }`}
                >
                  {formData.password && req.test(formData.password) ? (
                    <FaCheckCircle />
                  ) : (
                    <FaTimesCircle />
                  )}
                  <span>{req.text}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="register-error-message">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="register-btn-primary"
            disabled={loading || !allRequirementsMet || !passwordsMatch}
          >
            {loading ? (
              <>
                <span className="register-spinner"></span>
                Creando cuenta...
              </>
            ) : (
              "Crear Cuenta"
            )}
          </button>

          <div className="register-footer-text">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="register-link">
              Iniciar Sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
