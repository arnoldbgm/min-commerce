import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {

   // Aqui debes de llamar al hook de autentiacion 

   const { data: session } = useSession();

   console.log(session)

   if (session) {
      return (
         <>
            <p>{session.user?.name}</p>
            <img src={session.user?.image} alt="" className="h-12 rounded-full " />
            <button
               onClick={()=> signOut()}
               className="bg-red-700 p-4 rounded-2xl"
            >Cerrar sesion
            </button>
         </>
      )
   }

   return (
      <>
         <p>No logeado</p>
         <button
            onClick={()=> signIn()}
            className="bg-green-700 p-4 rounded-2xl"
         >Iniciar sesion
         </button>
      </>
   )
}