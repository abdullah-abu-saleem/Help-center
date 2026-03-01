import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { HcCategory } from '../../lib/helpCenterApi';

/* ── Admin action descriptors ─────────────────────────────────────────────── */

export interface CategoryCardAdminActions {
  viewHref: string;
  sectionsTo: string;
  editTo: string;
  onDelete: () => void;
  deleteConfirm: boolean;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

/* ── Props ────────────────────────────────────────────────────────────────── */

export interface CategoryCardProps {
  category: HcCategory;
  /** Index in the list — used for stagger animation delay */
  index?: number;
  /** Current language code ('en' | 'ar') */
  lang?: string;
  /** User-site link target (e.g. /help-center/{slug}). Ignored in admin mode. */
  linkTo?: string;
  /** When provided the card renders admin overlay actions instead of "Explore" */
  adminActions?: CategoryCardAdminActions;
  /** Admin mode: handle single-click (e.g. navigate to management page) */
  onSingleClick?: () => void;
  /** Admin mode: handle double-click (e.g. open edit modal) */
  onDoubleClick?: () => void;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function CategoryCard({
  category: cat,
  index = 0,
  lang = 'en',
  linkTo,
  adminActions,
  onSingleClick,
  onDoubleClick,
}: CategoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localized = (en: string, ar: string | null | undefined) =>
    lang === 'ar' ? (ar || en) : (en || ar || '');

  // Cleanup click timer on unmount
  useEffect(() => {
    return () => { if (clickTimer.current) clearTimeout(clickTimer.current); };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  /* ── Shared card body (identical in user & admin mode) ── */

  const cardBody = (
    <div style={{ padding: '28px 28px 32px' }}>
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-5"
        style={{ boxShadow: '0 2px 10px rgba(99,102,241,0.08)' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
      </div>

      {/* Title (+ optional Inactive badge in admin mode) */}
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <h2
          className="text-[17px] font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors duration-200"
          style={{ lineHeight: 1.35 }}
        >
          {localized(cat.title, cat.title_ar)}
        </h2>
        {adminActions && !cat.is_published && (
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-medium">
            Inactive
          </span>
        )}
      </div>

      {/* Description */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: '#64748b', opacity: 0.78, lineHeight: 1.65 }}
      >
        {localized(cat.description, cat.description_ar)}
      </p>

      {/* Footer: "Explore" (user) or slug + sort order (admin) */}
      {adminActions ? (
        <div className="mt-5 flex items-center gap-3 text-xs text-slate-400">
          <span>/{cat.slug}</span>
          <span>&middot;</span>
          <span>Order: {cat.sort_order}</span>
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-indigo-500 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span>{lang === 'ar' ? '\u0627\u0633\u062a\u0643\u0634\u0641' : 'Explore'}</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
      )}
    </div>
  );

  /* ── Admin actions overlay (three-dot dropdown) ── */

  const adminOverlay = adminActions && (
    <div
      ref={menuRef}
      className="absolute top-3 right-3 z-10"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
          menuOpen
            ? 'bg-white shadow-md text-slate-700'
            : 'bg-white/0 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:shadow-md hover:text-slate-700'
        }`}
        title="Actions"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div
          className="absolute right-0 top-10 w-44 bg-white rounded-xl border border-slate-100 py-1 z-20"
          style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}
        >
          {/* View on site */}
          <a
            href={adminActions.viewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View on site
          </a>

          {/* Sections */}
          <Link
            to={adminActions.sectionsTo}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
            Sections
          </Link>

          {/* Edit */}
          <Link
            to={adminActions.editTo}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            Edit
          </Link>

          <div className="my-1 border-t border-slate-100" />

          {/* Delete (with inline confirm) */}
          {adminActions.deleteConfirm ? (
            <div className="px-3.5 py-2">
              <p className="text-xs text-red-500 font-medium mb-2">Delete this category?</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { adminActions.onDeleteConfirm(); setMenuOpen(false); }}
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => adminActions.onDeleteCancel()}
                  className="flex-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => adminActions.onDelete()}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );

  /* ── Render ── */

  const animDelay = `${0.1 + index * 0.08}s`;

  /* ── Admin click-handler mode (looks identical to public, custom click behavior) ── */

  if (onSingleClick || onDoubleClick) {
    const handleClick = () => {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
        return;
      }
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        onSingleClick?.();
      }, 250);
    };

    const handleDblClick = () => {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
      }
      onDoubleClick?.();
    };

    return (
      <div
        className="group card-modern flex flex-col fade-up cursor-pointer"
        style={{
          padding: 0,
          minHeight: 200,
          animationDelay: animDelay,
          textDecoration: 'none',
        }}
        onClick={handleClick}
        onDoubleClick={handleDblClick}
      >
        {cardBody}
      </div>
    );
  }

  if (adminActions) {
    return (
      <Link
        to={adminActions.editTo}
        className="group card-modern flex flex-col fade-up cursor-pointer"
        style={{
          padding: 0,
          minHeight: 200,
          animationDelay: animDelay,
          textDecoration: 'none',
          position: 'relative',
          overflow: 'visible',   // allow dropdown to escape card bounds
        }}
      >
        {adminOverlay}
        {cardBody}
      </Link>
    );
  }

  return (
    <Link
      to={linkTo || '#'}
      className="group card-modern flex flex-col fade-up cursor-pointer"
      style={{
        padding: 0,
        minHeight: 200,
        animationDelay: animDelay,
        textDecoration: 'none',
      }}
    >
      {cardBody}
    </Link>
  );
}
