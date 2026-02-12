import { type Product } from "@/src/types/product";

interface Props {
    product: Product;
}

export default function ProductCard({ product }: Props) {
  return (
    <div className="border rounded-lg p-4 max-w-64">
      <h2 className="text-xl font-bold mb-2">{product.name}</h2>
      <p className="text-gray-600 mb-4">Precio: {product.price} soles</p>
      <p className="text-gray-600 mb-4">Categoría: {product.category}</p>
      <p className="text-gray-600 mb-4">Descripción: {product.description}</p>
      <p className={`text-sm font-semibold ${product.inStock ? "text-green-500" : "text-red-500"}`}>
        {product.inStock ? "En stock" : "Agotado"}
      </p>
      <button className="bg-red-600">Agregar al carrito</button>
    </div>
  );
}