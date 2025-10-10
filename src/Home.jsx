import "./styles/home-page.css";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./App";
import serviciosEnvios from "./assets/servicio_y_envios-08.jpg";
import envioAtencion from "./assets/Envio_y_Atencion-08.jpg";

const Previous = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      d="M17 2L7 12l10 10"
    ></path>
  </svg>
);

const Next = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      d="m7 2l10 10L7 22"
    ></path>
  </svg>
);

export default function Home() {
  const valuesRef = useRef(null);
  const productsRef = useRef(null);
  const footerRef = useRef(null);
  const autoPlayTimerRef = useRef(null);

  const [bannerImages, setBannerImages] = useState([]);
  const [categoryImages, setCategoryImages] = useState({
    img1: { url: "", redirect: "" },
    img2: { url: "", redirect: "" },
    img3: { url: "", redirect: "" },
  });
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showBannerText, setShowBannerText] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousBannerIndex, setPreviousBannerIndex] = useState(null);
  useEffect(() => {
    // Cargar imágenes del banner
    const unsubBanner = onSnapshot(
      collection(db, "images/banner_images/urls"),
      (snap) => {
        const images = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.pos || 0) - (b.pos || 0));
        setBannerImages(images);
      }
    );

    // Cargar imágenes de categorías
    const loadCategoryImages = async () => {
      const unsubscribers = [];
      ["img1", "img2", "img3"].forEach((key) => {
        const unsub = onSnapshot(collection(db, "images"), (snap) => {
          snap.docs.forEach((doc) => {
            if (doc.id === key) {
              setCategoryImages((prev) => ({
                ...prev,
                [key]: doc.data(),
              }));
            }
          });
        });
        unsubscribers.push(unsub);
      });

      return () => unsubscribers.forEach((unsub) => unsub());
    };
    loadCategoryImages();

    return () => {
      unsubBanner();
    };
  }, []);

  // Timer para ocultar texto del banner
  useEffect(() => {
    if (!hasInteracted) {
      const timer = setTimeout(() => {
        setShowBannerText(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [hasInteracted]);

  // Auto-play del carrusel cada 15 segundos
  useEffect(() => {
    if (bannerImages.length > 1) {
      const startAutoPlay = () => {
        autoPlayTimerRef.current = setInterval(() => {
          handleNextBanner(true);
        }, 15000);
      };

      startAutoPlay();

      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    }
  }, [bannerImages.length, currentBannerIndex]);

  // Animaciones de scroll
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "0px",
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("home-animate-in");
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

  const changeBanner = (newIndex) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setPreviousBannerIndex(currentBannerIndex);
    setCurrentBannerIndex(newIndex);

    setTimeout(() => {
      setIsTransitioning(false);
      setPreviousBannerIndex(null);
    }, 800); // Debe coincidir con la duración de la transición CSS
  };

  const handlePrevBanner = () => {
    setHasInteracted(true);
    setShowBannerText(false);

    // Reiniciar el timer de auto-play
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }

    const newIndex =
      currentBannerIndex === 0
        ? bannerImages.length - 1
        : currentBannerIndex - 1;
    changeBanner(newIndex);
  };

  const handleNextBanner = (isAutoPlay = false) => {
    if (!isAutoPlay) {
      setHasInteracted(true);
      setShowBannerText(false);

      // Reiniciar el timer de auto-play
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    }

    const newIndex =
      currentBannerIndex === bannerImages.length - 1
        ? 0
        : currentBannerIndex + 1;
    changeBanner(newIndex);
  };

  const handleIndicatorClick = (index) => {
    setHasInteracted(true);
    setShowBannerText(false);

    // Reiniciar el timer de auto-play
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }

    changeBanner(index);
  };

  const getRedirectPath = (redirect) => {
    if (!redirect || redirect === "ninguno") return null;
    if (redirect === "novedades") return "/novedades";
    return `/products?category=jugueteria&subcategory=${redirect}`;
  };

  const handleBannerClick = () => {
    if (bannerImages.length === 0) return;
    const redirect = bannerImages[currentBannerIndex]?.redirect;
    const path = getRedirectPath(redirect);
    if (path) {
      window.location.href = path;
    }
  };

  const currentBanner = bannerImages[currentBannerIndex];

  return (
    <div className="home-kokos">
      {/* Banner Principal con Carrusel */}
      <section className="home-banner">
        {bannerImages.length > 0 ? (
          <>
            {/* Banner anterior (en transición de salida) */}
            {previousBannerIndex !== null &&
              bannerImages[previousBannerIndex] && (
                <div className="home-banner-slide">
                  <img
                    src={bannerImages[previousBannerIndex].url}
                    alt={`Banner ${previousBannerIndex + 1}`}
                    className="home-banner-img"
                  />
                </div>
              )}

            {/* Banner actual (en transición de entrada) */}
            {currentBanner && (
              <div
                className="home-banner-slide home-active"
                onClick={handleBannerClick}
                style={{
                  cursor:
                    currentBanner.redirect !== "ninguno"
                      ? "pointer"
                      : "default",
                }}
              >
                <img
                  src={currentBanner.url}
                  alt={`Banner ${currentBannerIndex + 1}`}
                  className="home-banner-img"
                />
                <div
                  className={`home-banner-overlay ${
                    !showBannerText ? "home-hide-text" : ""
                  }`}
                >
                  <div className="home-banner-content">
                    <h1 className="home-banner-title">BIENVENIDOS A KOKOS</h1>
                    <p className="home-banner-subtitle">
                      Calidad y variedad en juguetes
                    </p>
                    <Link to="/products" className="home-banner-cta">
                      Ver Productos
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {bannerImages.length > 1 && (
              <>
                <button
                  className="home-banner-nav home-banner-nav-prev"
                  onClick={handlePrevBanner}
                  aria-label="Imagen anterior"
                  disabled={isTransitioning}
                >
                  <Previous />
                </button>
                <button
                  className="home-banner-nav home-banner-nav-next"
                  onClick={() => handleNextBanner(false)}
                  aria-label="Imagen siguiente"
                  disabled={isTransitioning}
                >
                  <Next />
                </button>

                <div className="home-banner-indicators">
                  {bannerImages.map((_, index) => (
                    <button
                      key={index}
                      className={`home-banner-indicator ${
                        index === currentBannerIndex ? "home-active" : ""
                      }`}
                      onClick={() => handleIndicatorClick(index)}
                      aria-label={`Ir a imagen ${index + 1}`}
                      disabled={isTransitioning}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="home-banner-loading">
            <p>Cargando...</p>
          </div>
        )}
      </section>

      {/* Sección de Servicios y Envíos - Imagen Principal */}
      <section className="home-values" ref={valuesRef}>
        <div className="home-values-image-container">
          <img
            src={serviciosEnvios}
            alt="Servicios y Envíos Kokos"
            className="home-values-main-image"
          />
        </div>
      </section>

      {/* Sección de Productos - Diseño Nuevo */}
      <section className="home-products" ref={productsRef}>
        <div className="home-section-header">
          <h2>Nuestras Categorías</h2>
          <p>Descubrí nuestra selección de productos</p>
        </div>
        <div className="home-products-grid">
          {["img1", "img2", "img3"].map((key, index) => {
            const category = categoryImages[key];
            const redirectPath = getRedirectPath(category?.redirect);

            return (
              <div key={key} className="home-product-item">
                {category?.url ? (
                  <div className="home-product-image-container">
                    <img
                      src={category.url}
                      alt={`Categoría ${index + 1}`}
                      className="home-product-image"
                    />
                    <div className="home-product-hover-overlay">
                      {redirectPath ? (
                        <Link to={redirectPath} className="home-product-btn">
                          Ver Más
                        </Link>
                      ) : (
                        <span className="home-product-btn home-disabled">Ver Más</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="home-product-image-placeholder">
                    <p>Categoría {index + 1}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Info - Imagen Principal */}
      <section className="home-footer-info" ref={footerRef}>
        <div className="home-footer-image-container">
          <img
            src={envioAtencion}
            alt="Envío y Atención Kokos"
            className="home-footer-main-image"
          />
        </div>
      </section>
    </div>
  );
}