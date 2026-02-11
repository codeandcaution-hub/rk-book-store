import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { user } = useAuth();
  const {
    cartItems = [],
    isLoading,
    updateQuantity,
    removeFromCart,
    cartTotal = 0,
    updateQuantityIsLoading,
    removeFromCartIsLoading,
  } = useCart();

  const navigate = useNavigate();

  /* -------------------- Not Logged In -------------------- */
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is waiting</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to view your cart
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  /* -------------------- Helpers -------------------- */
  const totalItems = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

        {/* -------------------- Loading -------------------- */}
        {isLoading ? (
          <p className="text-muted-foreground">Loading your cart...</p>
        ) : cartItems.length === 0 ? (
          /* -------------------- Empty Cart -------------------- */
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Your cart is empty
            </h2>
            <Button asChild className="mt-4">
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          /* -------------------- Cart Items -------------------- */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const quantity = Number(item.quantity || 1);
                const product = item.products;

                return (
                  <Card key={String(item.id)}>
                    <CardContent className="p-4 flex gap-4">
                      <img
                        src={product?.image_url || "/placeholder.svg"}
                        alt={product?.name || "Product"}
                        className="w-20 h-20 object-cover rounded"
                      />

                      <div className="flex-1">
                        <Link
                          to={`/products/${item.product_id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {product?.name || "Unknown Product"}
                        </Link>

                        <p className="text-primary font-bold mt-1">
                          ₹{product?.price ?? 0}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          {/* Minus */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={quantity <= 1 || updateQuantityIsLoading}
                            onClick={() =>
                              updateQuantity.mutate({
                                itemId: item.id,
                                quantity: quantity - 1,
                              })
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>

                          <span className="w-8 text-center font-medium">
                            {quantity}
                          </span>

                          {/* Plus */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={updateQuantityIsLoading}
                            onClick={() =>
                              updateQuantity.mutate({
                                itemId: item.id,
                                quantity: quantity + 1,
                              })
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>

                          {/* Remove */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-auto text-destructive"
                            disabled={removeFromCartIsLoading}
                            onClick={() =>
                              removeFromCart.mutate(item.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* -------------------- Order Summary -------------------- */}
            <Card className="h-fit sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg">Order Summary</h3>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({totalItems} items)
                  </span>
                  <span className="font-medium">
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-green-600">
                    Free
                  </span>
                </div>

                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
