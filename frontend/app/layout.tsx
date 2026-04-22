import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/components/QueryProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'ZamERP — Business Management for Zambian SMEs',
  description: 'Invoicing, Inventory, Accounting & Compliance — ZRA Ready',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
