-- ════════════════════════════════════════════════════════════════════════════
-- SCHEMA ADDITIONS for Help Center Migration
-- Adds: hc_groups table, extra columns on hc_articles
-- Safe to re-run — uses IF NOT EXISTS / IF EXISTS guards.
-- Run AFTER supabase_all_tables_rls.sql
-- ════════════════════════════════════════════════════════════════════════════


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  HC_GROUPS — article grouping within a section                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.hc_groups (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id     uuid NOT NULL REFERENCES public.hc_sections(id) ON DELETE CASCADE,
  slug           text NOT NULL,
  title          text NOT NULL,
  title_ar       text,
  description    text NOT NULL DEFAULT '',
  description_ar text,
  sort_order     integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, slug)
);

ALTER TABLE public.hc_groups ENABLE ROW LEVEL SECURITY;

-- Public: anyone can SELECT active groups
DROP POLICY IF EXISTS "Public can view active groups" ON public.hc_groups;
CREATE POLICY "Public can view active groups"
  ON public.hc_groups FOR SELECT
  USING (is_active = true);

-- Admin: full CRUD on all groups
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

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_hc_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hc_groups_updated_at ON public.hc_groups;
CREATE TRIGGER hc_groups_updated_at
  BEFORE UPDATE ON public.hc_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_hc_groups_updated_at();


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  EXTRA COLUMNS on hc_articles                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- group_id: optional FK to hc_groups (articles can belong to a group within a section)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_articles' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE public.hc_articles
      ADD COLUMN group_id uuid REFERENCES public.hc_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- is_top: marks "top/popular" articles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_articles' AND column_name = 'is_top'
  ) THEN
    ALTER TABLE public.hc_articles
      ADD COLUMN is_top boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- is_featured: marks featured articles for category pages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_articles' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.hc_articles
      ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- roles: audience targeting (e.g. ['teacher','student'])
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hc_articles' AND column_name = 'roles'
  ) THEN
    ALTER TABLE public.hc_articles
      ADD COLUMN roles text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- INDEXES for common queries
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_hc_groups_section
  ON public.hc_groups (section_id, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_hc_articles_group
  ON public.hc_articles (group_id) WHERE group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hc_articles_featured
  ON public.hc_articles (is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_hc_articles_top
  ON public.hc_articles (is_top) WHERE is_top = true;
