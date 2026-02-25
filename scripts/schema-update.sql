-- ════════════════════════════════════════════════════════════════════════════
-- SCHEMA UPDATE — Full migration for Help Center + Tutorials
-- Adapts the ACTUAL existing schema to what the application needs.
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS guards).
-- ════════════════════════════════════════════════════════════════════════════


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  1. HC_CATEGORIES — rename title_en→title, add missing columns         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Rename title_en → title (the app code expects "title")
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_categories' AND column_name = 'title_en'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_categories' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.hc_categories RENAME COLUMN title_en TO title;
  END IF;
END $$;

-- Rename is_active → is_published for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_categories' AND column_name = 'is_active'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_categories' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE public.hc_categories RENAME COLUMN is_active TO is_published;
  END IF;
END $$;

-- Add missing columns
ALTER TABLE public.hc_categories
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

ALTER TABLE public.hc_categories
  ADD COLUMN IF NOT EXISTS description_ar text;

ALTER TABLE public.hc_categories
  ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '';

ALTER TABLE public.hc_categories
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_hc_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hc_categories_updated_at ON public.hc_categories;
CREATE TRIGGER hc_categories_updated_at
  BEFORE UPDATE ON public.hc_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_hc_categories_updated_at();


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  2. HC_SECTIONS — create from scratch (table does not exist)           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.hc_sections (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id    uuid NOT NULL REFERENCES public.hc_categories(id) ON DELETE CASCADE,
  slug           text NOT NULL,
  title          text NOT NULL,
  title_ar       text,
  description    text NOT NULL DEFAULT '',
  description_ar text,
  icon           text,
  body_markdown  text,
  body_markdown_ar text,
  sort_order     integer NOT NULL DEFAULT 0,
  is_published   boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

ALTER TABLE public.hc_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published sections" ON public.hc_sections;
CREATE POLICY "Public can view published sections"
  ON public.hc_sections FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins have full access to sections" ON public.hc_sections;
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

CREATE OR REPLACE FUNCTION public.set_hc_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hc_sections_updated_at ON public.hc_sections;
CREATE TRIGGER hc_sections_updated_at
  BEFORE UPDATE ON public.hc_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_hc_sections_updated_at();


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  3. HC_GROUPS — optional grouping layer within sections                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.hc_groups (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id     uuid NOT NULL REFERENCES public.hc_sections(id) ON DELETE CASCADE,
  title          text NOT NULL,
  title_ar       text,
  description    text NOT NULL DEFAULT '',
  description_ar text,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, title)
);

ALTER TABLE public.hc_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view groups" ON public.hc_groups;
CREATE POLICY "Public can view groups"
  ON public.hc_groups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins have full access to groups" ON public.hc_groups;
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

CREATE OR REPLACE FUNCTION public.set_hc_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hc_groups_updated_at ON public.hc_groups;
CREATE TRIGGER hc_groups_updated_at
  BEFORE UPDATE ON public.hc_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_hc_groups_updated_at();


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  4. HC_ARTICLES — rename title_en→title, add all missing columns       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Rename title_en → title
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_articles' AND column_name = 'title_en'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_articles' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.hc_articles RENAME COLUMN title_en TO title;
  END IF;
END $$;

-- Add section_id (the proper FK — articles belong to sections, not directly to categories)
ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.hc_sections(id) ON DELETE CASCADE;

-- Add group_id (optional grouping within a section)
ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.hc_groups(id) ON DELETE SET NULL;

-- Add slug
ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS slug text;

-- Add content columns
ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS summary text;

ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS summary_ar text;

ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS body_markdown text NOT NULL DEFAULT '';

ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS body_markdown_ar text;

-- Add metadata
ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS is_top boolean NOT NULL DEFAULT false;

ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

ALTER TABLE public.hc_articles
  ADD COLUMN IF NOT EXISTS role text[];

-- Unique slug index
CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_articles_slug
  ON public.hc_articles (slug) WHERE slug IS NOT NULL;

-- Index for section queries
CREATE INDEX IF NOT EXISTS idx_hc_articles_section
  ON public.hc_articles (section_id, sort_order ASC) WHERE section_id IS NOT NULL;

-- Index for group queries
CREATE INDEX IF NOT EXISTS idx_hc_articles_group
  ON public.hc_articles (group_id, sort_order ASC) WHERE group_id IS NOT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  5. TUTORIALS — add audience + bilingual columns                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.tutorials
  ADD COLUMN IF NOT EXISTS audience text;

ALTER TABLE public.tutorials
  ADD COLUMN IF NOT EXISTS title_ar text;

ALTER TABLE public.tutorials
  ADD COLUMN IF NOT EXISTS description_ar text;

CREATE INDEX IF NOT EXISTS idx_tutorials_audience
  ON public.tutorials (audience) WHERE audience IS NOT NULL;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  6. TUTORIAL_ITEMS — child items of tutorials                          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.tutorial_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tutorial_id   uuid NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  title         text NOT NULL,
  title_ar      text,
  description   text,
  description_ar text,
  youtube_url   text,
  link          text,
  thumbnail_url text,
  resource_type text NOT NULL DEFAULT 'watch',  -- watch | download | open
  sort_order    integer NOT NULL DEFAULT 0,
  is_published  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tutorial_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published tutorial items" ON public.tutorial_items;
CREATE POLICY "Public can view published tutorial items"
  ON public.tutorial_items FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins have full access to tutorial items" ON public.tutorial_items;
CREATE POLICY "Admins have full access to tutorial items"
  ON public.tutorial_items FOR ALL
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

CREATE OR REPLACE FUNCTION public.set_tutorial_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tutorial_items_updated_at ON public.tutorial_items;
CREATE TRIGGER tutorial_items_updated_at
  BEFORE UPDATE ON public.tutorial_items
  FOR EACH ROW EXECUTE FUNCTION public.set_tutorial_items_updated_at();

CREATE INDEX IF NOT EXISTS idx_tutorial_items_published_sort
  ON public.tutorial_items (tutorial_id, is_published, sort_order ASC);


-- ════════════════════════════════════════════════════════════════════════════
-- DONE — Verify:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- ════════════════════════════════════════════════════════════════════════════
