# Lab 18: App Router + Context API

Hoy transformas Min-Commerce de un catálogo estático a una app con navegación real y carrito funcional. Crearás nuevas rutas, entenderás Server vs Client Components, y construirás un carrito completo con Context API.

## 🎯 Objetivos

1. Crear rutas con el App Router y navegar con `<Link>`
2. Distinguir Server Components de Client Components y aplicar `'use client'`
3. Implementar un carrito de compras con Context API y custom hook
4. Construir la página `/cart` con operaciones de agregar, editar y eliminar

---

## 🔑 Conceptos Clave

- **`'use client'`** - Directiva que convierte un Server Component en Client Component
- **`<Link>`** - Componente de Next.js para navegación SPA sin recargar la página
- **Context API** - Estado global accesible sin prop drilling
- **Custom Hook** - Función que encapsula lógica reutilizable con hooks

---

## ⚙️ Setup Inicial

| ✓ | Requisito | Verificación |
|---|-----------|--------------|
| ☐ | Min-Commerce corriendo | `npm run dev` → `localhost:3000` |
| ☐ | Interface Product definida | `types/product.ts` con todos los campos |
| ☐ | ProductCard tipado | Renderiza correctamente en la página |
| ☐ | Header y Footer en layout | Estructura visual de clase 17 funcionando |
| ☐ | 6+ productos mock | `data/products.ts` |

---

## Parte 1: Ruta del Carrito + Navegación (20 min)

**Objetivo:** Crear la ruta `/cart` con el App Router y agregar navegación real al Header.

### Paso 1: Crear la ruta `/cart`

Crea `app/cart/page.tsx` — por ahora con contenido placeholder:

```tsx
// app/cart/page.tsx

export default function CartPage() {
  return (
    // Placeholder: título "Mi Carrito" + mensaje "El carrito está vacío"
    // Lo conectarás con Context en Parte 2
  );
}
```

> 💡 **Concepto:** En Next.js, cada carpeta con `page.tsx` dentro de `app/` se convierte en una ruta automática. No necesitas React Router.

### Paso 2: Convertir Header a Client Component

Tu Header de clase 17 era un Server Component estático. Ahora necesita interactividad (navegación, y pronto el badge del carrito). Agrégale `'use client'` y navegación con `<Link>`:

```tsx
// components/Header.tsx
'use client';

import Link from 'next/link';

// Actualiza tu Header para:
// - Convertir el logo "Min-Commerce" en <Link href="/">
// - Agregar <Link href="/cart">Carrito</Link>
// - Mantener los estilos existentes
//
// Tip: usa <Link href="/cart"> en lugar de <a href="/cart">
// <Link> navega sin recargar la página (SPA)
```

> ⚠️ **Server vs Client:** Al agregar `'use client'`, el Header ahora se ejecuta en el navegador. Esto es necesario porque pronto usará `useCart()` (un hook). El Footer puede seguir siendo Server Component — no necesita interactividad.

### Paso 3: Verificar navegación

Navega entre `/` y `/cart` usando los links del Header. Observa que:
- El Header y Footer **persisten** sin re-renderizarse
- Solo el contenido central cambia
- La URL se actualiza sin recarga completa de página

**✅ Checkpoint Parte 1:** Puedes navegar entre `/` y `/cart` usando los links del Header. El Header y Footer persisten sin recargarse. La URL cambia correctamente.

---

## Parte 2: CartContext + useCart Hook (35 min)

**Objetivo:** Crear un estado global del carrito accesible desde cualquier componente usando Context API.

### Paso 1: Definir el tipo CartItem

Agrega a `types/product.ts` (o crea `types/cart.ts`):

```typescript
// Un CartItem es un Product con campo quantity adicional
export type CartItem = Product & { quantity: number };
```

> 💡 **Intersection type (`&`)**: Combina dos tipos en uno. `CartItem` tiene todos los campos de `Product` más `quantity`.

### Paso 2: Crear CartContext

Crea `context/CartContext.tsx`. Este archivo define el Context, el Provider, y el hook.

```tsx
// context/CartContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';
// Importa tus tipos Product y CartItem

// 1. Define CartContextType con:
//    - cart: CartItem[]
//    - addToCart: (product: Product) => void
//    - removeFromCart: (productId: string) => void
//    - updateQuantity: (productId: string, quantity: number) => void
//    - clearCart: () => void
//    - totalItems: number
//    - totalPrice: number

// 2. Crea el Context
// const CartContext = createContext<CartContextType | undefined>(undefined);

// 3. Implementa CartProvider con la lógica de:
//    - addToCart: si ya existe, incrementar quantity; si no, agregar con quantity 1
//    - removeFromCart: filtrar por id
//    - updateQuantity: actualizar quantity del item
//    - clearCart: vaciar array
//    - totalItems: reducir para sumar quantities
//    - totalPrice: reducir para sumar price * quantity

// 4. Exporta el custom hook useCart
// export function useCart() { ... }
```

