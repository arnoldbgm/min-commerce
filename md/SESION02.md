# Guión de Clase Práctico: Carrito de Compras con Zustand

Este guión combina la explicación conceptual con el código específico a mostrar en cada paso, haciéndolo ideal para una clase práctica y directa.

---

### **Introducción (3 minutos)**

**👨‍🏫 Lo que dirás (el concepto):**
"Hola a todos. Hoy resolveremos un problema fundamental: ¿cómo hacer que un clic en un botón 'Comprar' actualice un contador en el `Header`? La solución es un **estado global**, una especie de 'memoria compartida' para nuestros componentes. Usaremos **Zustand** porque es la forma más sencilla y directa de lograrlo en React."

---

### **PASO 1: Preparar el Proyecto (2 minutos)**

**👨‍🏫 Lo que dirás:**
"Vamos a instalar Zustand, una librería simple para manejar nuestro estado global y evitar problemas como 'prop drilling'."

**💻 Lo que harás (el código):**
Muestra la terminal y ejecuta:
```bash
npm install zustand
```

---

### **PASO 2: Crear la Store Central (`store.ts`) (15 minutos)**

**👨‍🏫 Lo que dirás:**
"Crearemos nuestra 'store', el cerebro del carrito. Será un archivo que vivirá fuera de los componentes y contendrá tanto los datos (los productos del carrito) como las funciones para manejarlos. Será nuestra **única fuente de verdad**."

**💻 Lo que harás:**
Crea el archivo `src/context/store.ts` y escribe o pega el siguiente código:

```typescript
// src/context/store.ts

import { create } from 'zustand';
import { Product } from '@/src/types/product';

// 1. Definimos la 'forma' de nuestra store
interface CartState {
  cart: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

// 2. Creamos la store
export const useCartStore = create<CartState>((set) => ({
  // Datos (estado inicial)
  cart: [],

  // Funciones para modificar el estado (acciones)
  addToCart: (product) => 
    set((state) => ({ 
      cart: [...state.cart, product] 
    })),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((product) => product.id !== productId),
    })),

  clearCart: () => set({ cart: [] }),
}));
```

**💡 Puntos clave para mencionar mientras muestras el código:**
*   "La **interfaz** es como un 'contrato' que nos obliga a mantener una estructura ordenada."
*   "La función `create` es el corazón de Zustand. Dentro definimos el estado inicial y las acciones."
*   "Fíjense en `addToCart`. Usamos la función `set` para actualizar el estado. **Es la única forma de hacerlo.**"
*   "La línea `cart: [...state.cart, product]` es crucial. No modificamos el array, creamos uno **nuevo**. Esto se llama **inmutabilidad** y es fundamental para que React detecte los cambios y funcione correctamente."

---

### **PASO 3: Añadir Productos desde `ProductCard` (10 minutos)**

**👨‍🏫 Lo que dirás:**
"Ahora que la store existe, vamos a hacer que el botón 'Comprar' 'escriba' en ella. Verán qué fácil es conectar un componente para que dispare una acción."

**💻 Lo que harás:**
Modifica el archivo `src/components/product-card.tsx`:

```tsx
// src/components/product-card.tsx
"use client"; // Clave para usar hooks y eventos

import { Product } from "@/src/types/product";
import Image from "next/image";
import { useCartStore } from "@/src/context/store"; // 1. Importamos la store

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCartStore(); // 2. Obtenemos la acción

  return (
    <div className="border rounded-lg p-4">
      {/* ...código de la imagen y el título... */}
      <button
        onClick={() => addToCart(product)} // 3. Llamamos a la acción en el onClick
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Comprar
      </button>
    </div>
  );
}
```

**💡 Puntos clave para mencionar:**
*   "Añadimos `'use client'` porque vamos a manejar un evento `onClick`, lo cual es interactividad del lado del cliente."
*   "Con una sola línea, `const { addToCart } = useCartStore()`, hemos traído la función desde nuestra store."
*   "En el `onClick`, llamamos directamente a `addToCart` con el producto. Este componente ya cumplió su trabajo. No sabe ni le importa qué pasa después. Está **desacoplado**."

---

### **PASO 4: Mostrar el Contador en el `Header` (10 minutos)**

**👨‍🏫 Lo que dirás:**
"Esta es la parte más gratificante. Vamos a hacer que el `Header` 'lea' el estado del carrito. Zustand hará que se actualice automáticamente cada vez que el estado cambie, sin que tengamos que hacer nada más."

**💻 Lo que harás:**
Modifica el archivo `src/components/header.tsx`:

```tsx
// src/components/header.tsx
"use client"; // Necesario para 'leer' un estado que cambia

import Link from "next/link";
import { useCartStore } from "@/src/context/store"; // 1. Mismo hook, diferente uso

export default function Header() {
  const { cart } = useCartStore(); // 2. Esta vez, obtenemos los datos

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between">
      <Link href="/">Min-Commerce</Link>
      <nav>
        {/* ...otros links... */}
        <Link href="/cart">
          {/* 3. Mostramos la cantidad de items */}
          Carrito ({cart.length})
        </Link>
      </nav>
    </header>
  );
}
```

**💡 Puntos clave para mencionar:**
*   "De nuevo, `'use client'` para que el componente pueda ser dinámico y 'reaccionar' a cambios."
*   "Usamos el mismo hook `useCartStore`, pero esta vez extraemos la variable `cart`."
*   "Simplemente renderizamos `cart.length`. **Zustand se encarga de la 'magia'**: cuando otro componente actualice la store, Zustand notificará a este `Header`, que se volverá a renderizar con el nuevo número. Esto es la **reactividad**."

---

### **Conclusión (5 minutos)**

**👨‍🏫 Lo que dirás:**
"¡Y listo! Probemos (haz clic en varios botones 'Comprar' y muestra cómo el header se actualiza). Hemos creado un sistema donde los componentes no se hablan entre sí, sino que se comunican a través de una store central. Esto es limpio, escalable y la forma moderna de manejar el estado en aplicaciones React. ¡Felicidades!"
