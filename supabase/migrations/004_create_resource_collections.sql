-- Migration: Create hc_resource_collections and hc_resource_items tables
-- Run this in your Supabase SQL editor or as a migration.

-- ═══ hc_resource_collections ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_resource_collections (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text NOT NULL,
  title       text NOT NULL,
  audience    text NOT NULL DEFAULT 'all'
              CHECK (audience IN ('teacher', 'student', 'all')),
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, audience)
);

-- Enable RLS
ALTER TABLE hc_resource_collections ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can SELECT published rows
CREATE POLICY "Public can read published resource collections"
  ON hc_resource_collections
  FOR SELECT
  USING (is_published = true);

-- Admin write: authenticated users with admin role can INSERT/UPDATE/DELETE
CREATE POLICY "Admins can manage resource collections"
  ON hc_resource_collections
  FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ═══ hc_resource_items ═════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hc_resource_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES hc_resource_collections(id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  type          text NOT NULL DEFAULT 'video',
  youtube_url   text NOT NULL DEFAULT '',
  thumbnail_url text,
  order_index   integer NOT NULL DEFAULT 0,
  is_published  boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE hc_resource_items ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can SELECT published items
CREATE POLICY "Public can read published resource items"
  ON hc_resource_items
  FOR SELECT
  USING (is_published = true);

-- Admin write
CREATE POLICY "Admins can manage resource items"
  ON hc_resource_items
  FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ═══ Indexes for performance ═══════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_resource_collections_audience
  ON hc_resource_collections (audience, is_published, order_index);

CREATE INDEX IF NOT EXISTS idx_resource_items_collection
  ON hc_resource_items (collection_id, is_published, order_index);
