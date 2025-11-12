'use client';

import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import { useTranslation } from '@/hooks/useTranslation';

export default function Login() {
  const router = useRouter();
  
  // Translations
  const managerText = useTranslation('Manager');
  const cashierText = useTranslation('Cashier');
  const customerLoginText = useTranslation('Customer Login');
  const emailText = useTranslation('Email');
  const emailPlaceholder = useTranslation('Enter your email');
  const loginText = useTranslation('Login');
  const guestText = useTranslation('Continue as Guest');

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/kiosk" });
  };

  const handleGuest = () => {
    router.push('/kiosk');
  };

  const handleManager = () => {
    router.push('/manager-login');
  };

  const handleCashier = () => {
    router.push('/cashier-login');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={handleManager}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {managerText}
        </button>
        <button
          onClick={handleCashier}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {cashierText}
        </button>
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-black mb-8">{customerLoginText}</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                {emailText}
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={emailPlaceholder}
              />
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loginText}
            </button>

            <button
              onClick={handleGuest}
              className="w-full px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
            >
              {guestText}
            </button>
          </div>
        </div>
        </div>
    </div>
    );
}