import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Product } from "./useProducts";

export type CartItem = {
  id: string;
  user_id?: string;
  product_id?: string;
  quantity?: number;
  product_price?: number;
  // optional embedded product data (if stored/denormalized in cart item)
  products?: Product | null;
  [key: string]: unknown;
};

export function useCart() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["cart", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      try {
        const cartRef = collection(db, "cart_items");
        const q = query(cartRef, where("user_id", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Record<string, unknown>),
        })) as CartItem[];
        return items;
      } catch (error) {
        console.error("Error fetching cart:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const addToCart = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!user) throw new Error("Login required");
      const existing = cartItems.find((i) => i.product_id === productId);
      if (existing) {
        await updateDoc(doc(db, "cart_items", existing.id), {
          quantity: existing.quantity + quantity,
        });
      } else {
        await addDoc(collection(db, "cart_items"), {
          user_id: user.uid,
          product_id: productId,
          quantity,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart!");
    },
    onError: (e: unknown) => {
      if (e instanceof Error) toast.error(e.message);
      else toast.error(String(e));
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        await deleteDoc(doc(db, "cart_items", itemId));
      } else {
        await updateDoc(doc(db, "cart_items", itemId), { quantity });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeFromCart = useMutation({
    mutationFn: async (itemId: string) => {
      await deleteDoc(doc(db, "cart_items", itemId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Removed from cart");
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const cartRef = collection(db, "cart_items");
      const q = query(cartRef, where("user_id", "==", user.uid));
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(doc(db, "cart_items", docSnap.id));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const cartCount = cartItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + (i.product_price || 0) * (i.quantity || 0), 0);

  // expose simple loading flags to callers to avoid touching mutation internals
  const updateQuantityIsLoading = (updateQuantity as unknown as { isLoading?: boolean }).isLoading ?? false;
  const removeFromCartIsLoading = (removeFromCart as unknown as { isLoading?: boolean }).isLoading ?? false;

  return {
    cartItems,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
    updateQuantityIsLoading,
    removeFromCartIsLoading,
  };
}
