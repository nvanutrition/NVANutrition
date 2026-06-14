'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  CheckCircle,
  ArrowRight,
  ShoppingCart,
  Truck,
  Lock,
  FileText,
  ArrowLeft,
  CreditCard,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { evaluateOffers, AppliedOfferResult } from '@/lib/offers-engine';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

const steps = [
  { label: 'Shipping', icon: Truck },
  { label: 'Payment', icon: Lock },
  { label: 'Confirmation', icon: CheckCircle },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(1); // 1 = Shipping, 2 = Payment, 3 = Confirmation
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || prev.fullName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'cashfree'>('cod');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPaymentFailed, setShowPaymentFailed] = useState(false);
  const [paymentFailReason, setPaymentFailReason] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  // Cashfree return URL parameter handling
  const verificationAttemptedRef = useRef(false);
  
  const [appliedOffers, setAppliedOffers] = useState<AppliedOfferResult[]>([]);

  const totalPrice = getTotalPrice();

  useEffect(() => {
    (async () => {
      const results = await evaluateOffers(items, totalPrice);
      setAppliedOffers(results);
    })();
  }, [items, totalPrice]);

  const discountAmount = appliedOffers.reduce((sum, offer) => sum + offer.discountAmount, 0);
  const freeGifts = appliedOffers.flatMap(offer => offer.freeProducts);

  const finalTotal = Math.max(0, totalPrice - discountAmount);

  // ─── Handle Cashfree return redirect ───────────────────────────────────────
  useEffect(() => {
    const cfOrderId = searchParams.get('cf_order_id');
    const orderToken = searchParams.get('order_token');

    if (!cfOrderId || verificationAttemptedRef.current) return;
    verificationAttemptedRef.current = true;

    // Move to payment step while verifying
    setCurrentStep(2);
    setPaymentMethod('cashfree');
    setIsLoading(true);

    (async () => {
      try {
        const res = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cf_order_id: cfOrderId }),
        });
        const data = await res.json();

        if (data.success && data.status === 'PAID') {
          // Payment succeeded — place order as Paid
          // We need to recover saved form data from session storage
          const savedForm = sessionStorage.getItem('checkout_form');
          if (savedForm) {
            const parsed = JSON.parse(savedForm);
            setFormData(parsed);
          }
          await placeOrderInternal('Cashfree', 'Paid');
        } else {
          // Payment failed or cancelled
          setIsLoading(false);
          setPaymentFailReason(data.message || `Payment ${data.status || 'failed'}. Please try again.`);
          setShowPaymentFailed(true);
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setIsLoading(false);
        setPaymentFailReason('Payment verification failed. Please contact support if amount was deducted.');
        setShowPaymentFailed(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCheckoutEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Enter your email and password');
      return;
    }
    setAuthLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);

      if (!result.user.emailVerified) {
        toast.error('Please verify your email before checking out.');
        setAuthLoading(false);
        return;
      }

      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName || '',
        role: 'customer',
        updatedAt: new Date(),
      }, { merge: true });

      toast.success('Signed in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
    setAuthLoading(false);
  };

  const handleCheckoutGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName || '',
        role: 'customer',
        emailVerified: true,
        updatedAt: new Date(),
      }, { merge: true });
      toast.success('Signed in with Google');
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
    }
    setAuthLoading(false);
  };

  if (items.length === 0 && !showSuccess && !showPaymentFailed) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-background pt-20 flex items-center">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 border border-gray-200 rounded-3xl p-12 shadow-2xl"
            >
              <ShoppingCart size={64} className="mx-auto mb-6 text-green-500" />
              <h1 className="text-4xl font-extrabold text-foreground mb-4">Your Cart is Empty</h1>
              <p className="text-gray-500 mb-8 text-lg">Please add products before checking out.</p>
              <button
                onClick={() => router.push('/products')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold transition shadow-[0_8px_20px_rgba(0,200,83,0.25)] hover:shadow-[0_12px_24px_rgba(0,200,83,0.35)]"
              >
                Continue Shopping
              </button>
            </motion.div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-background pt-24 pb-16 text-foreground">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 shadow-2xl">
              <h1 className="text-4xl font-extrabold mb-3">Sign in to continue checkout</h1>
              <p className="text-gray-500 mb-8">You can add items to cart without logging in. Sign in only when you are ready to checkout.</p>

              <form onSubmit={handleCheckoutEmailLogin} className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-foreground placeholder-gray-400 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-foreground placeholder-gray-400 focus:outline-none focus:border-green-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold py-3 rounded-xl disabled:opacity-50 shadow-[0_8px_20px_rgba(0,200,83,0.25)] hover:shadow-[0_12px_24px_rgba(0,200,83,0.35)] transition"
                >
                  {authLoading ? 'Signing in...' : 'Sign in with Email'}
                </button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-background px-3 text-gray-500 text-sm">or</span></div>
              </div>

              <button
                onClick={handleCheckoutGoogleLogin}
                disabled={authLoading}
                className="w-full border border-border hover:bg-muted rounded-xl py-3 font-semibold text-foreground disabled:opacity-50"
              >
                Continue with Google
              </button>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    sessionStorage.setItem('authRedirect', '/checkout');
                    router.push('/auth/register');
                  }}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 rounded-xl py-3 font-semibold text-foreground"
                >
                  Create Account
                </button>
                <button
                  onClick={() => router.push('/products')}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 rounded-xl py-3 font-semibold text-foreground"
                >
                  Keep Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Handle step 1 submission (Shipping Form -> Payment Step)
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.phone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    // Save form data in session for recovery after Cashfree redirect
    sessionStorage.setItem('checkout_form', JSON.stringify(formData));
    setCurrentStep(2);
  };

  // Generate NVA-XXXXX-XXXXX order ID
  const generateOrderId = () => {
    const chars = '0123456789';
    const rand5 = () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `NVA-${rand5()}-${rand5()}`;
  };

  // Internal placeOrder — accepts current form data snapshot
  const placeOrderInternal = async (
    pMethod: 'COD' | 'Cashfree',
    finalPaymentStatus: 'Pending' | 'Paid',
    formSnapshot?: FormData
  ) => {
    setIsLoading(true);
    const orderNum = generateOrderId();
    setOrderNumber(orderNum);

    const fd = formSnapshot || formData;

    const orderPayload = {
      orderId: orderNum,
      customerName: fd.fullName,
      email: fd.email,
      phone: fd.phone,
      address: {
        address: fd.address,
        city: fd.city,
        state: fd.state,
        pinCode: fd.pincode,
        alternatePhone: fd.alternatePhone || '',
      },
      notes: fd.notes,
      paymentMethod: pMethod === 'COD' ? 'COD' : 'Online',
      items: [
        ...items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          originalPrice: (item as any).originalPrice || item.price,
          quantity: item.quantity,
          flavor: item.flavor || '',
          unit: (item as any).unit || '',
          image: (item as any).image || '',
          sku: item.id,
          isPromo: false,
        })),
        ...freeGifts.map(gift => ({
          id: gift.sku,
          name: gift.name,
          price: 0,
          quantity: gift.quantity,
          flavor: '',
          unit: '',
          image: '',
          isPromo: true,
        }))
      ],
      totalAmount: finalTotal,
      discountAmount: discountAmount,
      paymentStatus: finalPaymentStatus,
      orderStatus: 'Pending',
    };

    try {
      // 1. Write order to Firestore
      await setDoc(doc(db, 'orders', orderNum), {
        ...orderPayload,
        userId: user?.uid || 'guest',
        status: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. Send confirmation email
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderNum,
            customerName: fd.fullName,
            email: fd.email,
            phone: fd.phone,
            address: orderPayload.address,
            items: orderPayload.items,
            totalAmount: finalTotal,
            discountAmount: discountAmount,
            paymentMethod: pMethod === 'COD' ? 'COD' : 'Online',
          })
        });
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
      }

      // 3. Decrement stock for each purchased item in Firestore
      for (const item of items) {
        try {
          const productRef = doc(db, 'products', item.id);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentStock = productSnap.data().stock || 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            await updateDoc(productRef, { stock: newStock });
            console.log(`[Stock] Updated ${item.name}: ${currentStock} → ${newStock}`);
          }
        } catch (stockErr) {
          console.error(`[Stock] Failed to decrement for item ${item.id}:`, stockErr);
        }
      }

      // 4. Send order details to Google Sheets (if configured)
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      // 5. Clear saved form + cart, show success
      sessionStorage.removeItem('checkout_form');
      toast.success(pMethod === 'COD' ? 'Order placed successfully!' : 'Payment received & order confirmed!');
      setShowSuccess(true);
      setCurrentStep(3);
      clearCart();
    } catch (err) {
      console.error('Order placement error:', err);
      toast.error('Failed to submit order. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapper for use in event handlers (uses current formData state)
  const placeOrder = (pMethod: 'COD' | 'Cashfree', finalPaymentStatus: 'Pending' | 'Paid') => {
    return placeOrderInternal(pMethod, finalPaymentStatus);
  };

  // ─── Handle Cashfree Online Payment ────────────────────────────────────────
  const handleCashfreePayment = async () => {
    setIsLoading(true);
    
    // Save form data before redirect
    sessionStorage.setItem('checkout_form', JSON.stringify(formData));

    try {
      const tempOrderId = `NVA-CF-${Date.now()}`;

      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
          orderId: tempOrderId,
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone || '9999999999',
        }),
      });

      const data = await res.json();

      if (!data.success || !data.payment_session_id) {
        toast.error(data.error || 'Payment initialization failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Load Cashfree JS SDK dynamically
      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfreeEnv = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
      const cashfree = await load({ mode: cashfreeEnv as 'production' | 'sandbox' });

      // Open Cashfree checkout
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self', // redirect in same tab
      };

      cashfree.checkout(checkoutOptions);
      // Cashfree will redirect to return_url on completion
    } catch (err: any) {
      console.error('[Cashfree] Checkout error:', err);
      toast.error('Could not open payment gateway. Please try again or use COD.');
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-background min-h-screen text-foreground">
      <Navbar />

      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Step indicators */}
          {!showSuccess && !showPaymentFailed && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="bg-gray-50/60 border border-gray-200 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-around md:justify-center md:gap-24">
                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = idx + 1 === currentStep;
                    const isCompleted = idx + 1 < currentStep;

                    return (
                      <div key={step.label} className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                          isCompleted
                            ? 'bg-green-500 text-black shadow-lg shadow-green-500/10'
                            : isActive
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-black ring-4 ring-green-500/20 shadow-lg shadow-green-500/20'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          <Icon size={18} />
                        </div>
                        <span className={`text-sm font-bold hidden sm:inline ${
                          isActive || isCompleted ? 'text-foreground' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </span>
                        {idx < steps.length - 1 && (
                          <div className={`hidden md:block w-16 h-[2px] transition ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-100'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Steps Display */}
          <AnimatePresence mode="wait">

            {/* ─── PAYMENT FAILED SCREEN ─────────────────────────────────── */}
            {showPaymentFailed ? (
              <motion.div
                key="payment-failed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl mx-auto text-center"
              >
                {/* Failure Icon */}
                <motion.div
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.7, times: [0, 0.5, 1] }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/10 border border-red-500/30 rounded-full">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <XCircle size={60} className="text-red-500" />
                    </motion.div>
                  </div>
                </motion.div>

                <h1 className="text-4xl font-black text-foreground mb-3">Payment Failed</h1>
                <p className="text-lg text-gray-500 mb-4 max-w-lg mx-auto">
                  {paymentFailReason || 'Your payment could not be processed. No amount has been deducted.'}
                </p>

                {/* Info Card */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-8 flex items-start gap-3 text-left">
                  <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">What happened?</p>
                    <p className="text-sm text-gray-500">
                      Your payment was not completed. This could be due to a declined card, cancelled transaction, 
                      or bank timeout. If any amount was deducted, it will be automatically refunded within 5–7 business days.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Retry Online Payment */}
                  <button
                    onClick={() => {
                      setShowPaymentFailed(false);
                      setCurrentStep(2);
                      setPaymentMethod('cashfree');
                      // Restore form if needed
                      const saved = sessionStorage.getItem('checkout_form');
                      if (saved) setFormData(JSON.parse(saved));
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-extrabold py-4 rounded-xl transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={18} />
                    Retry Payment Online
                  </button>

                  {/* Use COD Instead */}
                  <button
                    onClick={() => {
                      setShowPaymentFailed(false);
                      setCurrentStep(2);
                      setPaymentMethod('cod');
                      const saved = sessionStorage.getItem('checkout_form');
                      if (saved) setFormData(JSON.parse(saved));
                    }}
                    className="w-full border-2 border-green-500/50 hover:border-green-500 hover:bg-green-500/5 text-foreground font-bold py-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <DollarSign size={18} className="text-green-500" />
                    Switch to Cash on Delivery (COD)
                  </button>

                  {/* Go back */}
                  <button
                    onClick={() => router.push('/products')}
                    className="w-full border-2 border-gray-200 hover:bg-gray-50 text-gray-500 font-bold py-3 rounded-xl transition cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>

                {/* Support info */}
                <p className="mt-8 text-sm text-gray-500">
                  Need help?{' '}
                  <a href="tel:+919508716607" className="text-green-500 font-bold hover:underline">
                    Call +91 95087 16607
                  </a>
                </p>
              </motion.div>

            ) : showSuccess ? (
              // ─── SUCCESS SCREEN ─────────────────────────────────────────────
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto text-center"
              >
                <motion.div
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.8, times: [0, 0.5, 1] }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-full">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle size={72} className="text-green-500" />
                    </motion.div>
                  </div>
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                  Thank You For Choosing NVA Nutrition
                </h1>
                <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-xl mx-auto">
                  Your Order Has Been Received Successfully.
                </p>

                {/* Details card */}
                <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 shadow-2xl mb-8 text-left">
                  <div className="border-b border-gray-200 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Order Number</p>
                      <p className="text-3xl font-black text-green-500 font-mono">{orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Payment Status</p>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold ${
                        paymentMethod === 'cashfree'
                          ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                          : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                      }`}>
                        {paymentMethod === 'cashfree' ? '✓ Paid Online' : 'Cash On Delivery'}
                      </span>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Subtotal</p>
                      <p className="text-lg font-bold text-foreground">₹{totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Paid</p>
                      <p className="text-lg font-black text-green-500">₹{finalTotal.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Delivery summary */}
                  <div className="space-y-3 mb-8 bg-white p-6 rounded-2xl border border-gray-200">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Truck size={16} className="text-green-500" /> Shipping & Delivery Information
                    </h4>
                    <p className="text-sm text-gray-500"><span className="font-semibold text-foreground">Recipient:</span> {formData.fullName}</p>
                    <p className="text-sm text-gray-500"><span className="font-semibold text-foreground">Address:</span> {formData.address}, {formData.city}, {formData.state} - {formData.pincode}</p>
                    <p className="text-sm text-gray-500"><span className="font-semibold text-foreground">Phone:</span> {formData.phone}</p>
                  </div>

                  {/* Next steps info */}
                  <div className="flex gap-4 items-start bg-white/40 p-6 rounded-2xl border border-gray-200/60">
                    <FileText className="text-green-500 flex-shrink-0" size={24} />
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-1.5">What Happens Next?</h4>
                      <ul className="text-sm text-gray-500 space-y-2 list-disc pl-4 font-medium">
                        <li>A confirmation email has been dispatched to <span className="text-green-400 font-bold">{formData.email}</span>.</li>
                        <li>Your package will be packaged and shipped within 24-48 business hours.</li>
                        <li>Live tracking details will be sent via SMS once dispatched.</li>
                        <li>For direct queries: Contact customer support at <span className="text-green-400 font-bold">+91 95087 16607</span>.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Back to home / shop */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/products')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-foreground font-extrabold px-8 py-4 rounded-xl transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Continue Shopping
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="border-2 border-gray-200 hover:border-gray-300 text-foreground font-bold px-8 py-4 rounded-xl transition hover:bg-gray-50 cursor-pointer"
                  >
                    Back to Home
                  </button>
                </div>
              </motion.div>

            ) : currentStep === 1 ? (
              // ─── STEP 1: SHIPPING FORM ───────────────────────────────────────
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-2xl font-black text-foreground mb-8 flex items-center gap-3">
                      <Truck className="text-green-500" size={24} />
                      Shipping Address
                    </h2>

                    <form onSubmit={handleProceedToPayment} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="John Doe"
                            className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded-xl px-4 py-3.5 text-foreground placeholder-gray-400 focus:outline-none transition font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                            className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded-xl px-4 py-3.5 text-foreground placeholder-gray-400 focus:outline-none transition font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g,'').slice(0,10) })}
                            placeholder="98765 43210"
                            maxLength={10}
                            className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded-xl px-4 py-3.5 text-foreground placeholder-gray-400 focus:outline-none transition font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Alternate Phone <span className="text-gray-600 normal-case font-medium">(Optional)</span></label>
                          <input
                            type="tel"
                            value={formData.alternatePhone}
                            onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value.replace(/\D/g,'').slice(0,10) })}
                            placeholder="Another number"
                            maxLength={10}
                            className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded-xl px-4 py-3.5 text-foreground placeholder-gray-400 focus:outline-none transition font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Pincode / Zip Code *</label>
                          <input
                            type="text"
                            required
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            placeholder="400001"
                            className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded-xl px-4 py-3.5 text-foreground placeholder-gray-400 focus:outline-none transition font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Delivery Address *</label>
                        <textarea
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Flat/House No., Building Name, Street Address"
                          rows={3}
                          className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded-xl px-4 py-3.5 text-foreground placeholder-gray-400 focus:outline-none transition font-semibold resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">City *</label>
                          <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Mumbai"
                            className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded-xl px-4 py-3.5 text-foreground placeholder-gray-400 focus:outline-none transition font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">State *</label>
                          <input
                            type="text"
                            required
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="Maharashtra"
                            className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded-xl px-4 py-3.5 text-foreground placeholder-gray-400 focus:outline-none transition font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Order Notes (Optional)</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Special instructions (e.g. Ring doorbell, leave at gate)"
                          rows={2}
                          className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-green-500 rounded-xl px-4 py-3.5 text-foreground placeholder-gray-400 focus:outline-none transition font-semibold resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-extrabold py-4 rounded-xl transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Proceed to Payment
                        <ArrowRight size={18} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Order summary column */}
                <div className="lg:col-span-1">
                  <OrderSummaryCard totalPrice={totalPrice} finalTotal={finalTotal} items={items} freeGifts={freeGifts} discountAmount={discountAmount} />
                </div>
              </motion.div>

            ) : (
              // ─── STEP 2: PAYMENT METHOD ──────────────────────────────────────
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500 hover:text-foreground"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                        <Lock className="text-green-500" size={24} />
                        Choose Payment Method
                      </h2>
                    </div>

                    <div className="space-y-4 mb-8">
                      {/* COD Option */}
                      <div
                        onClick={() => setPaymentMethod('cod')}
                        className={`border-2 rounded-2xl p-6 flex items-start gap-4 transition cursor-pointer select-none ${
                          paymentMethod === 'cod'
                            ? 'border-green-500 bg-green-500/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white/20'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0 ${
                          paymentMethod === 'cod' ? 'border-green-500' : 'border-gray-500'
                        }`}>
                          {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-foreground flex items-center gap-2">
                            <DollarSign size={18} className="text-green-500" /> Cash on Delivery (COD)
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 font-medium">Pay securely in cash or via mobile UPI at the time of package delivery.</p>
                        </div>
                      </div>

                      {/* Cashfree Online Payment Option */}
                      <div
                        onClick={() => setPaymentMethod('cashfree')}
                        className={`border-2 rounded-2xl p-6 flex items-start gap-4 transition cursor-pointer select-none ${
                          paymentMethod === 'cashfree'
                            ? 'border-green-500 bg-green-500/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white/20'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0 ${
                          paymentMethod === 'cashfree' ? 'border-green-500' : 'border-gray-500'
                        }`}>
                          {paymentMethod === 'cashfree' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-extrabold text-foreground flex items-center gap-2 flex-wrap">
                            <CreditCard size={18} className="text-green-500" /> Online Payment — Powered by Cashfree
                            <span className="text-[10px] font-black bg-green-500/15 border border-green-500/30 text-green-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Secure</span>
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 font-medium">
                            Pay via Credit/Debit Card, Net Banking, UPI, Wallets & more. Fully encrypted & PCI-DSS compliant.
                          </p>
                          {/* Payment logos */}
                          <div className="mt-3 flex items-center gap-3 flex-wrap">
                            {['UPI', 'Visa', 'Mastercard', 'Rupay', 'Netbanking'].map((logo) => (
                              <span key={logo} className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-1 rounded-lg text-gray-600 shadow-sm">
                                {logo}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      {paymentMethod === 'cod' ? (
                        <button
                          id="btn-place-order-cod"
                          onClick={() => placeOrder('COD', 'Pending')}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-extrabold py-4 rounded-xl transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer text-base disabled:opacity-60"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                              Placing Order...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              Confirm & Place Order (COD)
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          id="btn-pay-cashfree"
                          onClick={handleCashfreePayment}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-extrabold py-4 rounded-xl transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer text-base disabled:opacity-60"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                              Initializing Payment...
                            </>
                          ) : (
                            <>
                              <Lock size={18} />
                              Pay ₹{finalTotal.toLocaleString()} Securely
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setCurrentStep(1)}
                        className="w-full border-2 border-gray-200 hover:bg-gray-50 text-foreground font-bold py-3.5 rounded-xl transition cursor-pointer"
                      >
                        Back to Shipping
                      </button>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-500 font-semibold">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span>256-bit SSL Encrypted • PCI-DSS Compliant • Your data is safe</span>
                    </div>
                  </div>
                </div>

                {/* Order summary column */}
                <div className="lg:col-span-1">
                  <OrderSummaryCard totalPrice={totalPrice} finalTotal={finalTotal} items={items} freeGifts={freeGifts} discountAmount={discountAmount} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </main>
  );
}

// Sub-component for Order Summary Card
function OrderSummaryCard({ totalPrice, finalTotal, items, freeGifts, discountAmount }: { totalPrice: number, finalTotal: number, items: any[], freeGifts: any[], discountAmount: number }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-xl sticky top-28 space-y-6">
      <h3 className="text-xl font-black text-foreground flex items-center gap-2">
        <ShoppingCart className="text-green-500" size={20} />
        Order Summary
      </h3>

      {/* Items list */}
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 bg-white/60 p-4 rounded-2xl border border-gray-200">
        {items.map((item, idx) => (
          <div key={`${item.id}-${item.flavor}`} className="flex justify-between items-start gap-4">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-foreground truncate">{item.name}</h4>
              {item.flavor && <p className="text-[10px] text-gray-500 font-semibold">{item.flavor}</p>}
              <p className="text-[10px] text-gray-500 mt-1">Qty: {item.quantity}</p>
            </div>
            <p className="text-xs font-bold text-green-500">₹{(item.price * item.quantity).toLocaleString()}</p>
          </div>
        ))}
        {freeGifts.map((gift, idx) => (
          <div key={`gift-${gift.sku}-${idx}`} className="flex justify-between items-start gap-4 p-2 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              <Image src={gift.image} alt={gift.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[8px] font-black tracking-widest uppercase bg-green-500 text-foreground px-1.5 py-0.5 rounded mb-1">
                Free Gift
              </span>
              <h4 className="text-xs font-bold text-foreground truncate">{gift.name}</h4>
              <p className="text-[10px] text-gray-500 mt-1">Qty: {gift.quantity}</p>
            </div>
            <p className="text-xs font-black text-green-500 uppercase">Free</p>
          </div>
        ))}
      </div>

      {/* Math summary */}
      <div className="border-t border-gray-200 pt-4 space-y-3.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">Subtotal</span>
          <span className="font-bold text-foreground">₹{totalPrice.toLocaleString()}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Promo Discount</span>
            <span className="font-bold text-green-500">-₹{discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500 font-medium">Shipping</span>
          <span className="font-extrabold text-green-500 bg-green-500/10 px-2.5 py-0.5 rounded-lg text-xs border border-green-500/20">Free</span>
        </div>

        <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
          <span className="text-base font-bold text-foreground">Grand Total</span>
          <span className="text-xl font-black text-green-500 font-mono">₹{finalTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Secure footer */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-center gap-2">
        <Lock size={14} className="text-green-500" />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Secured by 256-bit SSL connection</span>
      </div>
    </div>
  );
}
