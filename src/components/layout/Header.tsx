import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, User, Search, BookOpen, Menu, LogOut, Package, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useState } from "react";

const categories = [
  { label: "Books", value: "books" },
  { label: "Notebooks", value: "notebooks" },
  { label: "Pens & Pencils", value: "pens_pencils" },
  { label: "Art Supplies", value: "art_supplies" },
  { label: "Desk Accessories", value: "desk_accessories" },
  { label: "Exam Kits", value: "exam_kits" },
];

export default function Header() {
  const { user, isAdmin, signOut, profile } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const NavLinks = () => (
    <>
      {categories.map((c) => (
        <Link
          key={c.value}
          to={`/products?category=${c.value}`}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
        >
          {c.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
      {/* Top bar */}
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex flex-col gap-4 mt-8">
              <Link to="/" className="flex items-center gap-2 text-primary font-bold text-lg">
                <BookOpen className="h-6 w-6" /> RR Book Store
              </Link>
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary hidden sm:inline" style={{ fontFamily: 'Merriweather, serif' }}>
            RR Book Store
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl flex">
          <Input
            placeholder="Search books, stationery..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-r-none border-r-0 focus-visible:ring-0"
          />
          <Button type="submit" className="rounded-l-none" size="default">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {wishlistCount}
                </Badge>
              )}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartCount}
                </Badge>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 text-sm font-medium truncate">{profile?.full_name || user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="mr-2 h-4 w-4" /> My Orders
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" /> Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Category bar - desktop */}
      <div className="hidden md:block bg-muted/50 border-t">
        <div className="container mx-auto px-4 flex items-center gap-6 py-1.5 overflow-x-auto">
          <Link to="/products" className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            All Products
          </Link>
          <NavLinks />
        </div>
      </div>
    </header>
  );
}
