import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";

export default function Wishlist() {
  const { user } = useAuth();
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!user) return (
    <Layout>
      <div className="container mx-auto px-4 py-20 text-center">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your wishlist is waiting</h2>
        <Button asChild><Link to="/auth">Sign In</Link></Button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
        {isLoading ? (
          <p>Loading...</p>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <Button asChild className="mt-4"><Link to="/products">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlistItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex gap-4">
                  <img src={item.products?.image_url || "/placeholder.svg"} alt={item.products?.name} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <Link to={`/products/${item.product_id}`} className="font-semibold hover:text-primary text-sm">
                      {item.products?.name}
                    </Link>
                    <p className="text-primary font-bold mt-1">₹{item.products?.price}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => {
                        addToCart.mutate({ productId: item.product_id });
                        removeFromWishlist.mutate(item.id);
                      }}>
                        <ShoppingCart className="h-3 w-3 mr-1" /> Move to Cart
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeFromWishlist.mutate(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
