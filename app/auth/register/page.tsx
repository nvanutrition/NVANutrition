'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { setDoc, doc } from 'firebase/firestore';

export default function RegisterPage() {
  const [step, setStep] = useState<'request' | 'verify' | 'password'>('request');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');
  const [savedName, setSavedName] = useState('');
  const router = useRouter();
  const redirectTo = typeof window !== 'undefined' ? sessionStorage.getItem('authRedirect') || '/' : '/';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!sessionStorage.getItem('authRedirect')) {
      const referrer = document.referrer;
      if (referrer.startsWith(window.location.origin)) {
        const url = new URL(referrer);
        sessionStorage.setItem('authRedirect', `${url.pathname}${url.search}` || '/');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentUser = auth.currentUser;
    if (currentUser?.emailVerified) {
      setStep('password');
      setSavedEmail(currentUser.email || savedEmail);
      setSavedName(currentUser.displayName || savedName);
      return;
    }

    if (step === 'verify') {
      const interval = window.setInterval(async () => {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          setSavedEmail(auth.currentUser.email || savedEmail);
          setSavedName(auth.currentUser.displayName || savedName);
          setEmail(auth.currentUser.email || savedEmail);
          setName(auth.currentUser.displayName || savedName);
          setStep('password');
          window.clearInterval(interval);
          toast.success('Email verified. Now create your password.');
        }
      }, 2500);

      return () => window.clearInterval(interval);
    }
  }, [step, savedEmail, savedName]);

  const sendVerificationLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const tempPassword = `Temp@${crypto.randomUUID()}!`;
      const result = await createUserWithEmailAndPassword(auth, email, tempPassword);

      await updateProfile(result.user, { displayName: name });

      const actionCodeSettings = {
        url: `${window.location.origin}/auth/register?verified=1`,
        handleCodeInApp: true,
      };

      sessionStorage.setItem('authRedirect', redirectTo);

      setSavedEmail(email);
      setSavedName(name);
      await sendEmailVerification(result.user, actionCodeSettings);
      setStep('verify');
      toast.success('Verification email sent. Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
    setLoading(false);
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please enter and confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (!auth.currentUser) {
        throw new Error('No signed-in user found after email verification');
      }

      await updatePassword(auth.currentUser, password);

      await updateProfile(auth.currentUser, { displayName: savedName || name });

      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        name: savedName || name,
        email: savedEmail || email,
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        phone: '',
        addresses: [],
      }, { merge: true });

      sessionStorage.removeItem('authRedirect');
      toast.success('Account created successfully!');
      router.push(redirectTo);
    } catch (error: any) {
      toast.error(error.message || 'Failed to set password');
    }
    setLoading(false);
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <div className="w-full max-w-lg glass rounded-2xl p-8 border border-white/10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
            <span className="text-white font-bold text-3xl">NV</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Verify Your Email</h1>
          <p className="text-gray-400 mb-6">
            We sent a verification link to <span className="text-white font-semibold">{savedEmail || email}</span>. Please check your inbox and verify your email to continue.
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
            <span>Waiting for verification...</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'password') {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <div className="w-full max-w-lg glass rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
              <span className="text-white font-bold text-3xl">NV</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Password</h1>
            <p className="text-gray-400 text-sm">{savedEmail || email}</p>
          </div>

          <form onSubmit={handleCreatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-black font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-green-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Saving password...' : 'Create Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
              <span className="text-white font-bold text-3xl">NV</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">NVA Nutrition</h1>
            <p className="text-gray-400 text-sm">Join the hustle. Build your strength.</p>
          </div>

          <form onSubmit={sendVerificationLink} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-black font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-green-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Sending verification link...' : 'Verify Email'}
            </button>
          </form>

          <p className="text-center text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-400 font-semibold hover:text-green-300">
              Sign in
            </Link>
          </p>
        </div>

        <div className="text-center mt-8 text-sm text-gray-400">
          <p>Need help? Call us at <span className="font-semibold text-white">+91 95087 16607</span></p>
        </div>
      </motion.div>
    </div>
  );
}
