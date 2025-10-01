import "./styles/home-page.css";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import banner from "./assets/banner.jpg";
import serviciosEnvios from "./assets/servicio_y_envios-08.jpg";
import destacadoKokos from "./assets/Destacado_Cuadrado_kokos.jpg";
import destacadoMusicales from "./assets/Destacado_Cuadrado_kokos_musicales.jpg";
import destacadoVehiculos from "./assets/Destacado_Cuadrado_kokos_vehiculos.jpg";
import envioAtencion from "./assets/Envio_y_Atencion-08.jpg";

export default function Home() {
  const valuesRef = useRef(null);
  const productsRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "0px",
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    if (valuesRef.current) observer.observe(valuesRef.current);
    if (productsRef.current) observer.observe(productsRef.current);
    if (footerRef.current) observer.observe(footerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="kokos-home">
      {/* Banner Principal */}
      <section className="home-banner">
        <img
          src={banner}
          alt="Banner Kokos - Venta Mayorista de Vehículos"
          className="banner-img"
        />
        <div className="banner-overlay">
          <div className="banner-content">
            <h1 className="banner-title">BIENVENIDOS A KOKOS</h1>
            <p className="banner-subtitle">Calidad y variedad en juguetes</p>
            <Link to="/products" className="banner-cta">
              Ver Productos
            </Link>
          </div>
        </div>
      </section>

      {/* Sección de Servicios y Envíos - Imagen Principal */}
      <section className="home-values" ref={valuesRef}>
        <div className="values-image-container">
          <img
            src={serviciosEnvios}
            alt="Servicios y Envíos Kokos"
            className="values-main-image"
          />
        </div>
      </section>

      {/* Sección de Productos - Diseño Nuevo */}
      <section className="home-products" ref={productsRef}>
        <div className="section-header">
          <h2>Nuestras Categorías</h2>
          <p>Descubrí nuestra selección de productos</p>
        </div>
        <div className="products-grid">
          <div className="product-item">
            <div className="product-image-container">
              <img
                src={destacadoKokos}
                alt="Novedades Kokos"
                className="product-image"
              />
              <div className="product-hover-overlay">
                <Link to="/novedades" className="product-btn">
                  Ver Novedades
                </Link>
              </div>
            </div>
          </div>

          <div className="product-item">
            <div className="product-image-container">
              <img
                src={destacadoMusicales}
                alt="Musicales Kokos"
                className="product-image"
              />
              <div className="product-hover-overlay">
                <Link
                  to="/products?category=jugueteria&subcategory=musicales"
                  className="product-btn"
                >
                  Ver Musicales
                </Link>
              </div>
            </div>
          </div>

          <div className="product-item">
            <div className="product-image-container">
              <img
                src={destacadoVehiculos}
                alt="Vehículos Kokos"
                className="product-image"
              />
              <div className="product-hover-overlay">
                <Link to="/products?category=vehiculos" className="product-btn">
                  Ver Vehículos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info - Imagen Principal */}
      <section className="home-footer-info" ref={footerRef}>
        <div className="footer-image-container">
          <img
            src={envioAtencion}
            alt="Envío y Atención Kokos"
            className="footer-main-image"
          />
        </div>
      </section>
    </div>
  );
}
