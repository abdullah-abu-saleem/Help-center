-- Migration 005: Add bilingual columns to hc_videos
-- Adds title_ar and description_ar for Arabic translations of video titles/descriptions.
-- Falls back to English (title / description) when Arabic is not set.

-- Add Arabic title column (nullable — falls back to English `title`)
ALTER TABLE hc_videos
  ADD COLUMN IF NOT EXISTS title_ar       TEXT,
  ADD COLUMN IF NOT EXISTS description    TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Back-fill: ensure every row has a non-null description
UPDATE hc_videos SET description = '' WHERE description IS NULL;
