# Lab 20: Roles + Middleware (Lab Calificado)

> ⚠️ **Lab Calificado** - Este es el lab evaluado del Módulo 5. Distribución: 50% en clase + 50% post-clase.

Hoy completas Min-Commerce con autorización basada en roles. Agregarás roles USER/ADMIN al modelo User que ya tienes configurado con Prisma Adapter, crearás un middleware que protege rutas automáticamente, y construirás un panel de administración exclusivo.

## 🎯 Objetivos

1. Agregar roles de usuario al modelo existente con enums de Prisma
2. Implementar roles de usuario con enums y proteger rutas con middleware
3. Construir un panel de administración accesible solo para ADMIN

---

## 🔑 Conceptos Clave

- **Prisma Adapter** - Conector que sincroniza NextAuth sessions/users con tu base de datos
- **Role enum** - Tipo de dato en Prisma que limita los valores posibles (USER, ADMIN)
- **middleware.ts** - Archivo en la raíz que intercepta requests antes de llegar a las páginas
- **Matcher** - Configuración que define qué rutas procesa el middleware

---

## ⚙️ Setup Inicial

| ✓ | Requisito | Verificación |
|---|-----------|--------------|
| ☐ | Min-Commerce con App Router | Layout + navegación |
| ☐ | Carrito con Context API | Agregar/eliminar funciona |
| ☐ | NextAuth con GitHub OAuth | Login/logout funcional |
| ☐ | Prisma Adapter conectado (clase 19) | Usuarios persistidos en PostgreSQL |

---

## Parte 1: Agregar Roles al Modelo User (15 min)

**Objetivo:** Agregar un sistema de roles al modelo User para distinguir entre usuarios normales y administradores.

### Paso 1: Agregar enum Role y campo role al modelo User

Edita `prisma/schema.prisma`. Agrega el enum y el campo al modelo User existente:

```prisma
// prisma/schema.prisma

// Agrega el enum Role con valores USER y ADMIN
// enum Role {
//   USER
//   ADMIN
// }

// En el modelo User existente, agrega el campo:
//   role  Role  @default(USER)
```

### Paso 2: Agregar modelo Order

En el mismo `prisma/schema.prisma`, agrega el modelo para órdenes:

```prisma
// Define el modelo Order:
// - id        String   @id @default(cuid())
// - userId    String   (relación con User)
// - items     Json
// - total     Float
// - status    String   @default("pending")
// - createdAt DateTime @default(now())
//
// Agrega la relación inversa en User:
//   orders  Order[]
```

### Paso 3: Sincronizar con la base de datos

```bash
npx prisma db push
```

### Paso 4: Extender el tipo de sesión

TypeScript no sabe que `session.user` tiene un campo `role`. Crea `types/next-auth.d.ts`:

```typescript
// types/next-auth.d.ts

import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      role: string;
    } & DefaultSession['user'];
  }
}
```

> Sin este archivo, TypeScript lanzará `Property 'role' does not exist on type 'User'` cada vez que uses `session.user.role`.

### Paso 5: Exponer rol en la sesión

Actualiza `auth.ts` para incluir el rol en la sesión:

```typescript
// auth.ts

// Agrega callbacks para incluir role en la session:
// callbacks: {
//   session({ session, user }) → agregar session.user.role
// }
```

### Paso 6: Verificar

Haz login con GitHub. Revisa en Neon Dashboard que tu usuario tiene el campo `role` con valor `USER`.

**✅ Checkpoint Parte 1:** El modelo User tiene campo `role` con valor default USER. `types/next-auth.d.ts` creado. El session callback expone el rol.

---

## Parte 2: Middleware de Protección (30 min)

**Objetivo:** Crear un middleware que redirige automáticamente a usuarios no autenticados y controla acceso por rol.

### Paso 1: Crear middleware.ts

Crea `middleware.ts` en la **raíz del proyecto** (al mismo nivel que `app/`):

```typescript
// middleware.ts

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Ruta protegida sin sesión → redirigir a login
  if (!session) {
    // TODO: Redirigir a /api/auth/signin usando NextResponse.redirect()
  }

  // Ruta admin sin rol ADMIN → redirigir a /
  if (pathname.startsWith('/admin') && session?.user?.role !== 'ADMIN') {
    // TODO: Redirigir a / usando NextResponse.redirect()
  }
});

export const config = {
  matcher: ['/cart', '/checkout', '/admin/:path*'],
};
```

> 💡 **Tip:** Para redirigir usa `NextResponse.redirect(new URL('/ruta', req.url))`

### Paso 2: Probar protección

1. **Sin login:** Navega a `/cart` → debe redirigir a login
2. **Con login (USER):** Navega a `/cart` → debe mostrar el carrito
3. **Con login (USER):** Navega a `/admin` → debe redirigir a `/`

### Paso 3: Promover un usuario a ADMIN

En Neon Dashboard, edita manualmente el campo `role` de tu usuario a `ADMIN`. Cierra sesión y vuelve a iniciar para que la sesión se actualice.

**✅ Checkpoint Parte 2:** Las rutas protegidas redirigen correctamente. Un USER no puede acceder a `/admin`. Un ADMIN sí puede.

---

## Parte 3: Panel de Administración (30 min)

**Objetivo:** Construir un panel de administración accesible solo para usuarios con rol ADMIN.

### Paso 1: Crear la página admin

Crea `app/admin/page.tsx`:

```tsx
// app/admin/page.tsx

// Esta es una Server Component — puede verificar la sesión del lado del servidor
//
// Implementa:
// 1. Obtener la sesión del servidor (import { auth } from '@/auth')
// 2. Verificar que el usuario es ADMIN (doble verificación, además del middleware)
// 3. Mostrar:
//    - Título "Panel de Administración"
//    - Nombre del admin logueado
//    - Lista de usuarios registrados (query Prisma)
//    - Estadísticas básicas: total usuarios, total órdenes
```

### Paso 2: Agregar link condicional en Header

Modifica el Header para mostrar el link a `/admin` solo si el usuario es ADMIN:

```tsx
// En Header.tsx:
// Si session.user.role === 'ADMIN' → mostrar link "Admin"
// Si no → no mostrar nada
```

### Paso 3: Crear página de órdenes admin

Crea `app/admin/orders/page.tsx`:

```tsx
// Muestra todas las órdenes de todos los usuarios
// Incluye: usuario, items, total, fecha, status
// Solo accesible para ADMIN (middleware ya lo protege)
```

**✅ Checkpoint Parte 3:** El panel admin muestra usuarios y estadísticas. Solo el link "Admin" aparece para usuarios ADMIN. Users normales son redirigidos.
