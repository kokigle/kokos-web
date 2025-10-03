// Nosotros.jsx
import React from "react";
import "./styles/nosotros.css";
import foto1 from "./assets/nosotros-1.jpg";
import foto2 from "./assets/nosotros-2.jpg";

export default function Nosotros() {
  return (
    <div className="nosotros-page">
      <div className="nosotros-container">
        <div className="nosotros-header">
          <h1 className="nosotros-title">Sobre Nosotros</h1>
          <div className="nosotros-divider"></div>
        </div>

        <div className="nosotros-content">
          <div className="nosotros-text">
            <div className="nosotros-section">
              <h2>Más de 10 años de trayectoria</h2>
              <p>
                <strong>KOKOS</strong> es una empresa familiar argentina con más
                de 10 años de trayectoria. Lo que comenzó como un sueño familiar
                se transformó en una empresa en constante expansión. Creemos que
                el crecimiento se construye paso a paso, por eso no hemos dejado
                de sumar nuevos proyectos y oportunidades.
              </p>
            </div>

            <div className="nosotros-section">
              <h2>Compromiso con la calidad</h2>
              <p>
                Iniciamos nuestra historia como importadores de juguetes y
                gracias al compromiso con la calidad y la confianza de nuestros
                clientes, seguimos creciendo y ampliando nuestro horizonte.
              </p>
            </div>

            <div className="nosotros-section">
              <h2>Mirando hacia el futuro</h2>
              <p>
                Seguimos construyendo vínculos de confianza con comerciantes de
                todo el país. Y mirando hacia adelante, proyectamos seguir
                ampliando nuestra propuesta con nuevas categorías y
                oportunidades.
              </p>
            </div>

            <div className="nosotros-valores">
              <div className="nosotros-valor">
                <div className="valor-icon">🏆</div>
                <h3>Calidad</h3>
                <p>Productos de alta calidad</p>
              </div>
              <div className="nosotros-valor">
                <div className="valor-icon">🤝</div>
                <h3>Confianza</h3>
                <p>Compromiso con nuestros clientes</p>
              </div>
              <div className="nosotros-valor">
                <div className="valor-icon">🚀</div>
                <h3>Crecimiento</h3>
                <p>Innovacion y expansión constantes</p>
              </div>
            </div>
          </div>

          <div className="nosotros-images">
            <div className="nosotros-image-wrapper">
              <img src={foto1} alt="KOKOS - Nuestra empresa" />
            </div>
            <div className="nosotros-image-wrapper">
              <img src={foto2} alt="KOKOS - Nuestro equipo" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
