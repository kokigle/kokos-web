// Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "./assets/logo.png";
import {
  FaWhatsapp,
  FaEnvelope,
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebook,
} from "react-icons/fa";
import "./styles/footer-kokos.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="kokos-footer">
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-col footer-brand">
            <div className="footer-logo">
              <img
                src={logo}
                alt="Kokos Argentina - De Argimpex S.A"
                className="footer-logo-img"
              />
            </div>
            <p className="footer-tagline">Venta mayorista de juguetes</p>
            <p className="footer-description">
              Calidad, variedad y el mejor servicio para tu negocio.
            </p>
          </div>

          <div className="footer-col">
            <h4>Navegación</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Inicio</Link>
              </li>
              <li>
                <Link to="/products">Productos</Link>
              </li>
              <li>
                <Link to="/novedades">Novedades</Link>
              </li>
              <li>
                <Link to="/nosotros">Nosotros</Link>
              </li>
              <li>
                <Link to="/contacto">Contacto</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Mi Cuenta</h4>
            <ul className="footer-links">
              <li>
                <Link to="/login">Iniciar Sesión</Link>
              </li>
              <li>
                <Link to="/login">Registrarme</Link>
              </li>
              <li>
                <Link to="/cart">Mi Carrito</Link>
              </li>
              <li>
                <Link to="/my-account/orders">Mis Pedidos</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col footer-contact">
            <h4>Contacto</h4>
            <ul className="footer-contact-list">
              <li>
                <a
                  href="https://wa.me/541145457891"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-item"
                >
                  <div className="contact-icon whatsapp">
                    <FaWhatsapp />
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">WhatsApp</span>
                    <span className="contact-value">+54 11 4545-7891</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="mailto:infokokos@gmail.com" className="contact-item">
                  <div className="contact-icon email">
                    <FaEnvelope />
                  </div>
                  <div className="contact-info">
                    <span className="contact-label">Email</span>
                    <span className="contact-value">infokokos@gmail.com</span>
                  </div>
                </a>
              </li>
              <li className="contact-item">
                <div className="contact-icon location">
                  <FaMapMarkerAlt />
                </div>
                <div className="contact-info">
                  <span className="contact-label">Ubicación</span>
                  <span className="contact-value">
                    Mariano Santamaria 4392.
                  </span>
                  <span className="contact-value">
                    La Tablada, Buenos Aires.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="copyright">
            © {currentYear} <strong>Kokos Argentina</strong> - De Argimpex S.A.
            Todos los derechos reservados.
          </p>
          <p className="footer-credits">Venta mayorista de juguetes</p>
        </div>
      </div>
    </footer>
  );
}
