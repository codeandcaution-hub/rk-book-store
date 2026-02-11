import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// using native radio inputs here instead of the UI RadioGroup wrapper
import { toast } from "sonner";
import { addDays, format } from "date-fns";

export default function Checkout() {
  const { user, profile } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState(profile?.full_name || "");
  const [address, setAddress] = useState(profile?.address_line1 || "");
  const [city, setCity] = useState(profile?.city || "");
  const [state, setState] = useState(profile?.state || "");
  const [pincode, setPincode] = useState(profile?.pincode || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) { navigate("/auth"); return null; }
  if (cartItems.length === 0) { navigate("/cart"); return null; }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const couponsRef = collection(db, "coupons");
      const q = query(couponsRef, where("code", "==", couponCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) { 
        toast.error("Invalid coupon code"); 
        return; 
      }
      
      const data = querySnapshot.docs[0].data();
      if (data.min_order_value && cartTotal < data.min_order_value) {
        toast.error(`Minimum order value ₹${data.min_order_value} required`); 
        return;
      }
      const disc = data.discount_type === "percentage"
        ? (cartTotal * data.discount_value) / 100
        : data.discount_value;
      setDiscount(Math.min(disc, cartTotal));
      setCouponApplied(data.code);
      toast.success(`Coupon ${data.code} applied! You save ₹${Math.min(disc, cartTotal).toFixed(2)}`);
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast.error("Failed to apply coupon");
    }
  };

  const finalTotal = cartTotal - discount;

  const placeOrder = async () => {
    if (!name || !address || !city || !state || !pincode || !phone) {
      toast.error("Please fill all address fields"); return;
    }
    setLoading(true);
    try {
      const expectedDelivery = addDays(new Date(), 5);
      
      // Create order
      const orderRef = await addDoc(collection(db, "orders"), {
        user_id: user?.uid,
        subtotal: cartTotal,
        discount,
        total: finalTotal,
        coupon_code: couponApplied || null,
        shipping_name: name,
        shipping_address: address,
        shipping_city: city,
        shipping_state: state,
        shipping_pincode: pincode,
        shipping_phone: phone,
        payment_method: paymentMethod,
        expected_delivery: expectedDelivery.toISOString(),
        status: "order_placed",
        created_at: new Date().toISOString(),
      });

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: orderRef.id,
        product_id: item.product_id,
        product_name: item.product_name || "",
        product_image: item.product_image || "/placeholder.svg",
        quantity: item.quantity,
        price: item.product_price || 0,
      }));
      
      for (const orderItem of orderItems) {
        await addDoc(collection(db, "order_items"), orderItem);
      }

      await clearCart.mutateAsync();
      navigate(`/order-success?orderId=${orderRef.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error("Failed to place order: " + err.message);
      else toast.error("Failed to place order");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Address */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Shipping Address</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div className="md:col-span-2 space-y-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <div className="space-y-2"><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                <div className="space-y-2"><Label>State</Label><Input value={state} onChange={(e) => setState(e.target.value)} /></div>
                <div className="space-y-2"><Label>Pincode</Label><Input value={pincode} onChange={(e) => setPincode(e.target.value)} /></div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Payment Method</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border rounded-lg p-3">
                    <input id="cod" name="payment" type="radio" value="cod" checked={paymentMethod === "cod"} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <Label htmlFor="cod">Cash on Delivery</Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-3">
                    <input id="upi" name="payment" type="radio" value="upi" checked={paymentMethod === "upi"} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <Label htmlFor="upi">UPI (Mock)</Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-lg p-3">
                    <input id="card" name="payment" type="radio" value="card" checked={paymentMethod === "card"} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <Label htmlFor="card">Card (Mock)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="h-fit sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg">Order Summary</h3>
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate flex-1">{item.products?.name} × {item.quantity}</span>
                  <span>₹{((item.products?.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({couponApplied})</span><span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm"><span>Delivery</span><span className="text-green-600">Free</span></div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="flex-1" />
                <Button variant="outline" onClick={applyCoupon}>Apply</Button>
              </div>

              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span><span className="text-primary">₹{finalTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Expected delivery: {format(addDays(new Date(), 5), "dd MMM yyyy")}</p>
              <Button className="w-full" size="lg" onClick={placeOrder} disabled={loading}>
                {loading ? "Placing Order..." : `Place Order — ₹${finalTotal.toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
