'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ManagerDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
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
          router.push('/cashier');
          return;
        }
        setEmployee(data.employee);
      } catch (error) {
        router.push('/employee-login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/employee-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Manager Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back, {employee.name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
        
        {/* Navigation Cards */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-2">Cashier Interface</h2>
            <p className="text-gray-600 mb-4">Process customer orders and handle transactions</p>
            <button
              onClick={() => router.push('/cashier')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Cashier
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-2">Manager Tools</h2>
            <p className="text-gray-600 mb-4">Access reports, analytics, and administrative functions</p>
            <button
              onClick={() => router.push('/manager')}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}