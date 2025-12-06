'use client';

import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import { useTranslation } from '@/hooks/useTranslation';
import { useTextSize } from '@/contexts/TextSizeContext';

export default function Login() {
  const router = useRouter();
  const { getTextSizeClass } = useTextSize();
  
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
    router.push('/employee-login');
  };

  const handleCashier = () => {
    router.push('/employee-login');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={handleManager}
          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${getTextSizeClass('sm')}`}
        >
          {managerText}
        </button>
        <button
          onClick={handleCashier}
          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${getTextSizeClass('sm')}`}
        >
          {cashierText}
        </button>
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-6 p-8">
          <div className="text-center">
            <h1 className={`font-semibold text-black mb-8 ${getTextSizeClass('2xl')}`}>{customerLoginText}</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block font-medium text-black mb-2 ${getTextSizeClass('sm')}`}>
                {emailText}
              </label>
              <input
                type="email"
                className={`w-full px-4 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 ${getTextSizeClass('base')}`}
                placeholder={emailPlaceholder}
              />
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${getTextSizeClass('base')}`}
            >
              {loginText}
            </button>

            <button
              onClick={handleGuest}
              className={`w-full px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 ${getTextSizeClass('base')}`}
            >
              {guestText}
            </button>
          </div>
        </div>
        </div>
    </div>
    );
}