import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  order_placed: "bg-blue-100 text-blue-700",
  packed: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
};
const statusLabels: Record<string, string> = {
  order_placed: "Order Placed", packed: "Packed", shipped: "Shipped",
  out_for_delivery: "Out for Delivery", delivered: "Delivered",
};

export default function Orders() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("user_id", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Record<string, unknown>[];
        return data.sort((a, b) => {
          const timeA = new Date((a.created_at as string) || 0).getTime();
          const timeB = new Date((b.created_at as string) || 0).getTime();
          return timeB - timeA;
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  if (!user) return (
    <Layout>
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to view orders</h2>
        <Button asChild><Link to="/auth">Sign In</Link></Button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        {isLoading ? <p>Loading...</p> : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <Button asChild className="mt-4"><Link to="/products">Start Shopping</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow mb-4">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                      <span className="font-bold text-primary">₹{order.total}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
