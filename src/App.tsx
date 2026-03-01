import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './lib/auth';
import { supabase } from './lib/supabase';

import Home from './pages/Home';
import CategoryPage from './pages/Category';
import HelpSectionLandingPage from './pages/HelpSectionLandingPage';
import ArticlePage from './pages/Article';
import SearchPage from './pages/Search';
import RoleFeaturePage from './pages/RoleFeaturePage';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import ResourcesPage from './pages/ResourcesPage';
import TeacherResourcesPage from './pages/TeacherResourcesPage';
import StudentResourcesPage from './pages/StudentResourcesPage';
import TeacherResourcesAllPage from './pages/TeacherResourcesAllPage';
import StudentResourcesAllPage from './pages/StudentResourcesAllPage';
import BlogFeed from './pages/BlogFeed';
import BlogPostDetail from './pages/BlogPostDetail';
import BlogEditor from './pages/BlogEditor';
import TeacherDashboard from './pages/TeacherDashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import AccountSettings from './pages/AccountSettings';
import { PrivateRoute } from './components/PrivateRoute';
import { RoleRoute } from './components/RoleRoute';
import { DevDebugWidget } from './components/DevDebugWidget';
import { RequireAdmin } from './components/RequireAdmin';
import AdminCmsLogin from './pages/AdminCmsLogin';
import AdminHelpCenter from './pages/AdminHelpCenter';
import AdminCategoryEditor from './pages/AdminCategoryEditor';
import AdminArticleList from './pages/AdminArticleList';
import AdminArticleEditor from './pages/AdminArticleEditor';
import HelpCenterHome from './pages/HelpCenterHome';
import HelpCenterCategory from './pages/HelpCenterCategory';
import HelpCenterArticle from './pages/HelpCenterArticle';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminHelpCenterHub from './admin/pages/AdminHelpCenterHub';
import AdminArticleListAll from './admin/pages/AdminArticleListAll';
import AdminArticleEditorFlat from './admin/pages/AdminArticleEditorFlat';
import AdminSectionListAll from './admin/pages/AdminSectionListAll';
import AdminSectionEditorFlat from './admin/pages/AdminSectionEditorFlat';
import AdminBlogList from './admin/pages/AdminBlogList';
import AdminBlogEditor from './admin/pages/AdminBlogEditor';
import AdminTutorials from './admin/pages/AdminTutorials';
import HelpCenterSection from './pages/HelpCenterSection';
import TutorialsPage from './pages/TutorialsPage';

/* ── Temporary debug banner — DELETE THIS COMPONENT after confirming Supabase works ── */
function SupabaseDebugBanner() {
  const [info, setInfo] = useState<{ status: string; detail: string; ok: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t0 = performance.now();
    const urlSet = !!import.meta.env.VITE_SUPABASE_URL;
    const keySet = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!urlSet || !keySet) {
      setInfo({ status: `ENV MISSING — URL: ${urlSet}, KEY: ${keySet}`, detail: 'Check .env file', ok: false });
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('hc_categories')
          .select('id')
          .limit(1);
        const ms = (performance.now() - t0).toFixed(0);
        if (error) {
          setInfo({ status: `QUERY FAILED (${ms}ms)`, detail: `${error.message} [code: ${error.code}]`, ok: false });
        } else {
          setInfo({ status: `OK (${ms}ms)`, detail: `hc_categories returned ${data?.length ?? 0} row(s)`, ok: true });
        }
      } catch (err: any) {
        const ms = (performance.now() - t0).toFixed(0);
        setInfo({ status: `NETWORK ERROR (${ms}ms)`, detail: err?.message || 'Unknown error', ok: false });
      }
    })();
  }, []);

  if (dismissed || !info) return null;

  return (
    <div
      onClick={() => setDismissed(true)}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
        padding: '8px 16px', fontSize: 12, fontFamily: 'monospace', cursor: 'pointer',
        background: info.ok ? '#065f46' : '#991b1b', color: '#fff',
      }}
    >
      <strong>Supabase:</strong> {info.status} — {info.detail}
      <span style={{ float: 'right', opacity: 0.7 }}>(click to dismiss)</span>
    </div>
  );
}

