'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import { useTranslation } from '@/hooks/useTranslation';
import { useTextSize } from '@/contexts/TextSizeContext';

export default function Login() {
  const router = useRouter();
  const { getTextSizeClass } = useTextSize();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Translations
  const managerText = useTranslation('Manager');
  const cashierText = useTranslation('Cashier');
  const customerLoginText = useTranslation('Customer Login');
  const phoneNumberText = useTranslation('Phone Number');
  const phoneNumberPlaceholder = useTranslation('Enter your phone number');
  const loginText = useTranslation('Login');
  const loginWithGoogleText = useTranslation('Login with Google');
  const guestText = useTranslation('Continue as Guest');

  const handlePhoneLogin = async () => {
    setError('');
    
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Phone number not found');
        setLoading(false);
        return;
      }

      // Success - redirect to kiosk
      router.push('/kiosk');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/kiosk" });
  };

  const handleGuest = async () => {
    // Log out current session if exists
    try {
      await fetch('/api/auth/customer-logout', {
        method: 'POST',
      });
    } catch (error) {
      // Ignore errors, just proceed to kiosk
    }
    router.push('/kiosk');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 p-8">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className={`font-bold text-gray-800 ${getTextSizeClass('3xl')}`}>{customerLoginText}</h1>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block font-semibold text-gray-800 mb-3 ${getTextSizeClass('base')}`}>
                  {phoneNumberText}
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePhoneLogin();
                    }
                  }}
                  className={`w-full px-4 py-3 border ${
                    error ? 'border-red-500' : 'border-gray-300'
                  } rounded-2xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${getTextSizeClass('base')}`}
                  placeholder={phoneNumberPlaceholder}
                  disabled={loading}
                />
                {error && (
                  <p className={`mt-2 text-red-600 ${getTextSizeClass('sm')}`}>
                    {error}
                  </p>
                )}
              </div>
              
              <button
                onClick={handlePhoneLogin}
                disabled={loading}
                className={`w-full px-4 py-3 bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 rounded-2xl font-bold hover:from-pink-300 hover:to-purple-400 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${getTextSizeClass('base')}`}
              >
                {loading ? 'Logging in...' : loginText}
              </button>

              <div className="pt-6 space-y-4 border-t border-gray-200">
                <button
                  onClick={handleGoogleLogin}
                  className={`w-full px-4 py-3 bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 rounded-2xl font-bold hover:from-pink-300 hover:to-purple-400 transition-all shadow-lg ${getTextSizeClass('base')}`}
                >
                  {loginWithGoogleText}
                </button>

                <button
                  onClick={handleGuest}
                  className={`w-full px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 rounded-2xl font-semibold hover:from-pink-100 hover:to-purple-100 transition-all ${getTextSizeClass('base')}`}
                >
                  {guestText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
}