import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google";
import { AuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/src/lib/prisma";

export const authOptions: AuthOptions = {
   // Configura uno o más proveedores de autenticación
   adapter: PrismaAdapter(prisma),

   providers: [
      GithubProvider({
         clientId: process.env.GITHUB_ID as string,
         clientSecret: process.env.GITHUB_SECRET as string,
      }),
      GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID as string,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
      })
      // ...puedes añadir más proveedores aquí
   ],
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }