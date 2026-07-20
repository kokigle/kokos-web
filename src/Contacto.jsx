// src/Contacto.jsx
import React, { useState } from "react";
import {
  FaEnvelope,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaPaperPlane,
} from "react-icons/fa";
import styles from "./styles/contact-page.module.css";

const EMAILJS_SERVICE_ID = "service_igan4yb";
const EMAILJS_TEMPLATE_ID = "template_e8kdsrp";
const EMAILJS_USER_ID = "WlrKNrL1f219RpOwO";

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    celular: "",
    comentarios: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.nombre || !formData.email || !formData.celular) {
      setMessage({
        type: "error",
        text: "Por favor, completa todos los campos obligatorios.",
      });
      return;
    }

    setLoading(true);

    try {
      const { default: emailjs } = await import("@emailjs/browser");
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.nombre,
          to_email: "infokokos@gmail.com",
          client_email: formData.email,
          client_phone: formData.celular,
          message: formData.comentarios,
          order_id: "CONSULTA_CONTACTO",
          order_json: JSON.stringify(formData, null, 2),
        },
        EMAILJS_USER_ID
      );

      setMessage({
        type: "success",
        text: "¡Mensaje enviado con éxito! Te responderemos a la brevedad.",
      });
      setFormData({ nombre: "", email: "", celular: "", comentarios: "" });
    } catch (e) {
      console.error("Error al enviar el formulario:", e);
      setMessage({
        type: "error",
        text: "Ocurrió un error al enviar el mensaje. Por favor, inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.contactPageContainer}>
      <div className={styles.contactHeroSection}>
        <h1 className={styles.contactMainTitle}>Estamos para ayudarte</h1>
        <p className={styles.contactMainSubtitle}>
          Completa el formulario o contáctanos directamente. Respondemos todas
          las consultas en menos de 24 horas.
        </p>
      </div>

      <div className={styles.contactLayout}>
        {/* Columna de Formulario - IZQUIERDA */}
        <div className={styles.contactFormColumn}>
          <div className={styles.contactFormHeader}>
            <h2 className={styles.contactFormTitle}>Envíanos un mensaje</h2>
            <p className={styles.contactFormSubtitle}>
              Completa el formulario y nos pondremos en contacto contigo
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.contactFormBox}>
            <div className={styles.contactFormRow}>
              <div className={styles.contactFormGroup}>
                <label htmlFor="nombre" className={`${styles.contactLabel} ${styles.required}`}>
                  Nombre y Apellido
                </label>
                <div className={styles.contactInputWrapper}>
                  <FaUser className={styles.contactInputIcon} />
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={styles.contactInput}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
              </div>

              <div className={styles.contactFormGroup}>
                <label htmlFor="email" className={`${styles.contactLabel} ${styles.required}`}>
                  Correo Electrónico
                </label>
                <div className={styles.contactInputWrapper}>
                  <FaEnvelope className={styles.contactInputIcon} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.contactInput}
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.contactFormGroup}>
              <label htmlFor="celular" className={`${styles.contactLabel} ${styles.required}`}>
                Teléfono / WhatsApp
              </label>
              <div className={styles.contactInputWrapper}>
                <FaPhone className={styles.contactInputIcon} />
                <input
                  id="celular"
                  name="celular"
                  type="tel"
                  value={formData.celular}
                  onChange={handleChange}
                  className={styles.contactInput}
                  placeholder="+54 11 1234-5678"
                  required
                />
              </div>
            </div>

            <div className={styles.contactFormGroup}>
              <label htmlFor="comentarios" className={styles.contactLabel}>
                Tu Mensaje
              </label>
              <textarea
                id="comentarios"
                name="comentarios"
                value={formData.comentarios}
                onChange={handleChange}
                className={styles.contactTextarea}
                rows="6"
                placeholder="Escribe aquí tu consulta, pedido o sugerencia..."
              />
            </div>

            {message && (
              <div
                className={`${styles.contactAlert} ${
                  message.type === "success"
                    ? styles.contactAlertSuccess
                    : styles.contactAlertError
                }`}
              >
                {message.type === "success" ? (
                  <FaCheckCircle className={styles.contactAlertIcon} />
                ) : (
                  <FaExclamationCircle className={styles.contactAlertIcon} />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              className={styles.contactBtnSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.contactBtnSpinner}></span>
                  Enviando...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Enviar Mensaje
                </>
              )}
            </button>

            <p className={styles.contactRequiredNote}>
              * Todos los campos son obligatorios excepto el mensaje
            </p>
          </form>
        </div>

        {/* Columna de Información - DERECHA */}
        <div className={styles.contactInfoColumn}>
          <div className={styles.contactInfoCard}>
            <h3 className={styles.contactInfoTitle}>Información de Contacto</h3>
            <p className={styles.contactInfoText}>
              Contáctanos por cualquiera de estos medios.
            </p>

            <div className={styles.contactDetailsList}>
              <div className={styles.contactDetailItem}>
                <div className={`${styles.contactDetailIconWrapper} ${styles.location}`}>
                  <FaMapMarkerAlt className={styles.contactDetailIcon} />
                </div>
                <div className={styles.contactDetailContent}>
                  <strong>Nuestra Ubicación</strong>
                  <p>Mariano Santamaria 4392</p>
                  <p>La Tablada, Buenos Aires</p>
                </div>
              </div>

              <div className={styles.contactDetailItem}>
                <div className={`${styles.contactDetailIconWrapper} ${styles.clock}`}>
                  <FaClock className={styles.contactDetailIcon} />
                </div>
                <div className={styles.contactDetailContent}>
                  <strong>Horario de Atención</strong>
                  <p>Lunes a Viernes</p>
                  <p>08:00 AM - 17:00 PM</p>
                </div>
              </div>

              <div className={styles.contactDetailItem}>
                <div className={`${styles.contactDetailIconWrapper} ${styles.phone}`}>
                  <FaPhone className={styles.contactDetailIcon} />
                </div>
                <div className={styles.contactDetailContent}>
                  <strong>Teléfono / WhatsApp</strong>
                  <p>+54 11 4545-7891</p>
                  <a
                    href="https://wa.me/541145457891"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.contactWhatsappLink}
                  >
                    Chatear por WhatsApp
                  </a>
                </div>
              </div>

              <div className={styles.contactDetailItem}>
                <div className={`${styles.contactDetailIconWrapper} ${styles.email}`}>
                  <FaEnvelope className={styles.contactDetailIcon} />
                </div>
                <div className={styles.contactDetailContent}>
                  <strong>Correo Electrónico</strong>
                  <p>infokokos@gmail.com</p>
                  <a
                    href="mailto:infokokos@gmail.com"
                    className={styles.contactEmailLink}
                  >
                    Enviar email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa Centrado Abajo */}
      <div className={styles.contactMapSection}>
        <h3 className={styles.contactMapTitle}>¿Dónde estamos?</h3>
        <div className={styles.contactMapContainer}>
          <iframe
            title="Ubicación de Kokos Argentina"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3279.791535492194!2d-58.5303798!3d-34.717646!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcce5180f2d9f7%3A0x67d8f541f5a5a1f6!2sMariano%20Santamaria%204392%2C%20B1752DQX%20La%20Tablada%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1714578900000!5m2!1ses-419!2sar"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
