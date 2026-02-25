-- ============================================================
-- Migration 003: Add bilingual columns to blog_posts & tutorials
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. BLOG POSTS — add Arabic columns
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS title_ar    TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS content_ar  TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS excerpt_ar  TEXT;

-- ────────────────────────────────────────────────────────────
-- 2. TUTORIALS TABLE — create if missing, add Arabic columns
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tutorials (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  title_ar       TEXT,
  description    TEXT,
  description_ar TEXT,
  youtube_url    TEXT NOT NULL,
  thumbnail_url  TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_published   BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If the table already existed without AR columns, add them:
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS title_ar       TEXT;
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS description_ar TEXT;

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 3. TUTORIALS — RLS POLICIES (idempotent: drop then create)
-- ────────────────────────────────────────────────────────────

-- Public: anyone can read PUBLISHED tutorials
DROP POLICY IF EXISTS "tutorials_select_published" ON public.tutorials;
CREATE POLICY "tutorials_select_published"
  ON public.tutorials FOR SELECT
  USING (is_published = true);

-- Admins can read ALL tutorials (including unpublished)
DROP POLICY IF EXISTS "tutorials_select_admin" ON public.tutorials;
CREATE POLICY "tutorials_select_admin"
  ON public.tutorials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert
DROP POLICY IF EXISTS "tutorials_insert_admin" ON public.tutorials;
CREATE POLICY "tutorials_insert_admin"
  ON public.tutorials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update
DROP POLICY IF EXISTS "tutorials_update_admin" ON public.tutorials;
CREATE POLICY "tutorials_update_admin"
  ON public.tutorials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete
DROP POLICY IF EXISTS "tutorials_delete_admin" ON public.tutorials;
CREATE POLICY "tutorials_delete_admin"
  ON public.tutorials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- 4. TIMESTAMP TRIGGER for tutorials (reuse existing fn)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tutorials_updated_at ON public.tutorials;
CREATE TRIGGER tutorials_updated_at
  BEFORE UPDATE ON public.tutorials
  FOR EACH ROW EXECUTE FUNCTION public.hc_update_timestamp();

-- Ensure blog_posts also has the trigger (idempotent)
DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.hc_update_timestamp();

-- ────────────────────────────────────────────────────────────
-- 5. ENABLE REALTIME (optional — for Supabase Realtime)
--    Uncomment if you want live subscriptions:
-- ────────────────────────────────────────────────────────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tutorials;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.hc_categories;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.hc_sections;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.hc_articles;

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
