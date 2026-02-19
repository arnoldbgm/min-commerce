# Guion de Sesión: Implementando Autenticación Completa en Next.js

---

## 🎯 **Objetivo de la Sesión**

¡Hola a todos! Bienvenidos.

Hoy vamos a construir un sistema de autenticación completo desde cero en una aplicación Next.js. Al final de esta sesión, tendrán una aplicación donde los usuarios pueden iniciar sesión con un proveedor externo (como GitHub), y toda la información de esos usuarios se guardará de forma persistente en una base de datos.

**Tecnologías que usaremos:**
*   **Next.js (con App Router)**: Nuestro framework de React.
*   **NextAuth.js**: La librería que nos facilitará la vida para la autenticación.
*   **Prisma**: Un ORM moderno para hablar con nuestra base de datos de forma segura y en TypeScript.
*   **PostgreSQL**: Nuestro motor de base de datos relacional.

La sesión se dividirá en dos grandes partes:
1.  **Parte 1: Autenticación Rápida**: Implementaremos el flujo de login social sin base de datos.
2.  **Parte 2: Persistencia de Datos**: Conectaremos nuestra app a una base de datos para guardar usuarios, cuentas y sesiones.

¡Empecemos!

---

## **Parte 1: Autenticación con NextAuth.js (Sin Base de Datos)**

*(CONTEXTO PARA EL INSTRUCTOR: En esta primera parte, nos enfocamos en la rapidez y simplicidad de NextAuth.js para tener un login funcional en minutos. La persistencia no es el foco aún.)*

### **Paso 1: Instalación**

Lo primero es lo primero, necesitamos añadir NextAuth.js a nuestro proyecto. Abran su terminal y ejecuten:

```bash
npm install next-auth
```
Esto nos trae todo lo necesario para empezar.

### **Paso 2: La Ruta de Autenticación Mágica**

NextAuth funciona interceptando peticiones en una ruta específica. En el App Router de Next.js, esto se hace con un "Route Handler".

Vamos a crear la siguiente estructura de archivos y carpetas:
`app/api/auth/[...nextauth]/route.ts`

Dentro de este nuevo `route.ts`, vamos a poner la configuración mínima de NextAuth:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { AuthOptions } from "next-auth"

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
}

const handler = NextAuth(authOptions)

// ¡En App Router, exportamos el handler para GET y POST!
export { handler as GET, handler as POST }
```

*(PUNTO DE ENSEÑANZA: Explica que `[...nextauth]` es una "catch-all route" que captura cualquier petición a `/api/auth/...`, como `/api/auth/signin/github`, `/api/auth/callback/github`, `/api/auth/signout`, etc.)*

### **Paso 3: Las Variables de Entorno (Nuestros Secretos)**

NextAuth necesita algunas claves para comunicarse con GitHub y para firmar las cookies de sesión (JWTs).

Creen un archivo `.env.local` en la raíz del proyecto y añadan esto (¡recuerden reemplazar los valores!):

```env
# Credenciales que obtienen de su OAuth App en GitHub
GITHUB_ID=SU_CLIENT_ID_DE_GITHUB
GITHUB_SECRET=SU_CLIENT_SECRET_DE_GITHUB

# Un secreto largo y aleatorio para la seguridad de NextAuth
# Pueden generar uno en la terminal con: openssl rand -hex 32
NEXTAUTH_SECRET=ALGO_MUY_SEGURO_AQUI

# La URL de nuestra app en desarrollo
NEXTAUTH_URL=http://localhost:3000
```
**¡Muy importante!** Cada vez que cambien el `.env.local`, deben reiniciar el servidor de desarrollo.

### **Paso 4: El `SessionProvider` (El Contexto de la Sesión)**

Para que toda nuestra aplicación sepa si un usuario está logueado o no, NextAuth nos da un `SessionProvider`. Pero hay un pequeño truco en App Router.

`SessionProvider` necesita ser un Client Component (`"use client"`), pero nuestro layout principal es un Server Component por defecto. La solución es crear un componente intermedio.

Creen el archivo `src/components/Providers.tsx`:

```tsx
"use client"

import { SessionProvider } from "next-auth/react"
import React from "react"

interface Props {
    children: React.ReactNode;
}

export default function Providers({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>
}
```

Ahora, vamos a `app/layout.tsx` y envolvemos nuestra aplicación con este `Providers`.

```tsx
// app/layout.tsx
import Providers from '@/src/components/Providers'; // O la ruta correcta

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```
*(PUNTO DE ENSEÑANZA: Este es un excelente momento para reforzar la diferencia entre Server Components y Client Components en Next.js.)*

### **Paso 5: El Botón de Login**

¡Es hora de darle al usuario una forma de iniciar sesión! Crearemos un componente que muestra un botón de "Login" o "Logout" dependiendo del estado de la sesión.

Creen `src/components/LoginButton.tsx`:

```tsx
"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export default function LoginButton() {
  const { data: session } = useSession() // Hook para leer la sesión

  if (session) {
    return (
      <>
        Logueado como {session.user?.email} <br />
        <button onClick={() => signOut()}>Cerrar sesión</button>
      </>
    )
  }
  return (
    <>
      No estás logueado <br />
      <button onClick={() => signIn("github")}>Iniciar sesión con GitHub</button>
    </>
  )
}
```
Ahora, solo tenemos que usar este botón en alguna página, como `app/page.tsx`.

---
**✅ CHECKPOINT 1**

¡Hemos terminado la primera parte! En este punto, pueden ejecutar la aplicación (`npm run dev`). Deberían poder:
1. Ver el botón de "Iniciar sesión con GitHub".
2. Hacer clic, ser redirigidos a GitHub para autorizar la app.
3. Volver a la aplicación y ver su email y el botón de "Cerrar sesión".

Todo esto sin haber escrito una sola línea de código de base de datos. ¡Impresionante! Pero... ¿qué pasa si reiniciamos el servidor? La sesión se guarda en una cookie (JWT), pero el usuario no está en ninguna base de datos.

---

## **Parte 2: Persistencia con Prisma y PostgreSQL**

*(CONTEXTO PARA EL INSTRUCTOR: Ahora que los alumnos vieron la "magia", vamos a mostrarles cómo funciona de verdad por debajo, guardando los datos en un lugar permanente.)*

### **Paso 1: Instalando el Arsenal de Prisma**

Necesitamos tres paquetes clave: el CLI de Prisma, el cliente de Prisma (para hacer consultas) y el adaptador que une a NextAuth con Prisma.

```bash
# El CLI como dependencia de desarrollo
npm install prisma --save-dev

