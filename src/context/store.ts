import { create } from "zustand"

export const useOsos = create((set) => ({
   // Declarar mi variable
   osos: 10,
   incrementarPoblacion: () => set((state) => ({ osos: state.osos + 2 })),
   eliminarOsos: () => set({ osos: 0 })
}))

export const useCartStore = create((set)=> ({
   // Declarando variables
   cart: [],
   totalItems: 0,
   totalPrice: 0,
   addToCart: (product) => set((state)=> ({ cart: [...state.cart, product]}))
}))