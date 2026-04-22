'use client';

import { useLoginForm } from '@/hooks/useLoginForm';
import { Eye, EyeOff, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { register, handleSubmit, errors, showPass, setShowPass, loading, onSubmit } = useLoginForm();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4 border border-white/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ZamERP</h1>
          <p className="text-brand-200 mt-1 text-sm">Business Management for Zambian SMEs</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Company ID */}
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

            {/* Email */}
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

            {/* Password */}
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

          <p className="mt-6 text-center text-sm text-gray-500">
            New to ZamERP?{' '}
            <Link href="/auth/register" className="text-brand-600 font-medium hover:underline">
              Register your business
            </Link>
          </p>
        </div>

        {/* ZRA badge */}
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs text-brand-200">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            ZRA-Compliant Invoice System
          </span>
        </div>
      </div>
    </div>
  );
}
