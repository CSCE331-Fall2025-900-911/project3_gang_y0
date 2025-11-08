'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CashierLogin() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after authentication
    // For now, just redirect immediately as placeholder
    const timer = setTimeout(() => {
      router.push('/cashier');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-black text-xl">CashierLogin</div>
    </div>
  );
}

