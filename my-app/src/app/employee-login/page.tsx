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
    <div className="min-h-screen bg-white flex items-center justify-center pt-16">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <h1 className={`font-bold text-center mb-6 text-black ${getTextSizeClass('2xl')}`}>Employee Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block font-medium text-black mb-2 ${getTextSizeClass('sm')}`}>
              Email
            </label>
            <input
              type="email"
              required
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 ${getTextSizeClass('base')}`}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className={`block font-medium text-black mb-2 ${getTextSizeClass('sm')}`}>
              Password
            </label>
            <input
              type="password"
              required
              className={`w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 ${getTextSizeClass('base')}`}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && (
            <div className={`text-red-600 text-center bg-red-50 p-2 rounded ${getTextSizeClass('sm')}`}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getTextSizeClass('base')}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}