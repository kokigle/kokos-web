# Diagnóstico de Organización CSS 🎨🔧

## 1. Conexiones y Enrutamiento (JSX a CSS)

**Archivos JSX que importan CSS:**
- `AdminPanel.jsx` importa:
  - `./styles/admin-panel.css`
- `App.jsx` importa:
  - `./styles/reset-y-base.css`
- `CartPage.jsx` importa:
  - `./styles/cart-page.css`
- `Contacto.jsx` importa:
  - `./styles/contact-page.css`
- `FloatingCartButton.jsx` importa:
  - `./styles/floating-cart-button.css`
- `Footer.jsx` importa:
  - `./styles/footer-kokos.css`
- `Header.jsx` importa:
  - `./styles/header-kokos.css`
- `Home.jsx` importa:
  - `./styles/home-page.css`
- `Login.jsx` importa:
  - `./styles/login.css`
- `MyAccount.jsx` importa:
  - `./styles/my-account.css`
- `Nosotros.jsx` importa:
  - `./styles/nosotros.css`
- `NotFound.jsx` importa:
  - `./styles/notfound.css`
- `ProductCard.jsx` importa:
  - `./styles/products-list.css`
  - `./styles/product-page.css`
- `ProductPage.jsx` importa:
  - `./styles/product-page.css`
- `ProductsList.jsx` importa:
  - `./styles/products-list.css`
- `Register.jsx` importa:
  - `./styles/register.css`

**Uso de `@import` en CSS:**
- No se detectaron directivas `@import` entre archivos `.css`.

## 2. Peligro de Colisión: Clases Duplicadas

Las siguientes clases están definidas globalmente en MÁS DE UN archivo `.css`. Al no usar CSS Modules, estas clases se sobrescriben entre sí dependiendo del orden de carga de los componentes, causando bugs visuales erráticos:

- `.spinner`: se redefine en **login.css, reset-y-base.css**
- `.email`: se redefine en **contact-page.css, footer-kokos.css**
- `.location`: se redefine en **contact-page.css, footer-kokos.css**
- `.contact-label`: se redefine en **contact-page.css, footer-kokos.css**

## 3. Especificidad Rígida: Uso de IDs

No se encontraron estilos usando IDs. ¡Bien hecho!

## 4. Uso de `!important`

Se encontraron declaraciones forzadas con `!important`. Esto indica lugares donde la cascada CSS se rompió y hubo que 'parchar' el conflicto:

- `cart-page.css`: **7** veces
- `admin-panel.css`: **2** veces
- `product-page.css`: **1** veces

## 5. Arquitectura Global vs. Dispersa

El proyecto tiene un **punto de entrada global** claro:
- En `App.jsx`/`main.jsx` se inyecta globalmente: `./styles/reset-y-base.css`

Sin embargo, el resto de la aplicación utiliza una arquitectura **altamente dispersa** (cada página/componente importa su propio CSS en su archivo `.jsx`).
🚨 **El Gran Problema (RESUELTO):** Como React (Vite) no aísla el CSS por defecto, las clases colisionaban. **Esto fue resuelto mediante la migración total a CSS Modules.**

## 6. Estado de Migración a CSS Modules

✅ **MIGRACIÓN COMPLETADA (14/14 archivos).** Todos los estilos dispersos fueron convertidos a CSS Modules (`.module.css`), eliminando por completo los peligros de colisión global documentados en el punto 2.

### Deuda técnica pendiente (No resuelta en esta migración)
*Esta deuda queda agendada para ser revisada durante el rediseño estético (Lote 4):*
- **48 selectores duplicados** dentro de `admin-panel.module.css` (colisión interna dentro del mismo archivo).
- **Uso de `!important`:** Existen declaraciones forzadas en `cart-page.module.css` (7) y `admin-panel.module.css` (2) que se mantuvieron intactas a propósito para preservar el comportamiento original.
