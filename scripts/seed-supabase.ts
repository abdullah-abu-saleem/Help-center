/**
 * Seed Supabase — Migrate all hardcoded content to the database.
 *
 * Reads from:
 *   - src/data.ts   (categories, sections, groups, articles)
 *   - src/resourcesData.ts (tutorial sections + resources)
 *
 * Inserts into:
 *   - hc_categories, hc_sections, hc_groups, hc_articles
 *   - tutorials, tutorial_items
 *
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/seed-supabase.ts          # Preview only
 *   npx tsx scripts/seed-supabase.ts                     # Actually insert
 *
 * Environment variables (required):
 *   VITE_SUPABASE_URL         — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
 *
 * Or provide them inline:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/seed-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { categories, sections, groups, articles } from '../src/data';
import { sectionsMeta, resources } from '../src/resourcesData';
console.log('DEBUG sizes:', {
  categories: categories?.length,
  sections: sections?.length,
  groups: groups?.length,
  articles: articles?.length,
  resources: resources?.length,
  sectionsMeta: sectionsMeta?.length,
});
// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing env vars. Required:');
  console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`  ${msg}`); }
function warn(msg: string) { console.warn(`  ⚠ ${msg}`); }

const counts = {
  categories: { inserted: 0, skipped: 0 },
  sections: { inserted: 0, skipped: 0 },
  groups: { inserted: 0, skipped: 0 },
  articles: { inserted: 0, skipped: 0 },
  tutorials: { inserted: 0, skipped: 0 },
  tutorialItems: { inserted: 0, skipped: 0 },
};

// ── 1. Seed Categories ───────────────────────────────────────────────────────

async function seedCategories(): Promise<Map<string, string>> {
  console.log('\n📁 Seeding categories…');
  const oldIdToUuid = new Map<string, string>();

  for (const cat of categories) {
    // Check if already exists by slug
    const { data: existing } = await supabase
      .from('hc_categories')
      .select('id')
      .eq('slug', cat.slug)
      .maybeSingle();

    if (existing) {
      oldIdToUuid.set(cat.id, existing.id);
      counts.categories.skipped++;
      continue;
    }

    if (DRY_RUN) {
      log(`[DRY] Would insert category: ${cat.title} (${cat.slug})`);
      counts.categories.inserted++;
      continue;
    }

    const { data, error } = await supabase
      .from('hc_categories')
      .insert({
        slug: cat.slug,
        title: cat.title,
        title_ar: cat.title_ar || null,
        description: cat.description,
        description_ar: cat.description_ar || null,
        icon: cat.icon || 'folder',
        sort_order: cat.order,
        is_published: true,
      })
      .select('id')
      .single();

    if (error) {
      warn(`Failed to insert category "${cat.title}": ${error.message}`);
      continue;
    }

    oldIdToUuid.set(cat.id, data.id);
    counts.categories.inserted++;
    log(`✓ ${cat.title}`);
  }

  return oldIdToUuid;
}

// ── 2. Seed Sections ─────────────────────────────────────────────────────────

async function seedSections(catMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\n📂 Seeding sections…');
  const oldIdToUuid = new Map<string, string>();

  for (const sec of sections) {
    const categoryUuid = catMap.get(sec.categoryId);
    if (!categoryUuid && !DRY_RUN) {
      warn(`Category "${sec.categoryId}" not found for section "${sec.title}" — skipping.`);
      continue;
    }

    // Check if already exists
    if (!DRY_RUN && categoryUuid) {
      const { data: existing } = await supabase
        .from('hc_sections')
        .select('id')
        .eq('category_id', categoryUuid)
        .eq('slug', sec.slug)
        .maybeSingle();

      if (existing) {
        oldIdToUuid.set(sec.id, existing.id);
        counts.sections.skipped++;
        continue;
      }
    }

    if (DRY_RUN) {
      log(`[DRY] Would insert section: ${sec.title} (${sec.slug}) → cat ${sec.categoryId}`);
      counts.sections.inserted++;
      continue;
    }

    const { data, error } = await supabase
      .from('hc_sections')
      .insert({
        category_id: categoryUuid,
        slug: sec.slug,
        title: sec.title,
        title_ar: sec.title_ar || null,
        description: sec.description,
        description_ar: sec.description_ar || null,
        icon: sec.icon || 'folder',
        sort_order: sec.order,
        is_published: true,
      })
      .select('id')
      .single();

    if (error) {
      warn(`Failed to insert section "${sec.title}": ${error.message}`);
      continue;
    }

    oldIdToUuid.set(sec.id, data.id);
    counts.sections.inserted++;
    log(`✓ ${sec.title}`);
  }

  return oldIdToUuid;
}

// ── 3. Seed Groups ───────────────────────────────────────────────────────────

async function seedGroups(secMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\n📎 Seeding groups…');
  const oldIdToUuid = new Map<string, string>();

  for (const grp of groups) {
    const sectionUuid = secMap.get(grp.sectionId);
    if (!sectionUuid && !DRY_RUN) {
      warn(`Section "${grp.sectionId}" not found for group "${grp.title}" — skipping.`);
      continue;
    }

    if (!DRY_RUN && sectionUuid) {
      const { data: existing } = await supabase
        .from('hc_groups')
        .select('id')
        .eq('section_id', sectionUuid)
        .eq('title', grp.title)
        .maybeSingle();

      if (existing) {
        oldIdToUuid.set(grp.id, existing.id);
        counts.groups.skipped++;
        continue;
      }
    }

    if (DRY_RUN) {
      log(`[DRY] Would insert group: ${grp.title} → section ${grp.sectionId}`);
      counts.groups.inserted++;
      continue;
    }

    const { data, error } = await supabase
      .from('hc_groups')
      .insert({
        section_id: sectionUuid,
        title: grp.title,
        title_ar: grp.title_ar || null,
        description: grp.description || '',
        description_ar: grp.description_ar || null,
        sort_order: grp.order,
      })
      .select('id')
      .single();

    if (error) {
      warn(`Failed to insert group "${grp.title}": ${error.message}`);
      continue;
    }

    oldIdToUuid.set(grp.id, data.id);
    counts.groups.inserted++;
    log(`✓ ${grp.title}`);
  }

  return oldIdToUuid;
}

// ── 4. Seed Articles ─────────────────────────────────────────────────────────

async function seedArticles(
  secMap: Map<string, string>,
  grpMap: Map<string, string>,
) {
  console.log('\n📝 Seeding articles…');

  for (const art of articles) {
    const sectionUuid = secMap.get(art.sectionId);
    if (!sectionUuid && !DRY_RUN) {
      warn(`Section "${art.sectionId}" not found for article "${art.title}" — skipping.`);
      continue;
    }

    const groupUuid = art.groupId ? grpMap.get(art.groupId) || null : null;

    // Check if already exists by slug
    if (!DRY_RUN) {
      const { data: existing } = await supabase
        .from('hc_articles')
        .select('id')
        .eq('slug', art.slug)
        .maybeSingle();

      if (existing) {
        counts.articles.skipped++;
        continue;
      }
    }

    if (DRY_RUN) {
      log(`[DRY] Would insert article: ${art.title} (${art.slug})`);
      counts.articles.inserted++;
      continue;
    }

    const { error } = await supabase
      .from('hc_articles')
      .insert({
        section_id: sectionUuid,
        group_id: groupUuid,
        slug: art.slug,
        title: art.title,
        title_ar: art.title_ar || null,
        summary: art.summary || '',
        summary_ar: art.summary_ar || null,
        body_markdown: art.bodyMarkdown || '',
        body_markdown_ar: art.bodyMarkdown_ar || null,
        sort_order: 0,
        is_published: true,
        tags: art.tags || [],
        is_top: art.isTop || false,
        is_featured: art.isFeatured || false,
        role: art.role || null,
      });

    if (error) {
      warn(`Failed to insert article "${art.title}": ${error.message}`);
      continue;
    }

    counts.articles.inserted++;
  }

  // Log progress every batch
  log(`Processed ${counts.articles.inserted + counts.articles.skipped} articles`);
}

// ── 5. Seed Tutorials + Tutorial Items (from resourcesData.ts) ───────────────

async function seedTutorials() {
  console.log('\n🎬 Seeding tutorial groups (from resourcesData.ts)…');

  // Create one tutorial group per section for "teacher" audience
  const sectionToTutorialId = new Map<string, string>();

  for (const meta of sectionsMeta) {
    // Check if already exists
    if (!DRY_RUN) {
      const { data: existing } = await supabase
        .from('tutorials')
        .select('id')
        .eq('title', meta.title)
        .eq('audience', 'teacher')
        .maybeSingle();

      if (existing) {
        sectionToTutorialId.set(meta.key, existing.id);
        counts.tutorials.skipped++;
        continue;
      }
    }

    if (DRY_RUN) {
      log(`[DRY] Would insert tutorial group: ${meta.title} (audience: teacher)`);
      counts.tutorials.inserted++;
      continue;
    }

    const { data, error } = await supabase
      .from('tutorials')
      .insert({
        title: meta.title,
        title_ar: null,
        description: meta.description,
        description_ar: null,
        youtube_url: 'https://www.youtube.com/watch?v=placeholder',  // Group-level placeholder
        thumbnail_url: null,
        sort_order: sectionsMeta.indexOf(meta),
        is_published: true,
        audience: 'teacher',
      })
      .select('id')
      .single();

    if (error) {
      warn(`Failed to insert tutorial group "${meta.title}": ${error.message}`);
      continue;
    }

    sectionToTutorialId.set(meta.key, data.id);
    counts.tutorials.inserted++;
    log(`✓ ${meta.title}`);
  }

  // Now seed tutorial items
  console.log('\n🎥 Seeding tutorial items…');
  for (const res of resources) {
    const tutorialId = sectionToTutorialId.get(res.section);
    if (!tutorialId && !DRY_RUN) {
      warn(`Tutorial group for section "${res.section}" not found — skipping "${res.title}".`);
      continue;
    }

    if (!DRY_RUN && tutorialId) {
      const { data: existing } = await supabase
        .from('tutorial_items')
        .select('id')
        .eq('tutorial_id', tutorialId)
        .eq('title', res.title)
        .maybeSingle();

      if (existing) {
        counts.tutorialItems.skipped++;
        continue;
      }
    }

    if (DRY_RUN) {
      log(`[DRY] Would insert tutorial item: ${res.title} (type: ${res.type})`);
      counts.tutorialItems.inserted++;
      continue;
    }

    const { error } = await supabase
      .from('tutorial_items')
      .insert({
        tutorial_id: tutorialId,
        title: res.title,
        title_ar: null,
        description: res.description,
        description_ar: null,
        youtube_url: res.type === 'watch' ? res.link : null,
        link: res.link,
        thumbnail_url: res.thumbnail,
        resource_type: res.type,
        sort_order: resources.filter(r => r.section === res.section).indexOf(res),
        is_published: true,
      });

    if (error) {
      warn(`Failed to insert tutorial item "${res.title}": ${error.message}`);
      continue;
    }

    counts.tutorialItems.inserted++;
  }

  log(`Processed ${counts.tutorialItems.inserted + counts.tutorialItems.skipped} tutorial items`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Supabase Seed Script — Help Center + Tutorials');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Mode:      ${DRY_RUN ? '🔍 DRY RUN (no writes)' : '✏️  LIVE (will write to DB)'}`);
  console.log(`  URL:       ${SUPABASE_URL}`);
  console.log(`  Key:       ${SERVICE_ROLE_KEY!.substring(0, 12)}…`);
  console.log('');

  console.log(`📊 Source data counts:`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Sections:   ${sections.length}`);
  console.log(`   Groups:     ${groups.length}`);
  console.log(`   Articles:   ${articles.length}`);
  console.log(`   Tutorial sections: ${sectionsMeta.length}`);
  console.log(`   Tutorial items:    ${resources.length}`);

  // Seed Help Center content
  const catMap = await seedCategories();
  const secMap = await seedSections(catMap);
  const grpMap = await seedGroups(secMap);
  await seedArticles(secMap, grpMap);

  // Seed Tutorials/Resources
  await seedTutorials();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════════');
  for (const [table, c] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(16)} inserted: ${c.inserted}  skipped: ${c.skipped}`);
  }
  console.log('');

  if (DRY_RUN) {
    console.log('🔍 This was a DRY RUN. No data was written.');
    console.log('   Run without DRY_RUN=1 to actually insert data.');
  } else {
    console.log('✅ Seed complete! Verify in Supabase Dashboard → Table Editor.');
  }
}

main().catch((err) => {
  console.error('\n❌ Seed script failed:', err);
  process.exit(1);
});
