# 🎓 Clase: Middleware, Roles y Control de Acceso en Next.js

Esta guía está diseñada para explicar paso a paso cómo proteger una aplicación profesional, desde un bloqueo simple hasta un sistema de permisos basado en roles de base de datos.

---

## 1. ¿Qué es un Middleware? (El "Guardia" de la Entrada)

El Middleware es una función que se ejecuta **antes** de que una petición llegue a tu página. Imagínalo como el guardia de seguridad de un edificio que revisa tu identificación antes de dejarte pasar al ascensor.

### Ejemplo 1: Demostración Simple (Bloqueo Total)
Crea el archivo `middleware.ts` en la **raíz** de tu proyecto:

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/request'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`--- Interceptando ruta: ${pathname} ---`);

  // BLOQUEO DEMO: Si alguien intenta entrar a /dashboard, lo mandamos al Home
  if (pathname.startsWith('/dashboard')) {
    console.log('¡Acceso denegado a Dashboard! Redirigiendo...');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next(); // "Pase, usted puede continuar"
}

// El Matcher define qué rutas vigila el guardia
export const config = {
  matcher: ['/dashboard/:path*'],
}
```
```
   1 // middleware.ts
    2 import { NextResponse } from 'next/server'
    3 import type { NextRequest } from 'next/server'
    4
    5 export function middleware(request: NextRequest) {
    6   // Obtenemos la ruta que el usuario intenta visitar
    7   const { pathname } = request.nextUrl;
    8
    9   // Mostramos en la terminal del servidor qué ruta se está interceptando
   10   console.log(`--- Middleware interceptando ruta: ${pathname} ---`);
   11
   12   // DEMOSTRACIÓN: Si el usuario intenta entrar a /dashboard, lo redirigimos a la Home
   13   if (pathname.startsWith('/dashboard')) {
   14     console.log('¡Acceso a Dashboard interceptado! Redirigiendo a "/"...');
   15
   16     // Creamos la URL de redirección absoluta
   17     return NextResponse.redirect(new URL('/', request.url));
   18   }
   19
   20   // Si no es la ruta protegida, permitimos que la petición continúe normalmente
   21   return NextResponse.next();
   22 }
   23
   24 // El "matcher" define exactamente qué rutas activarán este middleware.
   25 // Esto es más eficiente que ejecutarlo en cada imagen o archivo estático.
   26 export const config = {
   27   matcher: [
   28     '/dashboard/:path*', // Aplica a /dashboard y cualquier subruta como /dashboard/config
   29   ],
   30 }

```
---

## 2. Preparando la Base de Datos (Definiendo los Roles)

Para que el Middleware sea inteligente, necesita saber **quién es el usuario**. Primero, definimos qué tipos de usuarios existen en nuestra base de datos usando un `enum`.

### Paso 2.1: Modificar `prisma/schema.prisma`

```prisma
// 1. Definimos los tipos de roles permitidos
enum Role {
  USER
  ADMIN
}

// 2. Agregamos la columna 'role' al modelo de Usuario
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  role          Role      @default(USER) // Por defecto todos son USER
  // ... otros campos (image, accounts, sessions)
}
```

**Comando para actualizar la BD:**
```bash
npx prisma db push
```

---

## 3. El Puente: NextAuth Callbacks

Por seguridad, NextAuth **no entrega todos los datos** del usuario por defecto (solo nombre, email e imagen). Si queremos que el Middleware sepa el "rol", debemos "inyectarlo" manualmente en la sesión.

### Paso 3.1: Configurar el Callback de Sesión
Edita tu archivo de configuración de NextAuth (ej. `app/api/auth/[...nextauth]/route.ts`):

```typescript
export const authOptions = {
  // ... providers y adapter de Prisma
  callbacks: {
    async session({ session, user }) {
      // El objeto 'user' viene de la base de datos (Prisma)
      // El objeto 'session' es lo que el cliente y el middleware ven
      if (session.user) {
        // @ts-ignore
        session.user.role = user.role; // Pasamos el rol de la BD a la Sesión
      }
      return session;
    },
  },
};
```

---

## 4. Middleware Profesional (Control de Acceso por Rol)

Ahora que tenemos el rol en la sesión, podemos hacer que nuestro Middleware sea dinámico.

```typescript
// middleware.ts (Versión Final)
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt' // Método más rápido para el middleware

export async function middleware(req) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. Si no hay sesión, redirigir al Login
  if (!session) {
    return NextResponse.redirect(new URL('/api/auth/signin', req.url));
  }

  // 2. Si la ruta es de ADMIN y el usuario no lo es, redirigir al Home
  if (pathname.startsWith('/dashboard') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/cart'],
}
```

---

## 💡 Resumen para los alumnos

1.  **Middleware:** Filtra peticiones antes de que carguen las páginas.
2.  **Enum (Prisma):** Asegura que solo existan los roles que definimos (USER/ADMIN).
3.  **Callbacks (NextAuth):** Funcionan como un "puente" para pasar datos privados de la base de datos (como el rol) hacia la sesión pública.
4.  **Flujo:** `Usuario pide página` -> `Middleware revisa Sesión` -> `¿Tiene Rol?` -> `Permitir o Redirigir`.
