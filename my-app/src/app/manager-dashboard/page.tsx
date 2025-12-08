'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTextSize } from '@/contexts/TextSizeContext';

export default function ManagerDashboard() {
  const router = useRouter();
  const { getTextSizeClass } = useTextSize();
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 flex items-center justify-center">
        <div className={`text-gray-800 ${getTextSizeClass('base')}`}>Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`font-bold text-gray-800 ${getTextSizeClass('3xl')}`}>Manager Dashboard</h1>
              <p className={`text-gray-600 mt-2 ${getTextSizeClass('base')}`}>Welcome back, {employee.name}!</p>
            </div>
            <button
              onClick={handleLogout}
              className={`bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-pink-500 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg ${getTextSizeClass('sm')}`}
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push('/cashier')}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-purple-300 text-left"
          >
            <div className="mb-4">
              <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className={`font-semibold text-gray-800 mb-2 ${getTextSizeClass('xl')}`}>Cashier Interface</h2>
            <p className={`text-gray-600 ${getTextSizeClass('base')}`}>Process customer orders and handle transactions</p>
          </button>

          <button
            onClick={() => router.push('/manager')}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-purple-300 text-left"
          >
            <div className="mb-4">
              <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className={`font-semibold text-gray-800 mb-2 ${getTextSizeClass('xl')}`}>Manager Tools</h2>
            <p className={`text-gray-600 ${getTextSizeClass('base')}`}>Access reports, analytics, and administrative functions</p>
          </button>
        </div>
      </div>
    </div>
  );
}