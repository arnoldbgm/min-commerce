# Guía Rápida: Middleware de Autenticación con Next.js

Esta es la guía más sencilla para implementar un sistema de roles y rutas protegidas en tu proyecto, usando Prisma, NextAuth y un Middleware centralizado.

---

### PASO 1: Extender el Usuario en la Base de Datos

Primero, le decimos a la base de datos que un usuario puede tener un rol.

1.  **Abre `prisma/schema.prisma`** y añade un `enum` para los roles y el campo `role` a tu modelo `User`.

    ```prisma
    // prisma/schema.prisma

    // Define los roles posibles
    enum Role {
      USER
      ADMIN
    }

    // Añade el campo 'role' al usuario
    model User {
      // ... tus campos existentes: id, name, email, etc.
      role  Role @default(USER) // <-- Añade esta línea
    }
    ```

2.  **Actualiza tu base de datos** ejecutando en la terminal:

    ```bash
    npx prisma db push
    ```

---

### PASO 2: Exponer el Rol del Usuario en la Sesión

Ahora, nos aseguramos de que el rol se cargue en la sesión del usuario cada vez que inicie sesión.

1.  **Abre tu configuración de NextAuth** (usualmente en un archivo como `lib/auth.ts` o `app/api/auth/[...nextauth]/route.ts`) y añade el bloque `callbacks`.

    ```typescript
    // Dentro de tu objeto de configuración de NextAuth (authOptions):
    
    callbacks: {
      async session({ session, user }) {
        if (session.user) {
          // @ts-ignore
          session.user.role = user.role; // Pasa el rol de la BD a la sesión
        }
        return session;
      },
    },
    
    // ...el resto de tu configuración (providers, etc.)
    ```
    > **Nota para usuarios de TypeScript:** Para evitar errores de tipo, no olvides crear un archivo `src/types/next-auth.d.ts` para extender la interfaz `Session` y añadir la propiedad `role`.

---

### PASO 3: Crear el Middleware Centralizado

Finalmente, creamos un único "guardia" que protegerá todas las rutas que necesitemos.

1.  **Crea un archivo llamado `middleware.ts`** en la raíz de tu proyecto.

2.  **Pega el siguiente código.** Este se encargará de verificar la sesión y el rol del usuario antes de que pueda acceder a una página protegida.

    ```typescript
    // middleware.ts
    import { NextResponse } from 'next/server'
    import type { NextRequest } from 'next/server'
    import { auth } from '@/src/lib/auth' // Asegúrate que esta ruta a tu config de auth sea correcta

    export async function middleware(request: NextRequest) {
      const session = await auth();
      const { pathname } = request.nextUrl;

      // 1. Si no hay sesión, se le redirige a la página de login
      if (!session) {
        const loginUrl = new URL('/api/auth/signin', request.url)
        loginUrl.searchParams.set('callbackUrl', request.url) // Opcional: para que vuelva a la página que intentaba visitar
        return NextResponse.redirect(loginUrl);
      }

      // 2. Si intenta acceder a una ruta de admin y no tiene el rol, se le redirige al inicio
      if (pathname.startsWith('/admin')) {
        // @ts-ignore
        if (session.user?.role !== 'ADMIN') {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }

      // Si pasa las verificaciones, puede continuar.
      return NextResponse.next();
    }

    // Con el "matcher", defines qué rutas serán protegidas por este middleware
    export const config = {
      matcher: [
        '/dashboard/:path*', // Todas las sub-rutas de /dashboard
        '/admin/:path*',    // Todas las sub-rutas de /admin
        '/cart',
        '/checkout'
      ],
    }
    ```

¡Y ya está! Con estos 3 pasos tienes implementado un sistema de autenticación por roles robusto y fácil de mantener.
