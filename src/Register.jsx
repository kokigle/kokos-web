// src/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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
  FaHome, // Importamos nuevo icono para domicilios
} from "react-icons/fa";
import styles from "./styles/register.module.css";
import { EyeIcon } from "./icons/EyeIcon";
import { EyeSlashIcon } from "./icons/EyeSlashIcon";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    razonSocial: "",
    posicionFiscal: "",
    cuit: "",
    domicilioFiscal: "", // NUEVO CAMPO
    telefonoMovil: "",
    email: "",
    password: "",
    confirmPassword: "",
    domicilioEntrega: "", // NUEVO CAMPO
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

    // Validaciones básicas
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
      return setError("La contraseña no cumple con los requisitos de seguridad.");
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

      // Guardar datos en Firestore (Incluye los nuevos campos)
      await setDoc(doc(db, "clients", userCredential.user.uid), {
        nombre: formData.nombre,
        apellido: formData.apellido,
        razonSocial: formData.razonSocial,
        posicionFiscal: formData.posicionFiscal,
        cuit: formData.cuit.replace(/[^0-9]/g, ""),
        domicilioFiscal: formData.domicilioFiscal, // Guardar
        telefonoMovil: formData.telefonoMovil,
        email: formData.email.toLowerCase(),
        domicilioEntrega: formData.domicilioEntrega, // Guardar
        ciudad: formData.ciudad,
        codigoPostal: formData.codigoPostal,
        provincia: formData.provincia,
        status: "pendiente",
        hasPassword: true,
        createdAt: new Date().toISOString(),
        uid: userCredential.user.uid,
      });

      setSuccess(true);
      await auth.signOut();

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
      <div className={styles.registerContainer}>
        <div className={styles.registerSuccessCard}>
          <div className={styles.registerSuccessIcon}>
            <FaCheckCircle />
          </div>
          <h1>¡Registro Exitoso!</h1>
          <p>
            Tu cuenta ha sido creada y está pendiente de aprobación. Te
            notificaremos por correo cuando sea activada.
          </p>
          <div className={styles.registerSuccessRedirect}>
            Redirigiendo al inicio de sesión...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.registerHeader}>
          <Link to="/login" className={styles.registerBackBtn}>
            <FaArrowLeft /> Volver
          </Link>
          <h1>Crear Cuenta</h1>
          <p>Completa el formulario para registrarte como cliente mayorista</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.registerForm}>
          {/* Datos Personales */}
          <div className={styles.registerSection}>
            <h2 className={styles.registerSectionTitle}>Datos Personales</h2>
            <div className={styles.registerFormGrid}>
              <div className={styles.registerFormGroup}>
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

              <div className={styles.registerFormGroup}>
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
          <div className={styles.registerSection}>
            <h2 className={styles.registerSectionTitle}>Datos Fiscales</h2>
            <div className={styles.registerFormGrid}>
              <div className={`${styles.registerFormGroup} ${styles.registerFormGroupFull}`}>
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

              <div className={styles.registerFormGroup}>
                <label htmlFor="posicionFiscal">
                  <FaIdCard /> Posición Fiscal *
                </label>
                <select
                  id="posicionFiscal"
                  name="posicionFiscal"
                  value={formData.posicionFiscal}
                  onChange={handleChange}
                  required
                  className={styles.registerSelect}
                >
                  <option value="">Seleccionar...</option>
                  {posicionesFiscales.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.registerFormGroup}>
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

              {/* NUEVO: Domicilio Fiscal */}
              <div className={`${styles.registerFormGroup} ${styles.registerFormGroupFull}`}>
                <label htmlFor="domicilioFiscal">
                  <FaBuilding /> Domicilio Fiscal *
                </label>
                <input
                  id="domicilioFiscal"
                  name="domicilioFiscal"
                  type="text"
                  value={formData.domicilioFiscal}
                  onChange={handleChange}
                  required
                  placeholder="Calle, Número, Piso, Dpto (Dirección de facturación)"
                />
              </div>
            </div>
          </div>

          {/* Datos de Contacto y Ubicación */}
          <div className={styles.registerSection}>
            <h2 className={styles.registerSectionTitle}>Contacto y Ubicación</h2>
            <div className={styles.registerFormGrid}>
              <div className={styles.registerFormGroup}>
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

              <div className={styles.registerFormGroup}>
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
                  autoComplete="username"
                />
              </div>

              {/* NUEVO: Domicilio de Entrega */}
              <div className={`${styles.registerFormGroup} ${styles.registerFormGroupFull}`}>
                <label htmlFor="domicilioEntrega">
                  <FaHome /> Domicilio de Entrega *
                </label>
                <input
                  id="domicilioEntrega"
                  name="domicilioEntrega"
                  type="text"
                  value={formData.domicilioEntrega}
                  onChange={handleChange}
                  required
                  placeholder="Calle, Número, Piso, Dpto (Donde recibes el pedido)"
                />
              </div>

              <div className={styles.registerFormGroup}>
                <label htmlFor="provincia">
                  <FaMapMarkerAlt /> Provincia *
                </label>
                <select
                  id="provincia"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  required
                  className={styles.registerSelect}
                >
                  <option value="">Seleccionar...</option>
                  {provincias.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.registerFormGroup}>
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

              <div className={styles.registerFormGroup}>
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
          <div className={styles.registerSection}>
            <h2 className={styles.registerSectionTitle}>Contraseña</h2>
            <div className={styles.registerFormGrid}>
              <div className={styles.registerFormGroup}>
                <label htmlFor="password">
                  <FaLock /> Contraseña *
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className={styles.registerInput}
                    autoComplete="new-password"
                  />
                  <span
                    className={styles.passwordToggleIcon}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </span>
                </div>
              </div>

              <div className={styles.registerFormGroup}>
                <label htmlFor="confirmPassword">
                  <FaLock /> Confirmar Contraseña *
                </label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className={styles.registerInput}
                    autoComplete="new-password"
                  />
                  <span
                    className={styles.passwordToggleIcon}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </span>
                </div>
                {formData.confirmPassword && (
                  <div
                    className={`${styles.registerMatchIndicator} ${
                      passwordsMatch ? styles.registerMatch : styles.registerNoMatch
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

            <div className={styles.registerPasswordRequirements}>
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className={`${styles.registerRequirementChip} ${
                    formData.password && req.test(formData.password)
                      ? styles.registerRequirementMet
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
            <div className={styles.registerErrorMessage}>
              <span>⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.registerBtnPrimary}
            disabled={loading || !allRequirementsMet || !passwordsMatch}
          >
            {loading ? (
              <>
                <span className={styles.registerSpinner}></span>
                Creando cuenta...
              </>
            ) : (
              "Crear Cuenta"
            )}
          </button>

          <div className={styles.registerFooterText}>
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className={styles.registerLink}>
              Iniciar Sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}