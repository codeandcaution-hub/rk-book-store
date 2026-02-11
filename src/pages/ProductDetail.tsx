import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, ArrowLeft } from "lucide-react";
import { useState } from "react";

const categoryLabels: Record<string, string> = {
  books: "Books", notebooks: "Notebooks", pens_pencils: "Pens & Pencils",
  art_supplies: "Art Supplies", desk_accessories: "Desk Accessories", exam_kits: "Exam Kits",
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id!);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);

  if (isLoading) return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></Layout>;
  if (!product) return <Layout><div className="container mx-auto px-4 py-20 text-center">Product not found</div></Layout>;

  const wishlisted = isInWishlist(product.id);
  const handleAction = (action: () => void) => { if (!user) { navigate("/auth"); return; } action(); };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden">
            <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-4">
            <Badge variant="secondary">{categoryLabels[product.category]}</Badge>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <span className="font-medium">{product.rating ?? 0}</span>
              </div>
              <span className="text-muted-foreground">|</span>
              <span className={`text-sm ${product.stock > 0 ? "text-green-600" : "text-destructive"}`}>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>
            <p className="text-3xl font-bold text-primary">₹{product.price}</p>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-md">
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}>-</Button>
                <span className="px-4 font-medium">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                disabled={product.stock === 0}
                onClick={() => handleAction(() => addToCart.mutate({ productId: product.id, quantity: qty }))}
              >
                <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleAction(() => toggleWishlist.mutate(product.id))}
              >
                <Heart className={`h-4 w-4 ${wishlisted ? "fill-destructive text-destructive" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
