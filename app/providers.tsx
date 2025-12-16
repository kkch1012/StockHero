'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/contexts/AuthContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

