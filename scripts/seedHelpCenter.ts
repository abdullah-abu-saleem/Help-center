/**
 * Seed Help Center — Migrate all static content into Supabase.
 *
 * Reads:   src/data.ts  (categories, sections, groups, articles)
 * Writes:  hc_categories, hc_sections, hc_groups, hc_articles
 *
 * Usage:
 *   npx dotenv -- npx tsx scripts/seedHelpCenter.ts
 *   # or via npm script:
 *   npm run seed:hc
 *
 * Environment variables (in .env):
 *   VITE_SUPABASE_URL          — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — service-role key (bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';
import { categories, sections, groups, articles } from '../src/data.js';

// ── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Required:');
  console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Summary counters ────────────────────────────────────────────────────────

const counts = { categories: 0, sections: 0, groups: 0, articles: 0 };

// ── 1. Categories ───────────────────────────────────────────────────────────

async function seedCategories(): Promise<Map<string, string>> {
  console.log('\n--- Categories ---');

  const rows = categories.map((c) => ({
    slug: c.slug,
    title: c.title,
    title_ar: c.title_ar ?? null,
    description: c.description ?? '',
    description_ar: c.description_ar ?? null,
    icon: c.icon || 'folder',
    sort_order: c.order,
    is_published: true,
  }));

  const { error } = await sb
    .from('hc_categories')
    .upsert(rows, { onConflict: 'slug' });

  if (error) throw new Error(`Categories upsert failed: ${error.message}`);

  // Query back to build slug → uuid map
  const { data } = await sb
    .from('hc_categories')
    .select('id, slug')
    .order('sort_order');

  const slugToUuid = new Map<string, string>();
  for (const row of data ?? []) slugToUuid.set(row.slug, row.id);

  counts.categories = rows.length;
  console.log(`  Upserted ${rows.length} categories`);
  return slugToUuid;
}

// ── 2. Sections ─────────────────────────────────────────────────────────────

async function seedSections(
  catSlugToUuid: Map<string, string>,
): Promise<Map<string, string>> {
  console.log('\n--- Sections ---');

  // Build static-category-id → slug map from the static categories array
  const staticCatIdToSlug = new Map<string, string>();
  for (const c of categories) staticCatIdToSlug.set(c.id, c.slug);

  const rows: Record<string, unknown>[] = [];
  const staticIdToSlug = new Map<string, { catSlug: string; secSlug: string }>();

  for (const sec of sections) {
    const catSlug = staticCatIdToSlug.get(sec.categoryId);
    if (!catSlug) {
      console.warn(`  Skip section "${sec.title}" — unknown categoryId "${sec.categoryId}"`);
      continue;
    }
    const catUuid = catSlugToUuid.get(catSlug);
    if (!catUuid) {
      console.warn(`  Skip section "${sec.title}" — category slug "${catSlug}" not in Supabase`);
      continue;
    }

    rows.push({
      category_id: catUuid,
      slug: sec.slug,
      title: sec.title,
      title_ar: sec.title_ar ?? null,
      description: sec.description ?? '',
      description_ar: sec.description_ar ?? null,
      icon: sec.icon || 'folder',
      sort_order: sec.order,
      is_published: true,
    });

    staticIdToSlug.set(sec.id, { catSlug, secSlug: sec.slug });
  }

  // Upsert in one batch (conflict on category_id + slug)
  if (rows.length > 0) {
    const { error } = await sb
      .from('hc_sections')
      .upsert(rows, { onConflict: 'category_id,slug' });

    if (error) throw new Error(`Sections upsert failed: ${error.message}`);
  }

  // Query back all sections to build staticSectionId → supabaseUuid map
  const { data: allSections } = await sb
    .from('hc_sections')
    .select('id, slug, category_id')
    .order('sort_order');

  // Build catUuid → catSlug reverse map
  const catUuidToSlug = new Map<string, string>();
  for (const [slug, uuid] of catSlugToUuid) catUuidToSlug.set(uuid, slug);

  // Build lookup: "catSlug/secSlug" → supabaseUuid
  const compoundToUuid = new Map<string, string>();
  for (const row of allSections ?? []) {
    const cSlug = catUuidToSlug.get(row.category_id);
    if (cSlug) compoundToUuid.set(`${cSlug}/${row.slug}`, row.id);
  }

  // Map static section IDs to Supabase UUIDs
  const staticSecIdToUuid = new Map<string, string>();
  for (const sec of sections) {
    const info = staticIdToSlug.get(sec.id);
    if (info) {
      const uuid = compoundToUuid.get(`${info.catSlug}/${info.secSlug}`);
      if (uuid) staticSecIdToUuid.set(sec.id, uuid);
    }
  }

  counts.sections = rows.length;
  console.log(`  Upserted ${rows.length} sections`);
  return staticSecIdToUuid;
}

// ── 3. Groups ───────────────────────────────────────────────────────────────

async function seedGroups(
  secMap: Map<string, string>,
): Promise<Map<string, string>> {
  console.log('\n--- Groups ---');

  const staticIdToUuid = new Map<string, string>();

  for (const grp of groups) {
    const sectionUuid = secMap.get(grp.sectionId);
    if (!sectionUuid) {
      console.warn(`  Skip group "${grp.title}" — section "${grp.sectionId}" not mapped`);
      continue;
    }

    // Check if exists by (section_id, title) — this is the UNIQUE constraint
    const { data: existing } = await sb
      .from('hc_groups')
      .select('id')
      .eq('section_id', sectionUuid)
      .eq('title', grp.title)
      .maybeSingle();

    if (existing) {
      // Update existing
      await sb
        .from('hc_groups')
        .update({
          title_ar: grp.title_ar ?? null,
          description: grp.description ?? '',
          description_ar: grp.description_ar ?? null,
          sort_order: grp.order,
        })
        .eq('id', existing.id);

      staticIdToUuid.set(grp.id, existing.id);
    } else {
      // Insert new
      const { data, error } = await sb
        .from('hc_groups')
        .insert({
          section_id: sectionUuid,
          title: grp.title,
          title_ar: grp.title_ar ?? null,
          description: grp.description ?? '',
          description_ar: grp.description_ar ?? null,
          sort_order: grp.order,
        })
        .select('id')
        .single();

      if (error) {
        console.warn(`  Failed group "${grp.title}": ${error.message}`);
        continue;
      }
      staticIdToUuid.set(grp.id, data.id);
    }
    counts.groups++;
  }

  console.log(`  Processed ${counts.groups} groups`);
  return staticIdToUuid;
}

// ── 4. Articles ─────────────────────────────────────────────────────────────

async function seedArticles(
  secMap: Map<string, string>,
  grpMap: Map<string, string>,
) {
  console.log('\n--- Articles ---');

  // Compute sort_order per section (based on position in the array)
  const sectionIndexCounter = new Map<string, number>();

  const CHUNK = 50;
  const allRows: Record<string, unknown>[] = [];

  for (const art of articles) {
    const sectionUuid = secMap.get(art.sectionId);
    if (!sectionUuid) {
      // Section might not exist — skip silently (could be teacher-only sections not yet seeded)
      continue;
    }

    const groupUuid = art.groupId ? grpMap.get(art.groupId) ?? null : null;

    // Increment sort_order per section
    const idx = sectionIndexCounter.get(art.sectionId) ?? 0;
    sectionIndexCounter.set(art.sectionId, idx + 1);

    allRows.push({
      section_id: sectionUuid,
      group_id: groupUuid,
      slug: art.slug,
      title: art.title,
      title_ar: art.title_ar ?? null,
      summary: art.summary ?? '',
      summary_ar: art.summary_ar ?? null,
      body_markdown: art.bodyMarkdown ?? '',
      body_markdown_ar: art.bodyMarkdown_ar ?? null,
      sort_order: idx,
      is_published: true,
      tags: art.tags ?? [],
      is_top: art.isTop ?? false,
      is_featured: art.isFeatured ?? false,
      role: art.role ?? null,
    });
  }

  // Upsert in chunks
  let upserted = 0;
  for (let i = 0; i < allRows.length; i += CHUNK) {
    const chunk = allRows.slice(i, i + CHUNK);
    const { error } = await sb
      .from('hc_articles')
      .upsert(chunk, { onConflict: 'slug' });

    if (error) {
      console.warn(`  Chunk ${i}-${i + chunk.length} failed: ${error.message}`);
      // Fall back to one-by-one for this chunk
      for (const row of chunk) {
        const { error: singleErr } = await sb
          .from('hc_articles')
          .upsert(row, { onConflict: 'slug' });
        if (singleErr) {
          console.warn(`  Failed article "${row.slug}": ${singleErr.message}`);
        } else {
          upserted++;
        }
      }
    } else {
      upserted += chunk.length;
    }
  }

  counts.articles = upserted;
  console.log(`  Upserted ${upserted} articles (${allRows.length - upserted} skipped/failed)`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('============================================');
  console.log('  Help Center Seed Script');
  console.log('============================================');
  console.log(`  URL: ${SUPABASE_URL}`);
  console.log(`  Key: ${SERVICE_ROLE_KEY!.slice(0, 12)}...`);
  console.log('');
  console.log(`  Source: ${categories.length} categories, ${sections.length} sections, ${groups.length} groups, ${articles.length} articles`);

  const catMap = await seedCategories();
  const secMap = await seedSections(catMap);
  const grpMap = await seedGroups(secMap);
  await seedArticles(secMap, grpMap);

  console.log('\n============================================');
  console.log('  RESULTS');
  console.log('============================================');
  console.log(`  Categories: ${counts.categories}`);
  console.log(`  Sections:   ${counts.sections}`);
  console.log(`  Groups:     ${counts.groups}`);
  console.log(`  Articles:   ${counts.articles}`);
  console.log('');
  console.log('Done. Refresh admin to see all content.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
