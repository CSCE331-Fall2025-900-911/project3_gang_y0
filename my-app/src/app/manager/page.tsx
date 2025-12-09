'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ManagerTabs from '../components/ManagerTabs';

export default function ManagerPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (!response.ok) {
          router.push('/employee-login');
          return;
        }
        const data = await response.json();
        if (data.employee.position !== 'manager') {
          router.push('/employee-login');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        router.push('/employee-login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-8">
      <div className="w-[1200px] border border-gray-200 rounded-2xl shadow-sm bg-gradient-to-b from-white to-slate-50">
        <header className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold text-xl">
              M
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-blue-800">Manager Dashboard</h1>
              <p className="text-sm text-gray-600">Manage menu, inventory, employees, and reports</p>
            </div>
          </div>
        </header>
        <main className="p-6">
          <ManagerTabs />
        </main>
      </div>
    </div>
  );
}
