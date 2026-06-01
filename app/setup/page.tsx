'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminSetupPage() {
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.displayName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Create user in Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: formData.displayName,
      });

      // Get ID token for backend call
      const idToken = await user.getIdToken();

      // Create user document in Firestore via backend API
      try {
        const response = await fetch('/api/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            email: formData.email,
            displayName: formData.displayName,
            idToken,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success('Admin account created! User document created in Firestore.');
        } else {
          console.warn('Firestore document creation warning:', result.message);
          toast.success('User created! Please set role in Firebase Console.');
        }
      } catch (apiError) {
        console.error('API call error:', apiError);
        toast.success('User created! Please set role in Firebase Console.');
      }

      setAdminData({
        uid: user.uid,
        email: formData.email,
        displayName: formData.displayName,
      });

      setStep('success');
    } catch (error: any) {
      console.error('Admin setup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use');
      } else {
        toast.error(error.message || 'Failed to create admin account');
      }
    }
    setLoading(false);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <div className="glass rounded-2xl p-8 border border-white/10 text-center">
            <CheckCircle2 size={64} className="mx-auto text-green-400 mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Setup Complete!</h1>
            <p className="text-gray-400 mb-6">Your admin account has been created successfully.</p>

            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left border border-white/10">
              <p className="text-gray-400 text-sm mb-1">Admin Email</p>
              <p className="text-white font-mono text-lg">{adminData?.email}</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-white font-semibold mb-2">Final Step: Set Admin Role</p>
                  <p className="text-gray-400 text-sm mb-3">
                    Your user document has been created automatically. Now set the role to "admin" in Firebase Console:
                  </p>
                  <ol className="text-gray-400 text-sm list-decimal list-inside space-y-1 mb-3">
                    <li>Go to <span className="text-blue-400">Firebase Console → Firestore Database</span></li>
                    <li>Find the <span className="text-blue-400">users collection</span></li>
                    <li>Open the document with ID: <span className="text-white font-mono">{adminData?.uid?.slice(0, 8)}...</span></li>
                    <li>Edit or add a field: <span className="text-white font-mono">role: "admin"</span> (string type)</li>
                    <li>Click Save</li>
                  </ol>
                  <a
                    href="https://console.firebase.google.com/u/0/project/techyanza-69/firestore/databases/-default-/data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm inline-block"
                  >
                    → Open Firebase Console
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black py-3 rounded-lg font-bold transition"
              >
                Go to Login
              </Link>
              <Link
                href="/admin"
                className="block w-full border-2 border-green-500/30 hover:bg-green-500/5 text-green-400 py-3 rounded-lg font-bold transition"
              >
                Try Admin Panel
              </Link>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              Once you set the role to "admin", you can log in and access the admin panel.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="glass rounded-2xl p-8 border border-white/10">
            <h1 className="text-3xl font-bold text-white mb-2">Create Admin Account</h1>
            <p className="text-gray-400 mb-6">Fill in the details below to create your admin account.</p>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Admin Name"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="flex-1 border-2 border-white/10 hover:bg-white/5 text-white py-2 rounded-lg font-bold transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-black py-2 rounded-lg font-bold transition disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="glass rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
              <span className="text-white font-bold text-3xl">NV</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Setup</h1>
            <p className="text-gray-400">Create your first admin account to access the admin panel</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30">
                <span className="text-green-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Create Admin Account</h3>
                <p className="text-gray-400 text-sm">Fill in your details to create an admin account</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30">
                <span className="text-green-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Access Admin Panel</h3>
                <p className="text-gray-400 text-sm">Log in and navigate to /admin to manage your store</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30">
                <span className="text-green-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Manage Everything</h3>
                <p className="text-gray-400 text-sm">Products, orders, customers, and more</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold mb-1">Important</p>
                <p className="text-gray-400 text-sm">
                  This will create a new admin user. Make sure to save your credentials securely.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('form')}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
          >
            Create Admin Account
            <ArrowRight size={20} />
          </button>

          <p className="text-gray-500 text-sm text-center mt-4">
            Already have admin access?{' '}
            <Link href="/auth/login" className="text-green-400 hover:text-green-300">
              Go to Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
