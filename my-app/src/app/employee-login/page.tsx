'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTextSize } from '@/contexts/TextSizeContext';

export default function EmployeeLogin() {
  const router = useRouter();
  const { getTextSizeClass } = useTextSize();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Redirect based on role
        if (data.employee.position === 'manager') {
          router.push('/manager-dashboard');
        } else {
          router.push('/cashier');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 p-8">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className={`font-bold text-gray-800 ${getTextSizeClass('3xl')}`}>Employee Login</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block font-semibold text-gray-800 mb-3 ${getTextSizeClass('base')}`}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  className={`w-full px-4 py-3 border ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } rounded-2xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${getTextSizeClass('base')}`}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    setError('');
                  }}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className={`block font-semibold text-gray-800 mb-3 ${getTextSizeClass('base')}`}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  className={`w-full px-4 py-3 border ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } rounded-2xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${getTextSizeClass('base')}`}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    setError('');
                  }}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className={`mt-2 text-red-600 ${getTextSizeClass('sm')}`}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full px-4 py-3 bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 rounded-2xl font-bold hover:from-pink-300 hover:to-purple-400 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${getTextSizeClass('base')}`}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}