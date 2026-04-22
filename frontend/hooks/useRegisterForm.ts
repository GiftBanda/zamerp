import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';

const registerSchema = z.object({
  companyName: z.string().min(2, 'Company name required'),
  tenantSlug: z.string()
    .min(2, 'Company ID required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  tpin: z.string().optional(),
  vrn: z.string().optional(),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export function useRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const nextStep = async () => {
    const fields: (keyof RegisterFormData)[] = step === 1
      ? ['companyName', 'tenantSlug']
      : ['firstName', 'lastName', 'email', 'password'];

    const ok = await form.trigger(fields);
    if (ok) {
      setStep((currentStep) => currentStep + 1);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await authApi.register(data);
      toast.success('Business registered! You can now sign in.');
      router.push('/auth/login');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    step,
    setStep,
    loading,
    nextStep,
    onSubmit,
  };
}
