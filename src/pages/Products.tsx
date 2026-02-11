import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const categories = [
  { label: "All Categories", value: "all" },
  { label: "Books", value: "books" },
  { label: "Notebooks", value: "notebooks" },
  { label: "Pens & Pencils", value: "pens_pencils" },
  { label: "Art Supplies", value: "art_supplies" },
  { label: "Desk Accessories", value: "desk_accessories" },
  { label: "Exam Kits", value: "exam_kits" },
];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "all");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minRating, setMinRating] = useState(0);

  const { data: products = [], isLoading } = useProducts({
    category: category !== "all" ? category : undefined,
    search: search || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
    minRating: minRating > 0 ? minRating : undefined,
  });

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setPriceRange([0, 5000]);
    setMinRating(0);
    setParams({});
  };

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold mb-2 block">Category</Label>
        <Select value={category} onValueChange={(v) => { setCategory(v); setParams(v !== "all" ? { category: v } : {}); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-sm font-semibold mb-2 block">Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}</Label>
        <Slider min={0} max={5000} step={50} value={priceRange} onValueChange={setPriceRange} className="mt-3" />
      </div>
      <div>
        <Label className="text-sm font-semibold mb-2 block">Min Rating: {minRating}★</Label>
        <Slider min={0} max={5} step={0.5} value={[minRating]} onValueChange={([v]) => setMinRating(v)} className="mt-3" />
      </div>
      <Button variant="outline" className="w-full" onClick={clearFilters}>
        <X className="h-4 w-4 mr-2" /> Clear Filters
      </Button>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent><Filters /></SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <Filters />
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-20 text-muted-foreground">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground mb-4">No products found</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">{products.length} products found</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
