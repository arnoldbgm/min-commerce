# GUÍA 02: Persistencia de Usuarios con Prisma y PostgreSQL

En esta guía, extenderemos nuestra implementación de NextAuth para guardar los datos de los usuarios, sesiones y cuentas en una base de datos PostgreSQL utilizando el ORM Prisma.

---

### Prerrequisitos

- Haber completado la `GUIA.md` inicial.
- Tener una base de datos PostgreSQL en ejecución y accesible. Puedes usar un servicio en la nube como Supabase, Neon, o una instancia local con Docker.
- Tener la URL de conexión de tu base de datos. Ejemplo: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require`

---

## 🧩 PASO 1 — Instalar Dependencias de Prisma

Primero, necesitamos añadir Prisma y su adaptador para NextAuth a nuestro proyecto.

```bash
# Instala el CLI de Prisma como dependencia de desarrollo
npm install prisma --save-dev

# Instala el Cliente de Prisma y el Adaptador de NextAuth
npm install @prisma/client @auth/prisma-adapter
```

---

## 🧩 PASO 2 — Inicializar Prisma

Este comando creará una nueva carpeta `prisma` con un archivo de esquema (`schema.prisma`) y configurará la variable de entorno para la base de datos en tu archivo `.env.local`.

```bash
npx prisma init
```

---

## 🧩 PASO 3 — Configurar el Esquema de Prisma

Abre el archivo `prisma/schema.prisma` que se acaba de crear y modifícalo para que se vea así:

1.  **Configura el proveedor de base de datos:** Cambia `provider` a `postgresql`.
2.  **Añade los modelos de NextAuth:** Copia y pega los modelos `User`, `Account`, `Session`, y `VerificationToken` que son requeridos por el `@auth/prisma-adapter`.

Tu `prisma/schema.prisma` debería quedar así:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

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

---

## 🧩 PASO 4 — Configurar la URL de la Base de Datos

Abre tu archivo `.env.local` y asegúrate de que la variable `DATABASE_URL` contenga la cadena de conexión a tu base de datos PostgreSQL. Prisma ya debería haberla añadido, solo tienes que ponerle el valor correcto.

```env
# .env.local

# ... tus otras variables (GITHUB_ID, GITHUB_SECRET, etc.)

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```
**Nota:** Reemplaza `USER`, `PASSWORD`, `HOST`, `PORT` y `DATABASE` con tus credenciales reales.

---

## 🧩 PASO 5 — Sincronizar el Esquema con la Base de Datos

Ahora, ejecuta el siguiente comando para que Prisma cree las tablas en tu base de datos PostgreSQL basándose en el esquema que definiste.

```bash
npx prisma generate
npx prisma db push
```

Si todo va bien, verás un mensaje indicando que tu base de datos está sincronizada con tu esquema. También puedes usar `npx prisma studio` para abrir una interfaz gráfica en el navegador y ver los datos.

---

## 🧩 PASO 6 — Crear una Instancia del Cliente de Prisma

Para evitar crear múltiples conexiones a la base de datos en un entorno de desarrollo (debido al hot-reloading de Next.js), es una buena práctica crear una única instancia del cliente de Prisma.

Crea la carpeta y el archivo `src/lib/prisma.ts` y añade el siguiente código:

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

---

## 🧩 PASO 7 — Conectar el Adaptador de Prisma a NextAuth

Finalmente, vamos a decirle a NextAuth que use el adaptador de Prisma para gestionar los datos.

Modifica tu archivo `app/api/auth/[...nextauth]/route.ts`:

1.  **Importa el adaptador y el cliente de Prisma.**
2.  **Añade la propiedad `adapter`** a la configuración de `authOptions`.

El archivo actualizado se verá así:

```typescript
// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import { AuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@src/lib/prisma" // Ajusta la ruta a tu cliente Prisma

export const authOptions: AuthOptions = {
  // 1. Añade el adaptador de Prisma
  adapter: PrismaAdapter(prisma),

  // 2. Configura tus proveedores como antes
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    // ...puedes añadir más proveedores aquí
  ],
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```
**Importante:** Al usar un adaptador, NextAuth por defecto usa una estrategia de sesión de base de datos (`strategy: "database"`). Esto significa que la sesión del usuario se guarda en la tabla `Session` que creamos.

---

## ¡Listo!

Ahora, cuando un usuario inicie sesión a través de GitHub, NextAuth utilizará el `PrismaAdapter` para crear automáticamente registros en las tablas `User` y `Account` de tu base de datos PostgreSQL. Las sesiones se gestionarán en la tabla `Session`.

Puedes verificar que funciona iniciando sesión y luego revisando los datos en tu base de datos.
