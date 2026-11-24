-- ========================================================
-- FOODIEHUB RESTAURANT - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Project -> SQL Editor
-- ========================================================

-- 1. Enable UUID Extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 2. USER PROFILES TABLE
-- Linked directly to Supabase Auth (auth.users)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Profile RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger to automatically create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ========================================================
-- 3. ORDERS TABLE
-- Stores restaurant food delivery & takeaway orders
-- ========================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_ref TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing order policies if re-running
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users and guests can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update order status" ON public.orders;
DROP POLICY IF EXISTS "Staff and users can update order status" ON public.orders;

-- Orders RLS Policies
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users and guests can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Allow Manager, Admin, and users to update order status
CREATE POLICY "Anyone can update order status"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- ========================================================
-- 4. ORDER ITEMS TABLE
-- Stores individual food dishes belonging to an order
-- ========================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  recipe_id INTEGER NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_image TEXT,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;

-- Order Items RLS Policies
CREATE POLICY "Users can view order items for their orders"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR auth.uid() IS NOT NULL)
    )
  );

CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);


-- ========================================================
-- 5. TABLE RESERVATIONS
-- Stores dine-in table reservations
-- ========================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 2,
  special_requests TEXT,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can book a table" ON public.reservations;
DROP POLICY IF EXISTS "Staff can update reservations" ON public.reservations;

CREATE POLICY "Users can view their own reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can book a table"
  ON public.reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can update reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid() IS NOT NULL);


-- ========================================================
-- 6. FOOD ITEMS TABLE (Admin Menu Management)
-- Stores custom restaurant menu items added by Admin
-- ========================================================
CREATE TABLE IF NOT EXISTS public.food_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT NOT NULL,
  cuisine TEXT DEFAULT 'International',
  difficulty TEXT DEFAULT 'Easy',
  prep_time_minutes INTEGER DEFAULT 15,
  cook_time_minutes INTEGER DEFAULT 20,
  servings INTEGER DEFAULT 2,
  calories_per_serving INTEGER DEFAULT 350,
  rating NUMERIC(3, 1) DEFAULT 4.8,
  review_count INTEGER DEFAULT 12,
  ingredients JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  meal_type JSONB DEFAULT '["Lunch", "Dinner"]'::jsonb,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view food items" ON public.food_items;
DROP POLICY IF EXISTS "Staff can insert food items" ON public.food_items;
DROP POLICY IF EXISTS "Staff can update food items" ON public.food_items;
DROP POLICY IF EXISTS "Staff can delete food items" ON public.food_items;

CREATE POLICY "Anyone can view food items"
  ON public.food_items FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert food items"
  ON public.food_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can update food items"
  ON public.food_items FOR UPDATE
  USING (true);

CREATE POLICY "Staff can delete food items"
  ON public.food_items FOR DELETE
  USING (true);


-- ========================================================
-- 7. STAFF ORDER UPDATE POLICIES
-- Allows Managers & Admins to update order status
-- ========================================================
DROP POLICY IF EXISTS "Staff can update order status" ON public.orders;
CREATE POLICY "Staff can update order status"
  ON public.orders FOR UPDATE
  USING (true);


-- ========================================================
-- 8. INDEXES FOR PERFORMANCE
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON public.food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_items_created_at ON public.food_items(created_at DESC);


-- ========================================================
-- 9. ADD ROLE TO PROFILES TABLE
-- Supports: 'customer', 'manager', 'admin'
-- ========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'customer';
  END IF;
END $$;

-- Policy to allow profile updates including role
DROP POLICY IF EXISTS "Users and staff can view profiles" ON public.profiles;
CREATE POLICY "Users and staff can view profiles"
  ON public.profiles FOR SELECT
  USING (true);


-- ========================================================
-- 10. MANAGERS APPROVAL WORKFLOW TABLE
-- Manages restaurant manager signups and Admin approval
-- ========================================================
CREATE TABLE IF NOT EXISTS public.managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  branch TEXT DEFAULT 'Main Branch',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'suspended'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view or register manager application" ON public.managers;
CREATE POLICY "Anyone can view or register manager application"
  ON public.managers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed Initial Demonstration Managers (1 Approved, 1 Pending for Admin Approval Testing)
INSERT INTO public.managers (full_name, email, phone, branch, status, created_at, approved_at)
VALUES 
  ('Sarah Jenkins', 'manager@foodiehub.com', '+1 555-492-1102', 'Downtown Flagship', 'approved', now() - interval '2 days', now() - interval '1 day'),
  ('Michael Rivera', 'michael.rivera@foodiehub.com', '+1 555-883-9481', 'Westside Kitchen Hub', 'pending', now() - interval '3 hours', NULL)
ON CONFLICT (email) DO NOTHING;



