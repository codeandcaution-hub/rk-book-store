import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Order Placed Successfully!</h1>
            <p className="text-muted-foreground">Thank you for your purchase. Your order has been confirmed.</p>
            {orderId && <p className="text-xs text-muted-foreground">Order ID: {orderId.slice(0, 8)}...</p>}
            <div className="flex gap-3 justify-center pt-4">
              <Button asChild><Link to={orderId ? `/orders/${orderId}` : "/orders"}>Track Order</Link></Button>
              <Button variant="outline" asChild><Link to="/products">Continue Shopping</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
