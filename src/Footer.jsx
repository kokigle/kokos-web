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
import styles from "./styles/footer-kokos.module.css";

import { useAuth } from "./App";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();

  return (
    <footer className={styles.kokosFooter}>
      <div className={styles.footerMain}>
        <div className={styles.footerContainer}>
          <div className={`${styles.footerCol} ${styles.footerBrand}`}>
            <div className={styles.footerLogo}>
              <img
                src={logo}
                alt="Kokos Argentina - De Argimpex S.A"
                className={styles.footerLogoImg}
              />
            </div>
            <p className={styles.footerTagline}>Venta mayorista de juguetes</p>
            <p className={styles.footerDescription}>
              Calidad, variedad y el mejor servicio para tu negocio.
            </p>
          </div>

          <div className={styles.footerCol}>
            <h4>Navegación</h4>
            <ul className={styles.footerLinks}>
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

          <div className={styles.footerCol}>
            <h4>Mi Cuenta</h4>
            <ul className={styles.footerLinks}>
              {user ? (
                <>
                  <li>
                    <Link to="/my-account">Mi Cuenta</Link>
                  </li>
                  <li>
                    <Link to="/my-account/orders">Mis Pedidos</Link>
                  </li>
                  {user.role === "admin" && (
                    <li>
                      <Link to="/admin">Panel Admin</Link>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login">Iniciar Sesión</Link>
                  </li>
                  <li>
                    <Link to="/login">Registrarme</Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/cart">Mi Carrito</Link>
              </li>
            </ul>
          </div>

          <div className={`${styles.footerCol} ${styles.footerContact}`}>
            <h4>Contacto</h4>
            <ul className={styles.footerContactList}>
              <li>
                <a
                  href="https://wa.me/541145457891"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactItem}
                >
                  <div className={`${styles.contactIcon} ${styles.whatsapp}`}>
                    <FaWhatsapp />
                  </div>
                  <div className={styles.contactInfo}>
                    <span className={styles.contactLabel}>WhatsApp</span>
                    <span className={styles.contactValue}>+54 11 4545-7891</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="mailto:infokokos@gmail.com" className={styles.contactItem}>
                  <div className={`${styles.contactIcon} ${styles.email}`}>
                    <FaEnvelope />
                  </div>
                  <div className={styles.contactInfo}>
                    <span className={styles.contactLabel}>Email</span>
                    <span className={styles.contactValue}>infokokos@gmail.com</span>
                  </div>
                </a>
              </li>
              <li className={styles.contactItem}>
                <div className={`${styles.contactIcon} ${styles.location}`}>
                  <FaMapMarkerAlt />
                </div>
                <div className={styles.contactInfo}>
                  <span className={styles.contactLabel}>Ubicación</span>
                  <span className={styles.contactValue}>
                    Mariano Santamaria 4392.
                  </span>
                  <span className={styles.contactValue}>
                    La Tablada, Buenos Aires.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.footerBottomContent}>
          <p className={styles.copyright}>
            © {currentYear} <strong>Kokos Argentina</strong> - De Argimpex S.A.
            Todos los derechos reservados.
          </p>
          <p className={styles.footerCredits}>Venta mayorista de juguetes</p>
        </div>
      </div>
    </footer>
  );
}
