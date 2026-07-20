// Nosotros.jsx
import React from "react";
import styles from "./styles/nosotros.module.css";
import foto1 from "./assets/nosotros-1.jpg";
import foto2 from "./assets/nosotros-2.jpg";

export default function Nosotros() {
  return (
    <div className={styles.nosotrosPage}>
      <div className={styles.nosotrosContainer}>
        <div className={styles.nosotrosHeader}>
          <h1 className={styles.nosotrosTitle}>Sobre Nosotros</h1>
          <div className={styles.nosotrosDivider}></div>
        </div>

        <div className={styles.nosotrosContent}>
          <div className={styles.nosotrosText}>
            <div className={styles.nosotrosSection}>
              <h2>Más de 10 años de trayectoria</h2>
              <p>
                <strong>KOKOS de Argimpex S.A.</strong> es una empresa familiar
                con más de 10 años de trayectoria. Lo que comenzó como un sueño
                familiar se transformó en una empresa en constante expansión.
              </p>
            </div>

            <div className={styles.nosotrosSection}>
              <h2>Compromiso con la calidad</h2>
              <p>
                Creemos que el crecimiento se construye paso a paso, por eso no
                hemos dejado de sumar nuevos proyectos y oportunidades.
                Iniciamos nuestra historia como importadores de juguetes y,
                gracias al compromiso con la calidad y la confianza de nuestros
                clientes, seguimos creciendo y ampliando nuestros horizontes.
              </p>
            </div>

            <div className={styles.nosotrosSection}>
              <h2>Mirando hacia el futuro</h2>
              <p>
                Hoy continuamos construyendo vínculos de confianza con
                comerciantes de todo el país y, mirando hacia el futuro,
                proyectamos seguir ampliando nuestra propuesta con nuevas
                categorías y oportunidades que nos impulsen a seguir creciendo
                juntos.
              </p>
            </div>

            <div className={styles.nosotrosValores}>
              <div className={styles.nosotrosValor}>
                <div className={styles.valorIcon}>🏆</div>
                <h3>Calidad</h3>
                <p>Productos de alta calidad</p>
              </div>
              <div className={styles.nosotrosValor}>
                <div className={styles.valorIcon}>🤝</div>
                <h3>Confianza</h3>
                <p>Compromiso con nuestros clientes</p>
              </div>
              <div className={styles.nosotrosValor}>
                <div className={styles.valorIcon}>🚀</div>
                <h3>Crecimiento</h3>
                <p>Innovacion y expansión constantes</p>
              </div>
            </div>
          </div>

          <div className={styles.nosotrosImages}>
            <div className={styles.nosotrosImageWrapper}>
              <img src={foto1} alt="KOKOS - Nuestra empresa" />
            </div>
            <div className={styles.nosotrosImageWrapper}>
              <img src={foto2} alt="KOKOS - Nuestro equipo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
