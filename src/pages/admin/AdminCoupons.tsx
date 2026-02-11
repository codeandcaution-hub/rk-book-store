import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/config";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

type CouponForm = { code: string; discount_type: "percentage" | "flat"; discount_value: string; min_order_value: string; expires_at: string; is_active: boolean };
const emptyForm: CouponForm = { code: "", discount_type: "percentage", discount_value: "", min_order_value: "0", expires_at: "", is_active: true };

interface Coupon extends CouponForm {
  id: string;
  created_at?: string;
}

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      try {
        const couponsRef = collection(db, "coupons");
        const querySnapshot = await getDocs(couponsRef);
        const data = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Coupon[];
        return data.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
      } catch (error) {
        console.error("Error fetching coupons:", error);
        return [];
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_value: parseFloat(form.min_order_value) || 0,
        expires_at: form.expires_at || null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        await updateDoc(doc(db, "coupons", editing.id), payload);
      } else {
        await addDoc(collection(db, "coupons"), {
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success(editing ? "Coupon updated" : "Coupon created");
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: unknown) => {
      if (e instanceof Error) toast.error(e.message);
      else toast.error(String(e));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "coupons", id));
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["admin-coupons"] }); 
      toast.success("Coupon deleted"); 
    },
  });

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value),
      min_order_value: String(c.min_order_value || 0), expires_at: c.expires_at ? String(c.expires_at).split("T")[0] : "",
      is_active: c.is_active ?? true,
    });
    setOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manage Coupons</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Coupon</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Coupon" : "Add Coupon"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Discount Type</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Discount Value</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} /></div>
                <div><Label>Min Order Value (₹)</Label><Input type="number" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: e.target.value })} /></div>
                <div><Label>Expires At</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
                <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? <p>Loading...</p> : (
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Min Order</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold">{c.code}</TableCell>
                    <TableCell>{c.discount_type}</TableCell>
                    <TableCell>{c.discount_type === "percentage" ? `${c.discount_value}%` : `₹${c.discount_value}`}</TableCell>
                    <TableCell>₹{c.min_order_value}</TableCell>
                    <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        )}
      </div>
    </Layout>
  );
}
