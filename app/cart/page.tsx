"use client"

import { useOsos } from "@/src/context/store"

export default function CartPage() {
   const ososCart = useOsos((state) => state.osos)
   return (
      <h1>Tienes actualmente los siguientes osos {ososCart} </h1>
   )
}