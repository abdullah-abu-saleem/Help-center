-- ════════════════════════════════════════════════════════════════════════════
-- SAFE FIX: Ensure is_published column exists on all hc_* tables,
-- enable RLS, clean up broken policies, create correct public + admin policies.
--
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query).
-- 100% safe to re-run — all operations are idempotent.
-- Does NOT drop tables or delete data.
-- ════════════════════════════════════════════════════════════════════════════


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. HC_CATEGORIES                                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Ensure is_published column exists (add if missing, safe no-op if present)
ALTER TABLE public.hc_categories
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- Set any NULL values to true
UPDATE public.hc_categories SET is_published = true WHERE is_published IS NULL;

-- Enable RLS
ALTER TABLE public.hc_categories ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies (clean slate)
DROP POLICY IF EXISTS "hc_categories_select_active"           ON public.hc_categories;
DROP POLICY IF EXISTS "hc_categories_select_admin"            ON public.hc_categories;
DROP POLICY IF EXISTS "Public can view active categories"     ON public.hc_categories;
DROP POLICY IF EXISTS "Public can view published categories"  ON public.hc_categories;
DROP POLICY IF EXISTS "Admins have full access to categories" ON public.hc_categories;
DROP POLICY IF EXISTS "hc_categories_insert_admin"            ON public.hc_categories;
DROP POLICY IF EXISTS "hc_categories_update_admin"            ON public.hc_categories;
DROP POLICY IF EXISTS "hc_categories_delete_admin"            ON public.hc_categories;

-- Public: anonymous SELECT on published rows (no auth required)
CREATE POLICY "Public can view published categories"
  ON public.hc_categories FOR SELECT
  USING (is_published = true);

-- Admin: full CRUD
CREATE POLICY "Admins have full access to categories"
  ON public.hc_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. HC_SECTIONS                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.hc_sections
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

UPDATE public.hc_sections SET is_published = true WHERE is_published IS NULL;

ALTER TABLE public.hc_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hc_sections_select_active"           ON public.hc_sections;
DROP POLICY IF EXISTS "hc_sections_select_admin"            ON public.hc_sections;
DROP POLICY IF EXISTS "Public can view active sections"     ON public.hc_sections;
DROP POLICY IF EXISTS "Public can view published sections"  ON public.hc_sections;
DROP POLICY IF EXISTS "Admins have full access to sections" ON public.hc_sections;
DROP POLICY IF EXISTS "hc_sections_insert_admin"            ON public.hc_sections;
DROP POLICY IF EXISTS "hc_sections_update_admin"            ON public.hc_sections;
DROP POLICY IF EXISTS "hc_sections_delete_admin"            ON public.hc_sections;

CREATE POLICY "Public can view published sections"
  ON public.hc_sections FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins have full access to sections"
  ON public.hc_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. HC_ARTICLES                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

UPDATE public.hc_articles SET is_published = true WHERE is_published IS NOT TRUE;

ALTER TABLE public.hc_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hc_articles_select_published"         ON public.hc_articles;
DROP POLICY IF EXISTS "hc_articles_select_admin"             ON public.hc_articles;
DROP POLICY IF EXISTS "Public can view published articles"   ON public.hc_articles;
DROP POLICY IF EXISTS "Admins have full access to articles"  ON public.hc_articles;
DROP POLICY IF EXISTS "hc_articles_insert_admin"             ON public.hc_articles;
DROP POLICY IF EXISTS "hc_articles_update_admin"             ON public.hc_articles;
DROP POLICY IF EXISTS "hc_articles_delete_admin"             ON public.hc_articles;

CREATE POLICY "Public can view published articles"
  ON public.hc_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins have full access to articles"
  ON public.hc_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. HC_GROUPS                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.hc_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view groups"              ON public.hc_groups;
DROP POLICY IF EXISTS "Public can view active groups"       ON public.hc_groups;
DROP POLICY IF EXISTS "Admins have full access to groups"   ON public.hc_groups;

CREATE POLICY "Public can view groups"
  ON public.hc_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to groups"
  ON public.hc_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. HC_RESOURCE_VIDEOS                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.hc_resource_videos
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

UPDATE public.hc_resource_videos SET is_published = true WHERE is_published IS NULL;

ALTER TABLE public.hc_resource_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published resource videos"   ON public.hc_resource_videos;
DROP POLICY IF EXISTS "Admins have full access to resource videos"  ON public.hc_resource_videos;

CREATE POLICY "Public can view published resource videos"
  ON public.hc_resource_videos FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins have full access to resource videos"
  ON public.hc_resource_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- ════════════════════════════════════════════════════════════════════════════
-- TEST QUERIES — run after the script to verify everything works
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Confirm is_published exists on all tables:
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'hc_%'
  AND column_name = 'is_published'
ORDER BY table_name;

-- 2. Confirm RLS is enabled:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'hc_%';

-- 3. List all policies:
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'hc_%'
ORDER BY tablename, policyname;

-- 4. Anonymous read test (should return rows if data exists):
SELECT id, title, is_published FROM public.hc_categories WHERE is_published = true LIMIT 3;
