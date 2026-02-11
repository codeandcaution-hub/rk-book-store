import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-primary" style={{ fontFamily: 'Merriweather, serif' }}>
              RR Book Store
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your one-stop shop for books, notebooks, pens, art supplies, and everything stationery.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/products" className="hover:text-primary transition-colors">All Products</Link>
            <Link to="/cart" className="hover:text-primary transition-colors">Cart</Link>
            <Link to="/wishlist" className="hover:text-primary transition-colors">Wishlist</Link>
            <Link to="/orders" className="hover:text-primary transition-colors">My Orders</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Contact</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>Email: support@rrbookstore.com</p>
            <p>Phone: +91 98765 43210</p>
            <p>Mon - Sat, 9am - 7pm IST</p>
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © 2026 RR Book Store. All rights reserved.
      </div>
    </footer>
  );
}
