# Auditoría Integral: Kokos Argentina (Mega-Audit V2) 🕵️‍♂️📊

Este documento consolida los hallazgos de las 4 fases de la auditoría masiva ejecutada sobre el proyecto Kokos Argentina, utilizando análisis estático, dinámico, automatización visual y escaneo de vulnerabilidades.

## 1. Resumen Ejecutivo (Priorizado)
1. **[CRÍTICO] Base de datos sin reglas (Firestore):** No existe un archivo `firestore.rules`. La base de datos es vulnerable a lecturas/escrituras públicas no autorizadas.
2. **[ALTO] Accesibilidad y SEO Core:** Faltan etiquetas H1, URLs canónicas, y hay problemas con la generación del sitemap según reporta SquirrelScan.
3. **[MEDIO] Re-renderizados Innecesarios:** El AuthProvider y componentes masivos como `AdminPanel` y `ProductsList` no están memoizando funciones/listas costosas.
4. **[MEDIO] Ineficiencia de Consultas:** La tabla `clients` usa Auto-IDs en lugar del `uid` de Auth, forzando a consultar por email en lugar de lectura directa.

## 2. Hallazgos Visuales y UX (Frontend Design & Webapp Testing)
Se ejecutaron scripts de **Playwright** que navegaron las rutas principales (`/`, `/login`, `/register`, `/admin`) capturando la interfaz (esperando a que las imágenes remotas como las de Cloudinary cargaran completamente).
**Análisis de Diseño (`frontend-design`):**
- **Banner Principal:** El banner "BIENVENIDOS A KOKOS" luce moderno y adecuado, con buenas imágenes y un botón claro de "VER PRODUCTOS". El contenedor de categorías (Novedades, Vehículos, Musicales) está bien estructurado.
- **Lo Genérico / Plantillado:** Contrastando con el banner, las tarjetas de información (Envíos, Calidad, Servicio) lucen algo "viejas" debido al uso de degradados bruscos verde-turquesa, sombras pesadas e iconos genéricos incrustados. Esto genera un choque de estilos en la Home.
- **Propuesta de Mejora:** Simplificar las tarjetas informativas quitando los fondos oscuros pesados y las sombras rígidas. Se podrían integrar como íconos con texto de apoyo (beneficios) debajo del banner principal para mantener un diseño limpio y moderno (*clean look*).

## 3. Errores de Consola y Bugs de Flujo
- **Playwright Report:** Tras ejecutar la navegación completa por el flujo de cliente, no se detectaron errores de consola.
- **Panel Admin:** Se utilizó un perfil de Chrome nativo con un sub-agente para asegurar el logueo exitoso del Admin frente a las protecciones de Firebase. El panel (Listado de Clientes, Productos y Categorías Drag & Drop) cargó correctamente sin fallos visuales.

## 4. Mejoras de Código React (Vercel Best Practices)
La auditoría de código reveló violaciones a las mejores prácticas de Vercel y React 19:
- **`App.jsx` (`rerender-memo`):** El valor de `AuthContext.Provider` se recrea en cada renderizado de App. Debe ser envuelto en `useMemo`.
- **`ProductsList.jsx` (`bundle-barrel-imports`):** Las importaciones de `lucide-react` son masivas (`import { ChevronLeft... }`). Esto infla severamente el JS inicial.
- **`ProductsList.jsx` (`rerender-derived-state-no-effect`):** El filtrado de productos usa `useEffect` para setear estado derivado en lugar de calcularse al vuelo durante el render.
- **`AdminPanel.jsx` (`rerender-memo`):** Filtros pesados de listas de clientes (`pendingClients`) ocurren en cada tipeo. Deberían memoizarse.
- **`CartPage.jsx` (`bundle-dynamic-imports`):** `@emailjs/browser` se importa al principio del archivo. Debería cargarse dinámicamente (`import('@emailjs/browser')`) al momento de enviar el mail.

