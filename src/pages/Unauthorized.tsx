import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';

export default function Unauthorized() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div
            className="flex items-center justify-center w-20 h-20 rounded-3xl mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.1)',
            }}
          >
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1
            className="text-2xl font-bold text-slate-900"
            style={{ marginBottom: 8 }}
          >
            Access Denied
          </h1>

          {/* Description */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: '#64748b', marginBottom: 8 }}
          >
            You don't have permission to access this page.
          </p>

          {/* Show current role if logged in */}
          {user && (
            <p
              className="text-xs font-medium"
              style={{ color: '#94a3b8', marginBottom: 24 }}
            >
              Signed in as{' '}
              <span className="text-slate-600">{user.email}</span>
              {' '}(role:{' '}
              <span className="text-slate-600">{user.role}</span>)
            </p>
          )}

          {!user && (
            <p
              className="text-xs"
              style={{ color: '#94a3b8', marginBottom: 24 }}
            >
              You may need to sign in with an authorized account.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/help"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #ed3b91, #d6257a)',
                boxShadow: '0 2px 8px rgba(237,59,145,0.3)',
              }}
            >
              Go Home
            </Link>
            {!user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  color: '#ed3b91',
                  background: 'rgba(237,59,145,0.08)',
                  border: '1px solid rgba(237,59,145,0.15)',
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
