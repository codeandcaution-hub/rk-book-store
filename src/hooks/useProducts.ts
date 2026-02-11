import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  QueryConstraint,
} from "firebase/firestore";

type ProductCategory = "books" | "notebooks" | "pens_pencils" | "art_supplies" | "desk_accessories" | "exam_kits";

export type Product = {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  category?: ProductCategory;
  image_url?: string;
  stock?: number;
  rating?: number;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string;
};

export function useProducts(filters?: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}) {
  return useQuery<Product[]>({
    queryKey: ["products", filters],
    queryFn: async () => {
      try {
        const constraints: QueryConstraint[] = [];
        
        if (filters?.category) {
          constraints.push(where("category", "==", filters.category));
        }
        if (filters?.minPrice) {
          constraints.push(where("price", ">=", filters.minPrice));
        }
        if (filters?.maxPrice) {
          constraints.push(where("price", "<=", filters.maxPrice));
        }
        if (filters?.minRating) {
          constraints.push(where("rating", ">=", filters.minRating));
        }

        const productsRef = collection(db, "products");
        const q = query(productsRef, ...constraints);
        const querySnapshot = await getDocs(q);
        
        let products = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Product),
        })) as Product[];

        // Client-side filtering for search (Firebase doesn't support partial text search easily)
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          products = products.filter(
            (p) => {
              const name = (p.name as string | undefined)?.toLowerCase() || "";
              const desc = (p.description as string | undefined)?.toLowerCase() || "";
              return name.includes(searchLower) || desc.includes(searchLower);
            }
          );
        }

        return products;
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      try {
        const docSnap = await getDoc(doc(db, "products", id));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
      } catch (error) {
        console.error("Error fetching product:", error);
        return null;
      }
    },
    enabled: !!id,
  });
}