## 5. Arquitectura Firebase (Auth, Firestore y Reglas)
- **Modelado de Datos:** La creación de cuentas genera un documento con Auto-ID en `clients` guardando el `uid` adentro. **Recomendación:** Migrar a usar el `uid` de Auth como el ID del documento para búsquedas eficientes `O(1)`.
- **Reglas de Seguridad Propuestas:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/clients/$(request.auth.uid)).data.role == 'admin';
    }
    match /clients/{clientId} {
      allow read, update: if request.auth != null && (clientId == request.auth.uid || isAdmin());
      allow create: if request.auth != null && clientId == request.auth.uid;
      allow delete: if isAdmin();
    }
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    // (Aplica similar para categories e images)
  }
}
```

## 6. Reporte Externo (SquirrelScan) - Producción & Accesibilidad Manual
Se volvió a correr SquirrelScan contra el build compilado (`npm run preview`), obteniendo un Score General de **39/100 (Grado F)**:
- **Performance (89/100 en Producción):** En desarrollo fallaba por falta de compresión. En Producción, ese falso positivo desaparece. Sin embargo, sigue alertando sobre un chunk de JS muy grande (`index-BurlvcRv.js` excede los 750KB). También sigue detectando `unminified-js` (debido a que Vite deja muchos comentarios en los paquetes).
- **SEO Core & Crawlability:** Siguen faltando etiquetas `<h1>`, `canonical URLs`, `robots.txt`, y el formato del `sitemap.xml` es desconocido.

**Revisión Manual de Accesibilidad (A11y - Justificando el Score 94/100):**
- **Imágenes:** Se revisó el código en `ProductsList.jsx` y las imágenes dinámicas de Cloudinary incluyen correctamente la propiedad `alt={p.name}`.
- **Formularios:** Tanto `Register.jsx` como `CartPage.jsx` utilizan el formato semántico correcto `<label htmlFor="id">` en todos sus campos, brindando total soporte para screen-readers.
- **Drag & Drop:** La librería `@hello-pangea/dnd` usada en el Admin Panel soporta de forma nativa la reubicación de elementos por teclado (tecla Espacio para levantar, Flechas para mover, Espacio para soltar), lo que avala que sea altamente accesible.

## 7. Plan de Corrección por Lotes
1. **Lote 1 (Backbone & Seguridad):** Escribir y testear `firestore.rules`. Refactorizar el registro para usar el `uid` de Firebase como Document ID.
2. **Lote 2 (Rendimiento React):** Refactorizar `App.jsx`, `ProductsList` y `AdminPanel` añadiendo `useMemo`, eliminando estados derivados y arreglando imports masivos.
3. **Lote 3 (Vitrinas & SEO):** Añadir H1, robots.txt, reparar el sitemap y agregar la etiqueta `<main>`.
4. **Lote 4 (Rediseño Estético):** Rediseñar las tres tarjetas rígidas del Home ("Envíos, Calidad, Servicio") para que convivan mejor con la estética moderna del nuevo Banner de juguetes.

## 8. Estado de Avance
- **Lote 1:** Completado y commiteado (Migración de colecciones `clients` y `orders` al identificador `uid`).
- **Lote 2:** Completado y commiteado (Code-splitting de rutas, implementación global de `useMemo`/`useCallback` en AuthContext, imports dinámicos de `jsPDF`/`emailjs`, optimización de tree-shaking en `lucide-react`, y memoización de filtros en `AdminPanel`).
- **Lote 3:** En curso. Se confirmó que el `<main>` ya existe en React y que `Home.jsx` sí cuenta con un `<h1>` real. Se propusieron 4 diffs (H1 siempre visible, `robots.txt`, `sitemap.xml` y meta tags en `index.html`), pero **NO se aplicó ninguno** debido a que aún resta definir el dominio de producción, ya que el proyecto sigue en etapa de desarrollo sin dominio asignado.
