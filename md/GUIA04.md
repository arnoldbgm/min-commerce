# Guía para Alumnos: Creando un Carrito de Compras con Zustand

¡Hola! En esta guía aprenderemos a manejar un "estado global" en nuestra aplicación. El objetivo es que cuando un usuario agregue un producto desde cualquier parte de la web, el ícono del carrito en el `Header` se actualice al instante.

Usaremos **Zustand**, una librería minimalista y potente que hace esto muy sencillo.

### ¿Por qué Zustand?

Imagina que el "estado" de tu carrito (la lista de productos) es una variable. Si esa variable está en un componente, ¿cómo le avisas a otro componente lejano (como el Header) que la variable cambió? Podrías pasar funciones y datos a través de muchos componentes intermedios (esto se llama "prop drilling" y es tedioso).

Zustand crea un "almacén" (store) fuera de tus componentes. Cualquier componente puede suscribirse a este almacén, leer su estado y notificar cambios.



---

## PASO 1: Instalar Zustand

Abre tu terminal y ejecuta el siguiente comando en la raíz de tu proyecto:

```bash
npm install zustand
```

---

## PASO 2: Crear nuestra "Store" del Carrito

La "store" es el cerebro de nuestro carrito. Contendrá la lista de productos y las funciones para manipularla (agregar, eliminar, etc.).

1.  Basado en tu proyecto, vamos a crear el archivo en `src/context/store.ts`.
2.  Pega el siguiente código:

```typescript
// src/context/store.ts

import { create } from 'zustand';
import { Product } from '@/src/types/product'; // <-- Importamos nuestro tipo de producto

// Definimos la forma de nuestro estado y las acciones
interface CartState {
  cart: Product[]; // El estado será un array de productos
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

// Creamos la store con create()
export const useCartStore = create<CartState>((set) => ({
  // Estado inicial
  cart: [],

  // Acción para agregar un producto al carrito
  addToCart: (product) => 
    set((state) => {
      // Opcional: Evitar duplicados
      const productExists = state.cart.find(p => p.id === product.id);
      if (productExists) {
        return {}; // No hacemos nada si el producto ya está
      }
      // Agregamos el nuevo producto al array existente
      return { cart: [...state.cart, product] };
    }),

  // Acción para eliminar un producto del carrito
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((product) => product.id !== productId),
    })),

  // Acción para vaciar el carrito
  clearCart: () => set({ cart: [] }),
}));
```

**Explicación del código:**
*   `create<CartState>`: Inicializa la store y le dice a TypeScript qué forma tiene nuestro estado y acciones.
*   `set`: Es la función que nos da Zustand para modificar el estado de forma segura e inmutable.
*   `addToCart`: Recibe un producto y usa `set` para devolver un nuevo estado del carrito que incluye el nuevo producto. Usamos `...state.cart` para crear una copia del array anterior y no modificarlo directamente (esto es clave en React).

---

## PASO 3: Conectar el Botón "Comprar"

Ahora vamos al componente que muestra cada producto (en tu caso, `src/components/product-card.tsx`) para que el botón "Comprar" use la acción `addToCart`.

```tsx
// src/components/product-card.tsx
"use client"; // <-- ¡Importante! Necesitamos que sea un componente de cliente para usar hooks

import { Product } from "@/src/types/product";
import Image from "next/image";
import { useCartStore } from "@/src/context/store"; // 1. Importamos nuestra store

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  // 2. Obtenemos la acción que necesitamos de la store
  const { addToCart } = useCartStore();

  const handleAddToCart = () => {
    // 3. Llamamos a la acción con el producto actual
    addToCart(product);
    alert(`${product.name} ha sido agregado al carrito!`); // Feedback para el usuario
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col items-center">
      <Image src={product.image} alt={product.name} width={200} height={200} />
      <h2 className="text-lg font-bold">{product.name}</h2>
      <p className="text-gray-500">${product.price}</p>
      <button
        onClick={handleAddToCart} // 4. Asignamos la función al evento onClick
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Comprar
      </button>
    </div>
  );
}
```

---

## PASO 4: Mostrar el Contador en el Header

Este es el paso donde la "magia" de Zustand brilla. Haremos que el Header lea el estado del carrito y se actualice solo.

Modificamos `src/components/header.tsx`:

```tsx
// src/components/header.tsx
"use client"; // <-- También debe ser un componente de cliente

import Link from "next/link";
import { useCartStore } from "@/src/context/store"; // 1. Importamos la store

export default function Header() {
  // 2. Obtenemos el estado 'cart' de la store
  const { cart } = useCartStore();

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        Min-Commerce
      </Link>
      <nav className="flex items-center">
        <Link href="/productos" className="mr-4">
          Productos
        </Link>
        <Link href="/cart" className="mr-4 p-2 rounded-full hover:bg-gray-700 relative">
          <span>🛒</span>
          {/* 3. Mostramos la cantidad de items en el carrito */}
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </Link>
        {/* ...otros links y botones */}
      </nav>
    </header>
  );
}
```

**¿Cómo funciona?**
El hook `useCartStore()` conecta el componente `Header` a la store. Cada vez que el estado de la store cambie (por ejemplo, al llamar a `addToCart` desde `ProductCard`), Zustand notificará a `Header`, este se volverá a renderizar y mostrará el nuevo `cart.length`.

---

¡Y listo! Con estos pasos, has creado un sistema de carrito de compras funcional, desacoplado y fácil de mantener. Cualquier otro componente que necesite interactuar con el carrito solo necesitará importar y usar el hook `useCartStore`.
