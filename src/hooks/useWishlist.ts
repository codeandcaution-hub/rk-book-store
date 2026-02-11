import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      try {
        const wishlistRef = collection(db, "wishlist_items");
        const q = query(wishlistRef, where("user_id", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Record<string, unknown>[];
        return items;
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const toggleWishlist = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Login required");
      const existing = wishlistItems.find((i) => i.product_id === productId);
      if (existing) {
        await deleteDoc(doc(db, "wishlist_items", existing.id));
      } else {
        await addDoc(collection(db, "wishlist_items"), {
          user_id: user.uid,
          product_id: productId,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (itemId: string) => {
      await deleteDoc(doc(db, "wishlist_items", itemId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
  });

  const isInWishlist = (productId: string) => wishlistItems.some((i) => i.product_id === productId);
  const wishlistCount = wishlistItems.length;

  return { wishlistItems, isLoading, toggleWishlist, removeFromWishlist, isInWishlist, wishlistCount };
}
