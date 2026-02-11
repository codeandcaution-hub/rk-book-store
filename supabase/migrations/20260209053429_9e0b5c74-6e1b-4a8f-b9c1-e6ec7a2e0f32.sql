
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create order_status enum
CREATE TYPE public.order_status AS ENUM ('order_placed', 'packed', 'shipped', 'out_for_delivery', 'delivered');

-- Create discount_type enum
CREATE TYPE public.discount_type AS ENUM ('flat', 'percentage');

-- Create product_category enum
CREATE TYPE public.product_category AS ENUM ('books', 'notebooks', 'pens_pencils', 'art_supplies', 'desk_accessories', 'exam_kits');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  address_line1 TEXT DEFAULT '',
  address_line2 TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  pincode TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category public.product_category NOT NULL DEFAULT 'books',
  image_url TEXT DEFAULT '/placeholder.svg',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  rating NUMERIC(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cart items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Wishlist items table
CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type public.discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_value NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupon expiry validation trigger (instead of CHECK constraint)
CREATE OR REPLACE FUNCTION public.validate_coupon_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true AND NEW.updated_at < now() - interval '365 days' THEN
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add expires_at column
ALTER TABLE public.coupons ADD COLUMN expires_at TIMESTAMPTZ;

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status public.order_status NOT NULL DEFAULT 'order_placed',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  shipping_name TEXT NOT NULL DEFAULT '',
  shipping_address TEXT NOT NULL DEFAULT '',
  shipping_city TEXT NOT NULL DEFAULT '',
  shipping_state TEXT NOT NULL DEFAULT '',
  shipping_pincode TEXT NOT NULL DEFAULT '',
  shipping_phone TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  expected_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT DEFAULT '/placeholder.svg',
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security definer function for role checking (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ RLS POLICIES ============

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Products RLS (public read)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Cart items RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Wishlist items RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wishlist" ON public.wishlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own wishlist" ON public.wishlist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own wishlist" ON public.wishlist_items FOR DELETE USING (auth.uid() = user_id);

-- Coupons RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view active coupons" ON public.coupons FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Admins can view all coupons" ON public.coupons FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Orders RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Order items RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins view all order items" ON public.order_items FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Seed sample products
INSERT INTO public.products (name, description, price, category, stock, rating, is_featured, image_url) VALUES
('The Great Gatsby', 'Classic American novel by F. Scott Fitzgerald. A story of wealth, love, and the American Dream.', 299.00, 'books', 50, 4.5, true, '/placeholder.svg'),
('To Kill a Mockingbird', 'Harper Lee''s Pulitzer Prize-winning masterwork of honor and injustice.', 349.00, 'books', 35, 4.8, true, '/placeholder.svg'),
('Spiral Notebook A4', 'Premium quality 200-page ruled spiral notebook. Perfect for students.', 120.00, 'notebooks', 100, 4.2, false, '/placeholder.svg'),
('Classmate Long Book', '172 pages single-line long book for everyday use.', 45.00, 'notebooks', 200, 4.0, true, '/placeholder.svg'),
('Parker Jotter Pen', 'Iconic stainless steel ballpoint pen with blue ink.', 450.00, 'pens_pencils', 75, 4.6, true, '/placeholder.svg'),
('Faber-Castell Pencil Set', 'Set of 12 graphite pencils (2H to 8B) for sketching and writing.', 250.00, 'pens_pencils', 60, 4.4, false, '/placeholder.svg'),
('Camlin Watercolor Set', '18-shade watercolor cakes with brush. Ideal for beginners.', 180.00, 'art_supplies', 40, 4.3, true, '/placeholder.svg'),
('Acrylic Paint Set', '12 vibrant colors acrylic paint tubes for canvas painting.', 550.00, 'art_supplies', 30, 4.5, false, '/placeholder.svg'),
('Wooden Desk Organizer', 'Multi-compartment wooden organizer for pens, clips, and stationery.', 699.00, 'desk_accessories', 25, 4.7, true, '/placeholder.svg'),
('Metal Bookends', 'Sturdy decorative metal bookends. Keeps books upright on any shelf.', 399.00, 'desk_accessories', 45, 4.1, false, '/placeholder.svg'),
('Complete Exam Kit', 'All-in-one exam kit: pens, pencils, eraser, sharpener, scale, and geometry box.', 350.00, 'exam_kits', 80, 4.6, true, '/placeholder.svg'),
('Geometry Box Deluxe', 'Premium geometry instrument set with compass, protractor, and divider.', 220.00, 'exam_kits', 55, 4.3, false, '/placeholder.svg'),
('Harry Potter Box Set', 'Complete 7-book Harry Potter series paperback box set.', 2499.00, 'books', 20, 4.9, true, '/placeholder.svg'),
('Sticky Notes Pack', '5 pads of 100 colorful sticky notes for reminders and bookmarking.', 99.00, 'desk_accessories', 150, 4.0, false, '/placeholder.svg'),
('Sketch Pad A3', 'Large A3 sketch pad with 50 thick pages for drawing and painting.', 199.00, 'art_supplies', 65, 4.2, false, '/placeholder.svg');

-- Seed sample coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, is_active, expires_at) VALUES
('RR10', 'percentage', 10, 500, true, now() + interval '90 days'),
('STUDY20', 'percentage', 20, 1000, true, now() + interval '60 days'),
('FLAT50', 'flat', 50, 300, true, now() + interval '30 days'),
('WELCOME100', 'flat', 100, 500, true, now() + interval '180 days');
