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
import { motion, AnimatePresence } from 'framer-motion';
import { setDoc, doc } from 'firebase/firestore';
import { User, Mail, Lock, CheckCircle, ArrowRight, Zap } from 'lucide-react';

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
    if (!name || !email) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const tempPassword = `Temp@${crypto.randomUUID()}!`;
      const result = await createUserWithEmailAndPassword(auth, email, tempPassword);
      await updateProfile(result.user, { displayName: name });
      const actionCodeSettings = { url: `${window.location.origin}/auth/register?verified=1`, handleCodeInApp: true };
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
    if (!password || !confirmPassword) { toast.error('Please enter and confirm your password'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      if (!auth.currentUser) throw new Error('No signed-in user found after email verification');
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

  const stepContent = {
    request: { num: 1, title: 'Create Account', sub: 'Join the NVA family today.' },
    verify: { num: 2, title: 'Verify Email', sub: 'Check your inbox.' },
    password: { num: 3, title: 'Set Password', sub: 'Almost done!' },
  };

  const current = stepContent[step];

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-700 to-green-900 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-2xl">
            <span className="font-black text-3xl text-white">NV</span>
          </div>
          <h1 className="text-4xl font-black mb-4">NVA Nutrition</h1>
          <p className="text-green-200 text-xl font-semibold mb-8">Join the Hustle.<br/>Build Your Strength.</p>
          {/* Step Progress */}
          <div className="flex items-center gap-3 justify-center mt-10">
            {['request', 'verify', 'password'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition ${
                  step === s ? 'bg-white text-green-700 border-white' :
                  (i < ['request','verify','password'].indexOf(step) ? 'bg-white/30 border-white/50 text-white' : 'border-white/30 text-white/50')
                }`}>{i + 1}</div>
                {i < 2 && <div className={`w-8 h-[2px] rounded ${i < ['request','verify','password'].indexOf(step) ? 'bg-white/50' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-gray-100 p-8">
            <div className="mb-8">
              <span className="inline-block text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">Step {current.num} of 3</span>
              <h2 className="text-3xl font-black text-gray-900 mb-2">{current.title}</h2>
              <p className="text-gray-500 text-sm">{current.sub}</p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'request' && (
                <motion.form key="request" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={sendVerificationLink} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition text-sm" />
                    </div>
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgba(0,200,83,0.3)] hover:shadow-[0_12px_30px_rgba(0,200,83,0.4)] transition flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? 'Sending link...' : <><span>Send Verification Email</span><ArrowRight size={16} /></>}
                  </motion.button>
                </motion.form>
              )}

              {step === 'verify' && (
                <motion.div key="verify" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                  <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail size={32} className="text-green-600" />
                  </div>
                  <p className="text-gray-600 mb-2">We sent a link to</p>
                  <p className="text-gray-900 font-bold text-lg mb-6">{savedEmail || email}</p>
                  <div className="flex items-center justify-center gap-3 text-green-600 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
                    <span className="text-sm font-semibold">Waiting for verification...</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">Check your spam folder if you don&apos;t see it.</p>
                </motion.div>
              )}

              {step === 'password' && (
                <motion.form key="password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleCreatePassword} className="space-y-5">
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                    <span className="text-green-700 text-sm font-semibold">{savedEmail || email} — Verified!</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none transition text-sm" />
                    </div>
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgba(0,200,83,0.3)] hover:shadow-[0_12px_30px_rgba(0,200,83,0.4)] transition flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight size={16} /></>}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-center mt-6 text-gray-500 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-green-600 font-bold hover:text-green-700">Sign in →</Link>
            </p>
          </div>

          <p className="text-center mt-6 text-xs text-gray-400">
            Need help? <span className="font-semibold text-gray-600">+91 95087 16607</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
