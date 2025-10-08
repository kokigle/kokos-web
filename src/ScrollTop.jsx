// ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // "document.documentElement.scrollTo" es lo mismo que "window.scrollTo",
    // pero funciona mejor en algunos navegadores y frameworks.
    document.documentElement.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Opcional: o "smooth" para un desplazamiento suave
    });
  }, [pathname]); // El efecto se ejecuta cada vez que 'pathname' cambia

  return null; // Este componente no renderiza nada en la pantalla
}