# El cliente y el adaptador
npm install @prisma/client @auth/prisma-adapter
```

### **Paso 2: Inicializando Prisma en el Proyecto**

Este comando es nuestro punto de partida con Prisma.

```bash
npx prisma init
```
Esto hace dos cosas:
1. Crea una carpeta `prisma` con un archivo `schema.prisma`. Este es el corazón de nuestra configuración de base de datos.
2. Añade la variable `DATABASE_URL` a nuestro archivo `.env.local`.

### **Paso 3: Definiendo Nuestro Esquema**

Abran `prisma/schema.prisma`. Aquí es donde definimos nuestras tablas. Afortunadamente, NextAuth tiene un esquema estándar que podemos copiar y pegar.

Configuren el archivo para que se vea así:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // ¡Le decimos a Prisma que usaremos PostgreSQL!
  url      = env("DATABASE_URL")
}

// Modelos estándar que el adaptador de NextAuth necesita
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... otros campos que NextAuth usa
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```
*(PUNTO DE ENSEÑANZA: Explica brevemente qué es cada modelo. `User` es el usuario, `Account` vincula a un usuario con un proveedor de OAuth (un usuario puede tener múltiples cuentas), y `Session` gestiona las sesiones activas.)*

### **Paso 4: Conectando con la Base de Datos**

Ahora, vamos al archivo `.env.local` y ponemos la cadena de conexión a nuestra base de datos PostgreSQL.

```env
# .env.local
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/BASEDEDATOS?sslmode=require"
```
*(NOTA PARA EL INSTRUCTOR: Debes proporcionar a los alumnos una cadena de conexión funcional de un servicio como Neon, Supabase, o una instancia local.)*

### **Paso 5: ¡Empujando el Esquema a la Realidad!**

Tenemos la definición, ahora hay que crear las tablas en la base de datos real. Prisma hace esto súper fácil.

```bash
npx prisma db push
```
Este comando lee `schema.prisma` y ejecuta los comandos SQL necesarios para que nuestra base de datos PostgreSQL tenga exactamente esas tablas.

### **Paso 6: El Cliente de Prisma Singleton**

Para hacer consultas, usamos el Cliente de Prisma. Pero en desarrollo, el "hot-reloading" de Next.js puede crear muchas conexiones y agotar los recursos de la base de datos. La solución es crear una única instancia global (patrón Singleton).

Creen el archivo `src/lib/prisma.ts`:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
```
*(PUNTO DE ENSEÑANZA: No es necesario que entiendan cada línea de esto, pero sí el "porqué": evitar múltiples conexiones en desarrollo.)*

### **Paso 7: Conectando Todo en NextAuth**

Este es el paso final. Volvemos a nuestra configuración de NextAuth y le decimos que use el adaptador de Prisma.

Modifiquen `app/api/auth/[...nextauth]/route.ts`:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { AuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter" // ¡Importamos el adaptador!
import prisma from "@/lib/prisma" // ¡Importamos nuestro cliente!

export const authOptions: AuthOptions = {
  // ¡Aquí está la magia!
  adapter: PrismaAdapter(prisma),

  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```
Al añadir la línea `adapter: PrismaAdapter(prisma)`, NextAuth deja de usar JWTs para las sesiones y empieza a usar la base de datos para todo.

---

## **✅ ¡Lo Logramos!**

Ahora, si ejecutan la aplicación, el flujo de login parecerá el mismo para el usuario, pero por debajo está sucediendo mucho más:
1.  Cuando un usuario inicia sesión por primera vez, NextAuth usa el `PrismaAdapter`.
2.  Prisma crea un nuevo registro en la tabla `User` y otro en la tabla `Account`.
3.  Crea una sesión en la tabla `Session`.
4.  La cookie del navegador del usuario solo contiene un ID de sesión, y la validación se hace contra la base de datos.

**Para verificarlo:**
Pueden usar el comando `npx prisma studio`. Esto abrirá una interfaz en el navegador donde podrán ver las tablas y los datos que se han insertado. ¡Inicien sesión y vean cómo aparecen los registros!

## **Resumen y Próximos Pasos**

Hoy hemos aprendido a:
-   Implementar login social con NextAuth.js de forma rápida.
-   Entender la diferencia entre Server y Client components para el `SessionProvider`.
-   Configurar Prisma para conectar nuestra app a una base de datos PostgreSQL.
-   Usar el `PrismaAdapter` para que NextAuth guarde toda la información de manera persistente.

**¿Qué sigue?**
-   Añadir más proveedores (Google, Facebook...).
-   Proteger rutas y páginas del lado del servidor.
-   Extender el modelo `User` con campos personalizados, como roles (`admin`, `user`).

## **Preguntas y Respuestas**

¡Ahora es su turno! ¿Qué dudas tienen?
