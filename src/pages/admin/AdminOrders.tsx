import Layout from "@/components/layout/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, updateDoc, doc, query } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

type OrderStatus = "order_placed" | "packed" | "shipped" | "out_for_delivery" | "delivered";
const statuses: { value: OrderStatus; label: string }[] = [
  { value: "order_placed", label: "Order Placed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
];
const statusColors: Record<string, string> = {
  order_placed: "bg-blue-100 text-blue-700", packed: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700", out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
};

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  shipping_name: string;
  created_at: string;
}

export default function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      try {
        const ordersRef = collection(db, "orders");
        const querySnapshot = await getDocs(ordersRef);
        const data = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Order[];
        return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      await updateDoc(doc(db, "orders", id), { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: (e: unknown) => {
      if (e instanceof Error) toast.error(e.message);
      else toast.error(String(e));
    },
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Manage Orders</h1>
        {isLoading ? <p>Loading...</p> : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{format(new Date(o.created_at), "dd MMM yy")}</TableCell>
                      <TableCell>{o.shipping_name}</TableCell>
                      <TableCell className="font-bold">₹{o.total}</TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v as OrderStatus })}>
                          <SelectTrigger className="w-44">
                            <Badge className={statusColors[o.status]}>{statuses.find((s) => s.value === o.status)?.label}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
