// NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";
import styles from "./styles/notfound.module.css";

export default function NotFound() {
  return (
    <div className={styles.notfoundContainer}>
      <div className={styles.notfoundContent}>
        <div className={styles.notfoundAnimation}>
          <div className={styles.notfoundErrorCode}>
            <span className={styles.notfoundDigit}>4</span>
            <span className={`${styles.notfoundDigit} ${styles.special}`}>0</span>
            <span className={styles.notfoundDigit}>4</span>
          </div>
          <div className={styles.notfoundToyIcon}>
            <svg
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#17a2b8"
                strokeWidth="3"
                fill="#f8f9fa"
              />
              <circle cx="22" cy="26" r="4" fill="#495057" />
              <circle cx="42" cy="26" r="4" fill="#495057" />
              <path
                d="M 20 40 Q 32 48 44 40"
                stroke="#17a2b8"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        <div className={styles.notfoundText}>
          <h1 className={styles.notfoundTitle}>¡Oops! Página no encontrada</h1>
          <p className={styles.notfoundDescription}>
            No te preocupes, podemos ayudarte a encontrar lo que necesitas.
          </p>

          <div className={styles.notfoundActions}>
            <Link to="/" className={styles.notfoundBtnPrimary}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Volver al Inicio
            </Link>

            <Link to="/products" className={styles.notfoundBtnSecondary}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Ver Productos
            </Link>
          </div>

          <div className={styles.notfoundSuggestions}>
            <p className={styles.notfoundSuggestionsTitle}>Tal vez te interese:</p>
            <div className={styles.notfoundSuggestionsLinks}>
              <Link to="/novedades">Novedades</Link>
              <Link to="/nosotros">Sobre Nosotros</Link>
              <Link to="/contacto">Contacto</Link>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.notfoundBackground}>
        <div className={`${styles.notfoundFloatingShape} ${styles.notfoundShape1}`}></div>
        <div className={`${styles.notfoundFloatingShape} ${styles.notfoundShape2}`}></div>
        <div className={`${styles.notfoundFloatingShape} ${styles.notfoundShape3}`}></div>
        <div className={`${styles.notfoundFloatingShape} ${styles.notfoundShape4}`}></div>
      </div>
    </div>
  );
}
