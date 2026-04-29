'use client';

import { useRegisterForm } from '@/hooks/useRegisterForm';
import { Building2, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { register, handleSubmit, errors, step, setStep, loading, nextStep, onSubmit } = useRegisterForm();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl md:min-h-[calc(100vh-3rem)] md:grid-cols-2">
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-[linear-gradient(155deg,#0f172a_0%,#0a4f66_55%,#0b1120_100%)]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=%2284%22 height=%2284%22 viewBox=%220 0 84 84%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.14%22%3E%3Cpath d=%22M42 6l30 18v36L42 78 12 60V24L42 6zm0 6.8L18 27.2v29.6L42 71.2l24-14.4V27.2L42 12.8z%22/%3E%3Cpath d=%22M42 28a14 14 0 110 28 14 14 0 010-28zm0 6a8 8 0 100 16 8 8 0 000-16z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '84px 84px' }}
          />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div>
              <div className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/15 p-4 backdrop-blur">
                <Building2 className="h-9 w-9" />
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight">Start with ZamERP</h1>
              <p className="mt-3 max-w-sm text-sm text-brand-100">
                Launch your business workspace with invoicing, inventory, and compliance workflows from day one.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-medium">Registration in 3 steps</p>
              <p className="mt-2 text-xs text-brand-100">
                Set company details, create your admin account, and start operating with a secure tenant setup.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-lg">
            <div className="mb-8 text-center md:text-left">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-600">Create workspace</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Register your business</h2>
              <p className="mt-1 text-sm text-gray-500">Complete setup to unlock your company dashboard.</p>
            </div>

            <div className="bg-white">
              {/* Steps indicator */}
              <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s < step ? 'bg-green-500 text-white' :
                      s === step ? 'bg-brand-600 text-white' :
                      'bg-gray-100 text-gray-400'
                    }`}>{s}</div>
                    {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Company Info */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
                <div>
                  <label className="label">Company Name *</label>
                  <input {...register('companyName')} className="input" placeholder="Acme Corporation Ltd" />
                  {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName.message}</p>}
                </div>
                <div>
                  <label className="label">Company ID (URL-safe) *</label>
                  <div className="flex items-center gap-0">
                    <span className="px-3 py-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500">zamerp.co.zm/</span>
                    <input {...register('tenantSlug')} className="input rounded-l-none" placeholder="acme-corp" />
                  </div>
                  {errors.tenantSlug && <p className="mt-1 text-xs text-red-500">{errors.tenantSlug.message}</p>}
                  <p className="mt-1 text-xs text-gray-400">Lowercase letters, numbers and hyphens only</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">TPIN (optional)</label>
                    <input {...register('tpin')} className="input" placeholder="1234567890" />
                    <p className="mt-1 text-xs text-gray-400">ZRA Taxpayer ID</p>
                  </div>
                  <div>
                    <label className="label">VRN (optional)</label>
                    <input {...register('vrn')} className="input" placeholder="VAT Reg No." />
                    <p className="mt-1 text-xs text-gray-400">VAT Registration</p>
                  </div>
                </div>
                <button type="button" onClick={nextStep} className="btn-primary w-full py-2.5 mt-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Admin User */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Account</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name *</label>
                    <input {...register('firstName')} className="input" placeholder="John" />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="label">Last Name *</label>
                    <input {...register('lastName')} className="input" placeholder="Doe" />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input {...register('email')} type="email" className="input" placeholder="admin@company.com" />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input {...register('password')} type="password" className="input" placeholder="Min 8 characters" />
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-2.5">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="button" onClick={nextStep} className="btn-primary flex-1 py-2.5">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready to launch 🚀</h2>
                <div className="bg-brand-50 rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-gray-500">By registering you agree to use ZamERP responsibly and comply with ZRA regulations.</p>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span>
                      ZRA-ready invoice structure
                    </div>
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span>
                      Multi-user with role-based access
                    </div>
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span>
                      Full audit trail for compliance
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-2.5">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Creating...' : 'Create Business'}
                  </button>
                </div>
              </div>
            )}
          </form>

              <p className="mt-6 text-center text-sm text-gray-500 md:text-left">
                Already registered?{' '}
                <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
