'use client';

import { useLoginForm } from '@/hooks/useLoginForm';
import { Eye, EyeOff, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { register, handleSubmit, errors, showPass, setShowPass, loading, onSubmit } = useLoginForm();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl md:min-h-[calc(100vh-3rem)] md:grid-cols-2">
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-[linear-gradient(140deg,#0a4f66_0%,#0f172a_45%,#111827_100%)]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=%2272%22 height=%2272%22 viewBox=%220 0 72 72%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.16%22%3E%3Cpath d=%22M36 34c0-1.105.895-2 2-2h20a2 2 0 010 4H38a2 2 0 01-2-2zm-24 0c0-1.105.895-2 2-2h10a2 2 0 010 4H14a2 2 0 01-2-2zm14 14c0-1.105.895-2 2-2h30a2 2 0 010 4H28a2 2 0 01-2-2zm-14 0c0-1.105.895-2 2-2h4a2 2 0 010 4h-4a2 2 0 01-2-2zm26-28c0-1.105.895-2 2-2h18a2 2 0 010 4H40a2 2 0 01-2-2z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '72px 72px' }}
          />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div>
              <div className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/15 p-4 backdrop-blur">
                <Building2 className="h-9 w-9" />
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight">ZamERP</h1>
              <p className="mt-3 max-w-sm text-sm text-brand-100">
                Move from manual records to compliant, real-time business operations.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-medium">Built for Zambia</p>
              <p className="mt-2 text-xs text-brand-100">
                VAT-ready invoicing, stock control, audit trails, and reporting in one secure workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center md:text-left">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600">Welcome back</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Sign in to your account</h2>
              <p className="mt-1 text-sm text-gray-500">Enter your workspace details to continue.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Company ID</label>
                <input
                  {...register('tenantSlug')}
                  placeholder="e.g. acme-corp"
                  className="input"
                  autoComplete="organization"
                />
                {errors.tenantSlug && (
                  <p className="mt-1 text-xs text-red-500">{errors.tenantSlug.message}</p>
                )}
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="you@company.com"
                  className="input"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 md:text-left">
              New to ZamERP?{' '}
              <Link href="/auth/register" className="text-brand-600 font-medium hover:underline">
                Register your business
              </Link>
            </p>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                ZRA-Compliant Invoice System
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
