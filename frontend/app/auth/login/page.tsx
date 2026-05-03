'use client';

import { useLoginForm } from '@/hooks/useLoginForm';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const { register, handleSubmit, errors, showPass, setShowPass, loading, onSubmit } = useLoginForm();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800">
      <div className="grid max-h-[calc(100vh)] w-full overflow-hidden bg-white shadow-2xl md:min-h-[calc(100vh)] md:grid-cols-2">
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-[linear-gradient(155deg,#0f172a_0%,#0a4f66_0%,#0b1120_0%)]" />
          <Image src="/assets/corp.jpg" alt="Login Background" fill className="object-cover opacity-80" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight">ZamERP</h1>
              <p className="mt-3 max-w-sm text-sm text-brand-100">
                Move from manual records to compliant, real-time business operations.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-medium">Built for Zambian SMEs</p>
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
                  placeholder="e.g. banda-corp"
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
