// src/Contacto.jsx
import React, { useState } from "react";
import emailjs from "@emailjs/browser";
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
import "./styles/contact-page.css";

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
    <div className="contact-page-container">
      <div className="contact-hero-section">
        <h1 className="contact-main-title">Estamos para ayudarte</h1>
        <p className="contact-main-subtitle">
          Completa el formulario o contáctanos directamente. Respondemos todas
          las consultas en menos de 24 horas.
        </p>
      </div>

      <div className="contact-layout">
        {/* Columna de Formulario - IZQUIERDA */}
        <div className="contact-form-column">
          <div className="contact-form-header">
            <h2 className="contact-form-title">Envíanos un mensaje</h2>
            <p className="contact-form-subtitle">
              Completa el formulario y nos pondremos en contacto contigo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="contact-form-box">
            <div className="contact-form-row">
              <div className="contact-form-group">
                <label htmlFor="nombre" className="contact-label required">
                  Nombre y Apellido
                </label>
                <div className="contact-input-wrapper">
                  <FaUser className="contact-input-icon" />
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="contact-input"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
              </div>

              <div className="contact-form-group">
                <label htmlFor="email" className="contact-label required">
                  Correo Electrónico
                </label>
                <div className="contact-input-wrapper">
                  <FaEnvelope className="contact-input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="contact-input"
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="contact-form-group">
              <label htmlFor="celular" className="contact-label required">
                Teléfono / WhatsApp
              </label>
              <div className="contact-input-wrapper">
                <FaPhone className="contact-input-icon" />
                <input
                  id="celular"
                  name="celular"
                  type="tel"
                  value={formData.celular}
                  onChange={handleChange}
                  className="contact-input"
                  placeholder="+54 11 1234-5678"
                  required
                />
              </div>
            </div>

            <div className="contact-form-group">
              <label htmlFor="comentarios" className="contact-label">
                Tu Mensaje
              </label>
              <textarea
                id="comentarios"
                name="comentarios"
                value={formData.comentarios}
                onChange={handleChange}
                className="contact-textarea"
                rows="6"
                placeholder="Escribe aquí tu consulta, pedido o sugerencia..."
              />
            </div>

            {message && (
              <div className={`contact-alert contact-alert-${message.type}`}>
                {message.type === "success" ? (
                  <FaCheckCircle className="contact-alert-icon" />
                ) : (
                  <FaExclamationCircle className="contact-alert-icon" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="contact-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="contact-btn-spinner"></span>
                  Enviando...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Enviar Mensaje
                </>
              )}
            </button>

            <p className="contact-required-note">
              * Todos los campos son obligatorios excepto el mensaje
            </p>
          </form>
        </div>

        {/* Columna de Información - DERECHA */}
        <div className="contact-info-column">
          <div className="contact-info-card">
            <h3 className="contact-info-title">Información de Contacto</h3>
            <p className="contact-info-text">
              Contáctanos por cualquiera de estos medios.
            </p>

            <div className="contact-details-list">
              <div className="contact-detail-item">
                <div className="contact-detail-icon-wrapper location">
                  <FaMapMarkerAlt className="contact-detail-icon" />
                </div>
                <div className="contact-detail-content">
                  <strong>Nuestra Ubicación</strong>
                  <p>Mariano Santamaria 4392</p>
                  <p>La Tablada, Buenos Aires</p>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="contact-detail-icon-wrapper clock">
                  <FaClock className="contact-detail-icon" />
                </div>
                <div className="contact-detail-content">
                  <strong>Horario de Atención</strong>
                  <p>Lunes a Viernes</p>
                  <p>9:00 AM - 4:00 PM</p>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="contact-detail-icon-wrapper phone">
                  <FaPhone className="contact-detail-icon" />
                </div>
                <div className="contact-detail-content">
                  <strong>Teléfono / WhatsApp</strong>
                  <p>+54 11 4545-7891</p>
                  <a
                    href="https://wa.me/541145457891"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-whatsapp-link"
                  >
                    Chatear por WhatsApp
                  </a>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="contact-detail-icon-wrapper email">
                  <FaEnvelope className="contact-detail-icon" />
                </div>
                <div className="contact-detail-content">
                  <strong>Correo Electrónico</strong>
                  <p>infokokos@gmail.com</p>
                  <a
                    href="mailto:infokokos@gmail.com"
                    className="contact-email-link"
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
      <div className="contact-map-section">
        <h3 className="contact-map-title">¿Dónde estamos?</h3>
        <div className="contact-map-container">
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
