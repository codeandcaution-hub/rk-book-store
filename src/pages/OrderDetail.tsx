import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Circle, Package, Truck, MapPin, Home } from "lucide-react";
import { format } from "date-fns";

const steps = [
  { key: "order_placed", label: "Order Placed", icon: Package },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: order } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const docSnap = await getDoc(doc(db, "orders", id));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
      } catch (error) {
        console.error("Error fetching order:", error);
        return null;
      }
    },
    enabled: !!id && !!user,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const itemsRef = collection(db, "order_items");
        const q = query(itemsRef, where("order_id", "==", id));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error("Error fetching order items:", error);
        return [];
      }
    },
    enabled: !!id && !!user,
  });

  if (!order) return <Layout><div className="container mx-auto px-4 py-20 text-center">Loading...</div></Layout>;

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4" asChild><Link to="/orders"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders</Link></Button>
        <h1 className="text-2xl font-bold mb-6">Order #{order.id.slice(0, 8)}</h1>

        {/* Status tracker */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
              <div className="absolute top-5 left-0 h-0.5 bg-primary transition-all" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} />
              {steps.map((step, i) => {
                const done = i <= currentStepIndex;
                const Icon = done ? CheckCircle : Circle;
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <Icon className={`h-10 w-10 ${done ? "text-primary fill-primary/20" : "text-muted-foreground"}`} />
                    <span className={`text-xs mt-2 font-medium ${done ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
            {order.expected_delivery && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Expected delivery: {format(new Date(order.expected_delivery), "dd MMM yyyy")}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Items */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <img src={item.product_image || "/placeholder.svg"} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <span className="font-medium text-sm">₹{(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({order.coupon_code})</span><span>-₹{order.discount}</span></div>
              )}
              <div className="flex justify-between border-t pt-3 font-bold text-base"><span>Total</span><span className="text-primary">₹{order.total}</span></div>
              <div className="border-t pt-3 space-y-1">
                <p className="font-semibold">Shipping To:</p>
                <p>{order.shipping_name}</p>
                <p className="text-muted-foreground">{order.shipping_address}, {order.shipping_city}</p>
                <p className="text-muted-foreground">{order.shipping_state} - {order.shipping_pincode}</p>
                <p className="text-muted-foreground">Phone: {order.shipping_phone}</p>
              </div>
              <Badge variant="secondary">Payment: {order.payment_method.toUpperCase()}</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
