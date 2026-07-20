import styles from "./styles/home-page.module.css";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { db } from "./App";
import { useFirestoreData } from "./contexts/FirestoreContext";
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

  const { bannerImages, categoryImages } = useFirestoreData();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showBannerText, setShowBannerText] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousBannerIndex, setPreviousBannerIndex] = useState(null);


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
          entry.target.classList.add(styles.homeAnimateIn);
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
    return `/products?categoryId=${redirect}`;
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
    <div className={styles.homeKokos}>
      {/* Banner Principal con Carrusel */}
      <section className={styles.homeBanner}>
        {bannerImages.length > 0 ? (
          <>
            {/* Banner anterior (en transición de salida) */}
            {previousBannerIndex !== null &&
              bannerImages[previousBannerIndex] && (
                <div className={styles.homeBannerSlide}>
                  <img
                    src={bannerImages[previousBannerIndex].url}
                    alt={`Banner ${previousBannerIndex + 1}`}
                    className={styles.homeBannerImg}
                  />
                </div>
              )}

            {/* Banner actual (en transición de entrada) */}
            {currentBanner && (
              <div
                className={`${styles.homeBannerSlide} ${styles.homeActive}`}
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
                  className={styles.homeBannerImg}
                />
                <div
                  className={`${styles.homeBannerOverlay} ${
                    !showBannerText ? styles.homeHideText : ""
                  }`}
                >
                  <div className={styles.homeBannerContent}>
                    <h1 className={styles.homeBannerTitle}>BIENVENIDOS A KOKOS</h1>
                    <p className={styles.homeBannerSubtitle}>
                      Calidad y variedad en juguetes
                    </p>
                    <Link to="/products" className={styles.homeBannerCta}>
                      Ver Productos
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {bannerImages.length > 1 && (
              <>
                <button
                  className={`${styles.homeBannerNav} ${styles.homeBannerNavPrev}`}
                  onClick={handlePrevBanner}
                  aria-label="Imagen anterior"
                  disabled={isTransitioning}
                >
                  <Previous />
                </button>
                <button
                  className={`${styles.homeBannerNav} ${styles.homeBannerNavNext}`}
                  onClick={() => handleNextBanner(false)}
                  aria-label="Imagen siguiente"
                  disabled={isTransitioning}
                >
                  <Next />
                </button>

                <div className={styles.homeBannerIndicators}>
                  {bannerImages.map((_, index) => (
                    <button
                      key={index}
                      className={`${styles.homeBannerIndicator} ${
                        index === currentBannerIndex ? styles.homeActive : ""
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
          <div className={styles.homeBannerLoading}>
            <p>Cargando...</p>
          </div>
        )}
      </section>
      <div className={styles.homeContentWrapper}>
        {/* Sección de Servicios y Envíos - Imagen Principal */}
        <section className={styles.homeValues} ref={valuesRef}>
          <div className={styles.homeValuesImageContainer}>
            <img
              src={serviciosEnvios}
              alt="Servicios y Envíos Kokos"
              className={styles.homeValuesMainImage}
            />
          </div>
        </section>

        {/* Sección de Productos - Diseño Nuevo */}
        <section className={styles.homeProducts} ref={productsRef}>
          <div className={styles.homeSectionHeader}>
            <h2>Nuestras Categorías</h2>
            <p>Descubrí nuestra selección de productos</p>
          </div>
          <div className={styles.homeProductsGrid}>
            {["img1", "img2", "img3"].map((key, index) => {
              const category = categoryImages[key];
              const redirectPath = getRedirectPath(category?.redirect);

              return (
                <div key={key} className={styles.homeProductItem}>
                  {category?.url ? (
                    <div className={styles.homeProductImageContainer}>
                      <img
                        src={category.url}
                        alt={`Categoría ${index + 1}`}
                        className={styles.homeProductImage}
                      />
                      <div className={styles.homeProductHoverOverlay}>
                        {redirectPath ? (
                          <Link to={redirectPath} className={styles.homeProductBtn}>
                            Ver Más
                          </Link>
                        ) : (
                          <span className={`${styles.homeProductBtn} ${styles.homeDisabled}`}>
                            Ver Más
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.homeProductImagePlaceholder}>
                      <p>Categoría {index + 1}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer Info - Imagen Principal */}
        <section className={styles.homeFooterInfo} ref={footerRef}>
          <div className={styles.homeFooterImageContainer}>
            <img
              src={envioAtencion}
              alt="Envío y Atención Kokos"
              className={styles.homeFooterMainImage}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