### Paso 3: Envolver la app con CartProvider

Actualiza `app/layout.tsx`:

```tsx
// Importa CartProvider
// Envuelve el contenido con <CartProvider>
//
// Estructura:
//   <CartProvider>
//     <Header />
//     <main>{children}</main>
//     <Footer />
//   </CartProvider>
```

> ⚠️ **Nota importante:** Como CartProvider usa `'use client'`, necesitarás extraer la parte del body a un componente Client separado, o envolver CartProvider correctamente. Next.js permite que un Client Component envuelva Server Components como children.

### Paso 4: Conectar botón "Agregar al carrito"

Actualiza `ProductCard.tsx` para usar el hook `useCart`:

```tsx
// 1. Agrega 'use client' al inicio (si no lo tiene ya)
// 2. Importa useCart
// 3. Dentro del componente: const { addToCart } = useCart();
// 4. Agrega un botón que llame addToCart(product)
```

### Paso 5: Mostrar badge en Header

Actualiza `Header.tsx` para mostrar la cantidad de items:

```tsx
// Usa useCart() para obtener totalItems
// Muestra un badge junto al link de carrito: 🛒 (3)
```

**✅ Checkpoint Parte 2:** Al hacer clic en "Agregar al carrito" en un ProductCard, el badge del Header se actualiza con la cantidad correcta.

---

## Parte 3: Página del Carrito (30 min)

**Objetivo:** Construir la página `/cart` con lista de items, controles de cantidad, y total calculado.

### Paso 1: Implementar la página del carrito

Actualiza `app/cart/page.tsx`:

```tsx
// app/cart/page.tsx
'use client';

// Usa useCart() para obtener cart, removeFromCart, updateQuantity, totalPrice, clearCart
//
// Implementa:
// 1. Si el carrito está vacío → mensaje + link a "/"
// 2. Si tiene items → lista de productos con:
//    - Imagen (pequeña), nombre, precio unitario
//    - Controles de cantidad: botón [-] [cantidad] [+]
//    - Botón eliminar (X)
//    - Subtotal por item (precio × cantidad)
// 3. Total general del carrito
// 4. Botón "Vaciar carrito"
// 5. Botón "Proceder al checkout" (placeholder por ahora)
```

### Paso 2: Manejar edge cases

- Cantidad no puede ser menor a 1 (deshabilitar botón `-` cuando quantity === 1)
- Si se elimina el último item, mostrar mensaje de carrito vacío

**✅ Checkpoint Parte 3:** La página `/cart` muestra los items agregados, permite cambiar cantidades, eliminar productos, y muestra el total actualizado en tiempo real.

---

## 📁 Estructura Final

```
min-commerce/
├── app/
│   ├── layout.tsx            # Layout con Header + Footer + CartProvider
│   ├── page.tsx              # Catálogo de productos
│   ├── globals.css
│   └── cart/
│       └── page.tsx          # Página del carrito
├── components/
│   ├── ProductCard.tsx       # Con botón "Agregar al carrito"
│   ├── Header.tsx            # 'use client' + <Link> + badge carrito
│   └── Footer.tsx            # Server Component (sin cambios de C17)
├── context/
│   └── CartContext.tsx       # Provider + useCart hook
├── types/
│   └── product.ts            # Product + CartItem
├── data/
│   └── products.ts
└── ...
```

---

## ⭐ Logros Adicionales

### 🟢 Básico: Persistencia con localStorage

Modifica `CartProvider` para guardar y recuperar el carrito de `localStorage`:

```typescript
// Al iniciar: leer de localStorage
// Cuando cart cambie: guardar en localStorage
// Tip: usa useEffect para ambos casos
// Clave sugerida: 'min-commerce-cart'
```

### 🟡 Intermedio: Ruta dinámica `/product/[id]`

Crea una página de detalle de producto:

```
app/product/[id]/page.tsx
```

- Recibe `params.id` y busca el producto en los datos mock
- Muestra toda la información del producto
- Incluye botón "Agregar al carrito"
- Si el producto no existe, muestra mensaje de error

### 🔴 Avanzado: Animación del badge

Cuando se agrega un producto al carrito, el badge del Header debería tener una animación breve (scale up + color) que confirme visualmente la acción.

---

## 📝 Instrucciones de Entrega

### Requisitos

- [ ] Ruta `/cart` creada con App Router
- [ ] Header con `'use client'` y navegación con `<Link>`
- [ ] Navegación funcional entre `/` y `/cart`
- [ ] CartContext con Provider y useCart hook
- [ ] Botón "Agregar al carrito" funciona desde el catálogo
- [ ] Página `/cart` con lista, cantidad, eliminar y total
- [ ] Sin errores de TypeScript (`npm run build` pasa)

### Entregables

1. **URL del repositorio GitHub** con código actualizado
2. **URL de Vercel** con la app desplegada
3. **Screenshot** del carrito con productos agregados