import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

const categoryLabels: Record<string, string> = {
  books: "Books",
  notebooks: "Notebooks",
  pens_pencils: "Pens & Pencils",
  art_supplies: "Art Supplies",
  desk_accessories: "Desk Accessories",
  exam_kits: "Exam Kits",
};

export default function ProductCard({ product }: { product: Tables<"products"> }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const wishlisted = isInWishlist(product.id);

  const handleAction = (action: () => void) => {
    if (!user) { navigate("/auth"); return; }
    action();
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      <Link to={`/products/${product.id}`} className="block relative aspect-square bg-muted/30 overflow-hidden">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {product.stock === 0 && (
          <Badge variant="destructive" className="absolute top-2 left-2">Out of Stock</Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-card/80 backdrop-blur-sm hover:bg-card"
          onClick={(e) => { e.preventDefault(); handleAction(() => toggleWishlist.mutate(product.id)); }}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-destructive text-destructive" : ""}`} />
        </Button>
      </Link>
      <CardContent className="p-4">
        <Badge variant="secondary" className="text-xs mb-2">{categoryLabels[product.category] || product.category}</Badge>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors mb-1">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
          <span className="text-xs text-muted-foreground">{product.rating ?? 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">₹{product.price}</span>
          <Button
            size="sm"
            disabled={product.stock === 0}
            onClick={() => handleAction(() => addToCart.mutate({ productId: product.id }))}
          >
            <ShoppingCart className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
