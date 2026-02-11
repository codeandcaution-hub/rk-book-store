import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Notebook,
  Pen,
  Palette,
  Lamp,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { useProducts, type Product } from "@/hooks/useProducts";

/* -------------------- Categories -------------------- */
const categories = [
  {
    label: "Books",
    value: "books",
    icon: BookOpen,
    color: "bg-orange-100 text-orange-600",
  },
  {
    label: "Notebooks",
    value: "notebooks",
    icon: Notebook,
    color: "bg-blue-100 text-blue-600",
  },
  {
    label: "Pens & Pencils",
    value: "pens_pencils",
    icon: Pen,
    color: "bg-green-100 text-green-600",
  },
  {
    label: "Art Supplies",
    value: "art_supplies",
    icon: Palette,
    color: "bg-purple-100 text-purple-600",
  },
  {
    label: "Desk Accessories",
    value: "desk_accessories",
    icon: Lamp,
    color: "bg-amber-100 text-amber-600",
  },
  {
    label: "Exam Kits",
    value: "exam_kits",
    icon: GraduationCap,
    color: "bg-red-100 text-red-600",
  },
];

export default function Index() {
  const { data = [] } = useProducts();

  const featuredProducts = data
    .filter((product: Product) => product?.is_featured)
    .slice(0, 8);

  return (
    <Layout>
      {/* -------------------- Hero Section -------------------- */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Welcome to <span className="text-primary">RR Book Store</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Your one-stop destination for books, stationery, art supplies, and
            everything you need to learn, create, and succeed.
          </p>

          <div className="flex gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/products">
                Shop Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button size="lg" variant="outline" asChild>
              <Link to="/products?category=books">Browse Books</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* -------------------- Categories -------------------- */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;

            return (
              <Link key={cat.value} to={`/products?category=${cat.value}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md group">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${cat.color} transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="text-sm font-medium">{cat.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* -------------------- Featured Products -------------------- */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>

            <Button variant="link" asChild>
              <Link to="/products">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product: Product) => (
              <ProductCard
                key={String(product.id)}
                product={product}
              />
            ))}
          </div>
        </section>
      )}

      {/* -------------------- Offer Banner -------------------- */}
      <section className="container mx-auto px-4 py-12">
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              🎁 Use Code <span className="underline">STUDY20</span> for 20% Off!
            </h2>

            <p className="text-primary-foreground/80 mb-4">
              On orders above ₹1,000. Limited time offer.
            </p>

            <Button variant="secondary" size="lg" asChild>
              <Link to="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
