import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

const loginSchema = z.object({
  tenantSlug: z.string().min(1, 'Company ID is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password, data.tenantSlug);
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    showPass,
    setShowPass,
    loading,
    onSubmit,
  };
}
