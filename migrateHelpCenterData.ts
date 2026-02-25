/**
 * ══════════════════════════════════════════════════════════════
 * Help Center Data Migration Script
 * ══════════════════════════════════════════════════════════════
 *
 * Migrates ALL static Help Center content from src/data.ts
 * into the Supabase database (hc_categories, hc_sections,
 * hc_groups, hc_articles).
 *
 * Prerequisites:
 *   1. Run supabase_all_tables_rls.sql first (creates base tables)
 *   2. Run migrate_schema_additions.sql (adds hc_groups + extra columns)
 *   3. Set environment variables:
 *        VITE_SUPABASE_URL=https://your-project.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=eyJ...  (NOT the anon key)
 *
 * Usage:
 *   npx tsx migrateHelpCenterData.ts
 *
 * IMPORTANT — Run order:
 *   1. Run this script BEFORE cleaning up src/data.ts
 *      (it imports the static arrays that will be removed).
 *   2. If src/data.ts has already been cleaned, restore
 *      the old version from git first:
 *        git checkout HEAD~1 -- src/data.ts
 *      Then run this script, then re-apply the cleanup.
 *
 * The script is idempotent — it checks by slug before inserting
 * and skips duplicates.
 * ══════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

// NOTE: This import assumes src/data.ts still has the old static
// arrays (categories, sections, groups, articles). If you've already
// cleaned up data.ts, restore it from git first.
import { categories, sections, groups, articles } from './src/data';

// ─── Configuration ──────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '❌ Missing environment variables.\n' +
    '   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.\n' +
    '   Example:\n' +
    '     VITE_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx migrateHelpCenterData.ts'
  );
  process.exit(1);
}

// Service role client bypasses RLS
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── ID Mappings (old static ID → new Supabase UUID) ────────

const categoryIdMap = new Map<string, string>();  // old id → uuid
const sectionIdMap  = new Map<string, string>();
const groupIdMap    = new Map<string, string>();

// ─── Helpers ────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Step 1: Migrate Categories ─────────────────────────────

async function migrateCategories() {
  console.log('\n📂 Migrating categories...');
  let inserted = 0;
  let skipped = 0;

  for (const cat of categories) {
    // Check if already exists by slug
    const { data: existing } = await supabase
      .from('hc_categories')
      .select('id')
      .eq('slug', cat.slug)
      .maybeSingle();

    if (existing) {
      categoryIdMap.set(cat.id, existing.id);
      skipped++;
      continue;
    }

    const { data, error } = await supabase
      .from('hc_categories')
      .insert({
        slug: cat.slug,
        title: cat.title,
        title_ar: (cat as any).title_ar || null,
        description: cat.description,
        description_ar: (cat as any).description_ar || null,
        icon: cat.icon,
        sort_order: cat.order,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`   ❌ Category "${cat.title}": ${error.message}`);
      continue;
    }

    categoryIdMap.set(cat.id, data.id);
    inserted++;
  }

  console.log(`   ✅ Categories: ${inserted} inserted, ${skipped} skipped (already exist)`);
}

// ─── Step 2: Migrate Sections ───────────────────────────────

async function migrateSections() {
  console.log('\n📁 Migrating sections...');
  let inserted = 0;
  let skipped = 0;

  for (const sec of sections) {
    const newCategoryId = categoryIdMap.get(sec.categoryId);
    if (!newCategoryId) {
      console.warn(`   ⚠️  Section "${sec.title}" skipped — parent category "${sec.categoryId}" not found in map`);
      continue;
    }

    // Check if already exists by (category_id, slug) composite unique
    const { data: existing } = await supabase
      .from('hc_sections')
      .select('id')
      .eq('category_id', newCategoryId)
      .eq('slug', sec.slug)
      .maybeSingle();

    if (existing) {
      sectionIdMap.set(sec.id, existing.id);
      skipped++;
      continue;
    }

    const { data, error } = await supabase
      .from('hc_sections')
      .insert({
        category_id: newCategoryId,
        slug: sec.slug,
        title: sec.title,
        title_ar: (sec as any).title_ar || null,
        description: sec.description,
        description_ar: (sec as any).description_ar || null,
        icon: sec.icon || 'folder',
        sort_order: sec.order,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`   ❌ Section "${sec.title}": ${error.message}`);
      continue;
    }

    sectionIdMap.set(sec.id, data.id);
    inserted++;
  }

  console.log(`   ✅ Sections: ${inserted} inserted, ${skipped} skipped`);
}

// ─── Step 3: Migrate Groups ────────────────────────────────

async function migrateGroups() {
  console.log('\n📦 Migrating groups...');
  let inserted = 0;
  let skipped = 0;

  for (const grp of groups) {
    const newSectionId = sectionIdMap.get(grp.sectionId);
    if (!newSectionId) {
      console.warn(`   ⚠️  Group "${grp.title}" skipped — parent section "${grp.sectionId}" not found in map`);
      continue;
    }

    const grpSlug = slugify(grp.title);

    // Check if already exists
    const { data: existing } = await supabase
      .from('hc_groups')
      .select('id')
      .eq('section_id', newSectionId)
      .eq('slug', grpSlug)
      .maybeSingle();

    if (existing) {
      groupIdMap.set(grp.id, existing.id);
      skipped++;
      continue;
    }

    const { data, error } = await supabase
      .from('hc_groups')
      .insert({
        section_id: newSectionId,
        slug: grpSlug,
        title: grp.title,
        title_ar: (grp as any).title_ar || null,
        description: grp.description || '',
        description_ar: (grp as any).description_ar || null,
        sort_order: grp.order,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`   ❌ Group "${grp.title}": ${error.message}`);
      continue;
    }

    groupIdMap.set(grp.id, data.id);
    inserted++;
  }

  console.log(`   ✅ Groups: ${inserted} inserted, ${skipped} skipped`);
}

// ─── Step 4: Migrate Articles ──────────────────────────────

async function migrateArticles() {
  console.log('\n📝 Migrating articles...');
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches for performance
  const BATCH_SIZE = 20;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const rows: any[] = [];

    for (const art of batch) {
      const newSectionId = sectionIdMap.get(art.sectionId);
      if (!newSectionId) {
        console.warn(`   ⚠️  Article "${art.title}" skipped — parent section "${art.sectionId}" not found`);
        errors++;
        continue;
      }

      // Check if already exists by slug
      const { data: existing } = await supabase
        .from('hc_articles')
        .select('id')
        .eq('slug', art.slug)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const newGroupId = art.groupId ? groupIdMap.get(art.groupId) : null;

      rows.push({
        section_id: newSectionId,
        group_id: newGroupId || null,
        slug: art.slug,
        title: art.title,
        title_ar: (art as any).title_ar || null,
        summary: art.summary,
        summary_ar: (art as any).summary_ar || null,
        body_markdown: art.bodyMarkdown,
        body_markdown_ar: (art as any).bodyMarkdown_ar || null,
        sort_order: 0,
        is_published: true,
        is_top: art.isTop || false,
        is_featured: art.isFeatured || false,
        tags: art.tags || [],
        roles: (art as any).role || [],
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from('hc_articles')
        .insert(rows);

      if (error) {
        console.error(`   ❌ Batch insert error: ${error.message}`);
        errors += rows.length;
      } else {
        inserted += rows.length;
      }
    }

    // Progress indicator
    const progress = Math.min(i + BATCH_SIZE, articles.length);
    process.stdout.write(`   Processing: ${progress}/${articles.length}\r`);
  }

  console.log(`\n   ✅ Articles: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log(' Help Center Data Migration');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Categories to migrate: ${categories.length}`);
  console.log(`Sections to migrate:   ${sections.length}`);
  console.log(`Groups to migrate:     ${groups.length}`);
  console.log(`Articles to migrate:   ${articles.length}`);

  try {
    await migrateCategories();
    await migrateSections();
    await migrateGroups();
    await migrateArticles();

    console.log('\n═══════════════════════════════════════════════════');
    console.log(' Migration complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Category ID mappings: ${categoryIdMap.size}`);
    console.log(`Section ID mappings:  ${sectionIdMap.size}`);
    console.log(`Group ID mappings:    ${groupIdMap.size}`);
  } catch (err) {
    console.error('\n💥 Migration failed:', err);
    process.exit(1);
  }
}

main();