/* ── DEV-only route/loading debug overlay — top-right corner ── */
function DevRouteOverlay() {
  const location = useLocation();
  const [lastFetch, setLastFetch] = useState<string>('—');
  const [lastError, setLastError] = useState<string>('—');
  const [elapsed, setElapsed] = useState(0);

  // Track time since last navigation (detects stuck loading)
  useEffect(() => {
    setElapsed(0);
    setLastFetch('—');
    setLastError('—');
    const iv = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(iv);
  }, [location.pathname]);

  useEffect(() => {
    // Listen for custom debug events from pages
    const onFetch = () => setLastFetch(new Date().toLocaleTimeString());
    const onError = (e: Event) => setLastError((e as CustomEvent).detail || 'unknown');
    window.addEventListener('hc-debug-fetch', onFetch);
    window.addEventListener('hc-debug-error', onError);
    return () => {
      window.removeEventListener('hc-debug-fetch', onFetch);
      window.removeEventListener('hc-debug-error', onError);
    };
  }, []);

  if (!import.meta.env.DEV) return null;

  const stuck = elapsed > 5 && lastFetch === '—';

  return (
    <div
      style={{
        position: 'fixed', top: 8, right: 8, zIndex: 99998,
        background: stuck ? 'rgba(153,27,27,0.9)' : 'rgba(0,0,0,0.8)',
        color: stuck ? '#fecaca' : '#a5f3fc', fontSize: 11,
        fontFamily: 'monospace', padding: '6px 10px', borderRadius: 6,
        lineHeight: 1.6, maxWidth: 320, pointerEvents: 'none',
      }}
    >
      <div><strong>Route:</strong> {location.pathname}</div>
      <div><strong>Elapsed:</strong> {elapsed}s {stuck ? '⚠ STUCK?' : ''}</div>
      <div><strong>Last fetch:</strong> {lastFetch}</div>
      <div><strong>Last error:</strong> {lastError}</div>
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
      <HashRouter>
        {/* ── Temporary: remove after confirming Supabase connectivity ── */}
        <SupabaseDebugBanner />
        {/* ── DEV-only route diagnostics overlay ── */}
        <DevRouteOverlay />
        <Routes>
          {/* Redirect root to help home */}
          <Route path="/" element={<Navigate to="/help" replace />} />

          <Route path="/help" element={<Home />} />
          <Route path="/help/search" element={<SearchPage />} />

          {/* Dynamic Routes */}
          <Route path="/help/category/:categorySlug" element={<CategoryPage />} />

          {/* CRITICAL: Use the new Landing Page for Sections */}
          <Route path="/help/category/:categorySlug/section/:sectionSlug" element={<HelpSectionLandingPage />} />

          <Route path="/help/article/:articleSlug" element={<ArticlePage />} />

          <Route path="/help/resources" element={<ResourcesPage />} />
          <Route path="/help/resources/teachers" element={<TeacherResourcesPage />} />
          <Route path="/help/resources/teachers/all" element={<TeacherResourcesAllPage />} />
          <Route path="/help/resources/students" element={<StudentResourcesPage />} />
          <Route path="/help/resources/students/all" element={<StudentResourcesAllPage />} />

          {/* Blog (public: read-only) */}
          <Route path="/blog" element={<BlogFeed />} />
          <Route path="/blog/:postId" element={<BlogPostDetail />} />

          {/* Tutorials (public: read-only) */}
          <Route path="/tutorials" element={<TutorialsPage />} />

          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />

          {/* Account Settings - Protected Route */}
          <Route path="/account" element={<PrivateRoute><AccountSettings /></PrivateRoute>} />

          {/* Legacy teacher routes - redirect to new login */}
          <Route path="/help/teacher/teacher-login" element={<Navigate to="/login" replace />} />
          <Route path="/teacher/login" element={<Navigate to="/login" replace />} />
          <Route path="/teacher/dashboard" element={
            <RoleRoute allowedRoles={['teacher', 'admin']}>
              <TeacherDashboard />
            </RoleRoute>
          } />

          {/* Role-based feature pages: /help/teacher/*, /help/student/* */}
          <Route path="/help/:role/:featureSlug" element={<RoleFeaturePage />} />

          {/* ═══ Help Center CMS (DB-driven) ═══ */}
          {/* Public: read-only pages fetching from hc_categories / hc_sections / hc_articles */}
          <Route path="/help-center" element={<HelpCenterHome />} />
          <Route path="/help-center/:categorySlug" element={<HelpCenterCategory />} />
          <Route path="/help-center/:categorySlug/:sectionSlug" element={<HelpCenterSection />} />
          <Route path="/help-center/:categorySlug/:sectionSlug/:articleSlug" element={<HelpCenterArticle />} />

          {/* ═══ Admin CMS (/admin/*) — RequireAdmin on every route ═══ */}
          <Route path="/admin/login" element={<AdminCmsLogin />} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

          {/* Admin: Blog management */}
          <Route path="/admin/blog" element={<RequireAdmin><AdminBlogList /></RequireAdmin>} />
          <Route path="/admin/blog/new" element={<RequireAdmin><AdminBlogEditor /></RequireAdmin>} />
          <Route path="/admin/blog/edit/:id" element={<RequireAdmin><AdminBlogEditor /></RequireAdmin>} />
          {/* Legacy blog edit route (backward compat) */}
          <Route path="/admin/blog/:postId/edit" element={<RequireAdmin><BlogEditor /></RequireAdmin>} />

          {/* Admin: Tutorials management */}
          <Route path="/admin/tutorials" element={<RequireAdmin><AdminTutorials /></RequireAdmin>} />

          {/* Admin: Help Center management — flat routes */}
          <Route path="/admin/help-center" element={<RequireAdmin><AdminHelpCenterHub /></RequireAdmin>} />
          <Route path="/admin/help-center/categories" element={<RequireAdmin><AdminHelpCenterHub /></RequireAdmin>} />
          <Route path="/admin/help-center/sections" element={<RequireAdmin><AdminSectionListAll /></RequireAdmin>} />
          <Route path="/admin/help-center/sections/new" element={<RequireAdmin><AdminSectionEditorFlat /></RequireAdmin>} />
          <Route path="/admin/help-center/sections/edit/:id" element={<RequireAdmin><AdminSectionEditorFlat /></RequireAdmin>} />
          <Route path="/admin/help-center/articles" element={<RequireAdmin><AdminArticleListAll /></RequireAdmin>} />
          <Route path="/admin/help-center/articles/new" element={<RequireAdmin><AdminArticleEditorFlat /></RequireAdmin>} />
          <Route path="/admin/help-center/articles/edit/:id" element={<RequireAdmin><AdminArticleEditorFlat /></RequireAdmin>} />

          {/* Admin: Help Center — legacy nested routes (backward compat) */}
          <Route path="/admin/help-center/category/:categoryId" element={<RequireAdmin><AdminCategoryEditor /></RequireAdmin>} />
          <Route path="/admin/help-center/category/:categoryId/edit" element={<RequireAdmin><AdminCategoryEditor /></RequireAdmin>} />
          <Route path="/admin/help-center/category/:categoryId/articles" element={<RequireAdmin><AdminArticleList /></RequireAdmin>} />
          <Route path="/admin/help-center/category/:categoryId/article/:articleId" element={<RequireAdmin><AdminArticleEditor /></RequireAdmin>} />
          <Route path="/admin/help-center/category/:categoryId/article/:articleId/edit" element={<RequireAdmin><AdminArticleEditor /></RequireAdmin>} />

          {/* Unauthorized */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Fallback */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>

        {/* DEV-only debug widget — only renders when import.meta.env.DEV is true */}
        <DevDebugWidget />
      </HashRouter>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
