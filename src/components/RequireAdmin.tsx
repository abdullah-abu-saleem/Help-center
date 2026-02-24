import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

/**
 * Route guard for /admin/* pages.
 *
 * Relies entirely on AuthProvider (Supabase session + profiles.role).
 * No localStorage bridge, no self-contained recovery, no safety timeouts.
 */
export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // AuthProvider still hydrating session — show spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafbfc' }}>
        <p className="text-sm text-slate-400">Verifying admin access…</p>
      </div>
    );
  }

  // No authenticated user → redirect to admin login
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // Authenticated but not admin → redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Admin verified → render protected content
  return <>{children}</>;
};
