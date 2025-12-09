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
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpData, setSignUpData] = useState({
    name: '',
    phoneNumber: '',
    email: ''
  });
  const [signUpError, setSignUpError] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  
  // Translations
  const managerText = useTranslation('Manager');
  const cashierText = useTranslation('Cashier');
  const customerLoginText = useTranslation('Customer Login');
  const phoneNumberText = useTranslation('Phone Number');
  const phoneNumberPlaceholder = useTranslation('Enter your phone number');
  const loginText = useTranslation('Login');
  const loginWithGoogleText = useTranslation('Login with Google');
  const guestText = useTranslation('Continue as Guest');
  const signUpText = useTranslation('Sign Up');
  const nameText = useTranslation('Name');
  const namePlaceholder = useTranslation('Enter your name');
  const emailText = useTranslation('Email');
  const emailPlaceholder = useTranslation('Enter your email');
  const createAccountText = useTranslation('Create Account');
  const closeText = useTranslation('Close');

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

  const handleSignUp = async () => {
    setSignUpError('');
    
    if (!signUpData.name.trim()) {
      setSignUpError('Please enter your name');
      return;
    }

    if (!signUpData.phoneNumber.trim()) {
      setSignUpError('Please enter your phone number');
      return;
    }

    if (!signUpData.email.trim()) {
      setSignUpError('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpData.email)) {
      setSignUpError('Please enter a valid email address');
      return;
    }

    setSignUpLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signUpData.name,
          phoneNumber: signUpData.phoneNumber,
          email: signUpData.email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSignUpError(data.error || 'Sign up failed');
        setSignUpLoading(false);
        return;
      }

      // Success - close modal and redirect to kiosk
      setShowSignUp(false);
      setSignUpData({ name: '', phoneNumber: '', email: '' });
      router.push('/kiosk');
    } catch (err) {
      console.error('Sign up error:', err);
      setSignUpError('An error occurred. Please try again.');
      setSignUpLoading(false);
    }
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

              <button
                onClick={() => setShowSignUp(true)}
                className={`w-full px-4 py-3 bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 rounded-2xl font-bold hover:from-pink-300 hover:to-purple-400 transition-all shadow-lg ${getTextSizeClass('base')}`}
              >
                {signUpText}
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

      {/* Sign Up Modal */}
      {showSignUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`font-bold text-gray-800 ${getTextSizeClass('2xl')}`}>
                {signUpText}
              </h2>
              <button
                onClick={() => {
                  setShowSignUp(false);
                  setSignUpData({ name: '', phoneNumber: '', email: '' });
                  setSignUpError('');
                }}
                className={`text-gray-500 hover:text-gray-700 ${getTextSizeClass('xl')}`}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block font-semibold text-gray-800 mb-2 ${getTextSizeClass('base')}`}>
                  {nameText}
                </label>
                <input
                  type="text"
                  value={signUpData.name}
                  onChange={(e) => {
                    setSignUpData({ ...signUpData, name: e.target.value });
                    setSignUpError('');
                  }}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${getTextSizeClass('base')}`}
                  placeholder={namePlaceholder}
                  disabled={signUpLoading}
                />
              </div>

              <div>
                <label className={`block font-semibold text-gray-800 mb-2 ${getTextSizeClass('base')}`}>
                  {phoneNumberText}
                </label>
                <input
                  type="tel"
                  value={signUpData.phoneNumber}
                  onChange={(e) => {
                    setSignUpData({ ...signUpData, phoneNumber: e.target.value });
                    setSignUpError('');
                  }}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${getTextSizeClass('base')}`}
                  placeholder={phoneNumberPlaceholder}
                  disabled={signUpLoading}
                />
              </div>

              <div>
                <label className={`block font-semibold text-gray-800 mb-2 ${getTextSizeClass('base')}`}>
                  {emailText}
                </label>
                <input
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => {
                    setSignUpData({ ...signUpData, email: e.target.value });
                    setSignUpError('');
                  }}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${getTextSizeClass('base')}`}
                  placeholder={emailPlaceholder}
                  disabled={signUpLoading}
                />
              </div>

              {signUpError && (
                <p className={`text-red-600 ${getTextSizeClass('sm')}`}>
                  {signUpError}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowSignUp(false);
                    setSignUpData({ name: '', phoneNumber: '', email: '' });
                    setSignUpError('');
                  }}
                  className={`flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition-all ${getTextSizeClass('base')}`}
                  disabled={signUpLoading}
                >
                  {closeText}
                </button>
                <button
                  onClick={handleSignUp}
                  disabled={signUpLoading}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 rounded-2xl font-bold hover:from-pink-300 hover:to-purple-400 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${getTextSizeClass('base')}`}
                >
                  {signUpLoading ? 'Creating...' : createAccountText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    );
}