// Tu Global Context con Zustand
// 01. Importar tu context de Zustand
"use client"

import { useOsos } from "../context/store"

export default function ButtonBears() {

   const ososShow = useOsos((state)=> state.osos);
   const inCrementarOsos = useOsos((state) => state.incrementarPoblacion)

   return (
      <>
         <button className="bg-amber-600 p-5" onClick={inCrementarOsos}>Incrementar osos</button>
         <button>Eliminar osos</button>
         <p className="text-blue-950">Cantidad de osos {ososShow}</p>
      </>
   )
}