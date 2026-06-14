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
import { setDoc, doc, getDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
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
  ShieldCheck,
  XCircle,
  RefreshCw,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  ClipboardList
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
  { id: 1, label: 'Shipping Details', icon: Truck },
  { id: 2, label: 'Secure Payment', icon: Lock },
  { id: 3, label: 'Order Confirmed', icon: CheckCircle },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
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

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'cashfree'>('cashfree');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPaymentFailed, setShowPaymentFailed] = useState(false);
  const [paymentFailReason, setPaymentFailReason] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

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

  // Generate NVA-XXXXX-XXXXX order ID
  const generateOrderId = () => {
    const chars = '0123456789';
    const rand5 = () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `NVA-${rand5()}-${rand5()}`;
  };

  // Internal placeOrder
  const placeOrderInternal = async (
    pMethod: 'COD' | 'Cashfree',
    finalPaymentStatus: 'Pending' | 'Paid',
    formSnapshot?: FormData,
    cfOrderId?: string
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
      ...(cfOrderId ? { cfOrderId } : {}),
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

      // 3. Decrement stock for each purchased item (including free gifts) safely using increment
      for (const item of orderPayload.items) {
        try {
          const skuToSearch = item.sku || item.id;
          if (!skuToSearch) continue;
          
          const q = query(collection(db, 'products'), where('sku', '==', skuToSearch));
          const snap = await getDocs(q);
          let productRef;
          
          if (!snap.empty) {
            productRef = doc(db, 'products', snap.docs[0].id);
          } else {
            // Fallback in case item.id is actually the document ID
            productRef = doc(db, 'products', item.id);
          }
          
          // Auto decrease stock
          await updateDoc(productRef, { stock: increment(-item.quantity) });
        } catch (stockErr) {
          console.error(`[Stock] Failed to decrement for item ${item.id}:`, stockErr);
        }
      }

      // 4. Send order details to Google Sheets
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      // 5. Success
      sessionStorage.removeItem('checkout_form');
      setShowSuccess(true);
      setCurrentStep(3);
      clearCart();
    } catch (err) {
      console.error('Order placement error:', err);
      toast.error('Failed to submit order. Please check connection.');
      setIsLoading(false);
    }
  };

  const placeOrder = (pMethod: 'COD' | 'Cashfree', finalPaymentStatus: 'Pending' | 'Paid') => {
    return placeOrderInternal(pMethod, finalPaymentStatus);
  };

  // Handle Cashfree return
  useEffect(() => {
    const cfOrderId = searchParams.get('cf_order_id');
    if (!cfOrderId || verificationAttemptedRef.current) return;
    verificationAttemptedRef.current = true;

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
          const savedForm = sessionStorage.getItem('checkout_form');
          if (savedForm) {
            setFormData(JSON.parse(savedForm));
          }
          await placeOrderInternal('Cashfree', 'Paid', undefined, cfOrderId);
        } else {
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
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google');
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
    }
    setAuthLoading(false);
  };

  if (items.length === 0 && !showSuccess && !showPaymentFailed) {
    return (
      <main className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-100 rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center max-w-md w-full mx-4"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart size={32} className="text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Your Cart is Empty</h1>
            <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <button
              onClick={() => router.push('/products')}
              className="w-full bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              Start Shopping <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="max-w-[480px] mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout Details</h1>
                <p className="text-sm text-gray-500">Please sign in or create an account to securely checkout and track your order.</p>
              </div>

              <form onSubmit={handleCheckoutEmailLogin} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3.5 rounded-xl transition mt-2 disabled:opacity-50"
                >
                  {authLoading ? 'Signing in...' : 'Sign In Securely'}
                </button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Or continue with</span></div>
              </div>

              <button
                onClick={handleCheckoutGoogleLogin}
                disabled={authLoading}
                className="w-full bg-white border border-gray-200 hover:bg-gray-50 rounded-xl py-3.5 font-medium text-gray-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Image src="/google-logo.svg" alt="Google" width={20} height={20} className="w-5 h-5" />
                Google
              </button>

              <p className="text-center text-sm text-gray-500 mt-8">
                New to NVA Nutrition?{' '}
                <button 
                  onClick={() => {
                    sessionStorage.setItem('authRedirect', '/checkout');
                    router.push('/auth/register');
                  }}
                  className="text-black font-semibold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </motion.div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

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
    sessionStorage.setItem('checkout_form', JSON.stringify(formData));
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCashfreePayment = async () => {
    setIsLoading(true);
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

      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfreeEnv = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
      const cashfree = await load({ mode: cashfreeEnv as 'production' | 'sandbox' });

      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      });
    } catch (err: any) {
      console.error('[Cashfree] Checkout error:', err);
      toast.error('Could not open payment gateway. Please try again or use COD.');
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-[#fcfcfc] min-h-screen text-gray-900 selection:bg-green-100">
      <Navbar />

      <div className="pt-28 pb-20">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          
          {/* Header Step indicators */}
          {!showSuccess && !showPaymentFailed && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <div className="flex items-center justify-center max-w-2xl mx-auto">
                {steps.map((step, idx) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = step.id < currentStep;
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                          isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 
                          isActive ? 'bg-black text-white ring-4 ring-black/5 shadow-lg' : 
                          'bg-white border-2 border-gray-200 text-gray-400'
                        }`}>
                          <step.icon size={18} />
                        </div>
                        <span className={`absolute top-12 text-xs font-semibold whitespace-nowrap hidden sm:block ${
                          isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-16 sm:w-24 h-[2px] mx-2 sm:mx-4 transition-colors duration-300 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {showPaymentFailed ? (
              // ─── PAYMENT FAILED SCREEN ───────────────────────────────────
              <motion.div
                key="payment-failed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-xl mx-auto mt-8"
              >
                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-red-50 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500" />
                  
                  <motion.div animate={{ scale: [0, 1.1, 1] }} className="mb-6">
                    <div className="inline-flex w-20 h-20 bg-red-50 text-red-500 rounded-full items-center justify-center mb-2">
                      <XCircle size={40} />
                    </div>
                  </motion.div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Unsuccessful</h1>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    {paymentFailReason || 'We could not process your payment at this time. Don\'t worry, no amount was deducted from your account.'}
                  </p>

                  <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left flex gap-4 border border-gray-100">
                    <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">What happened?</h4>
                      <p className="text-sm text-gray-500">
                        This usually happens due to a network timeout, declined card, or an interrupted session. 
                        If your account was charged, it will be automatically refunded within 5-7 business days.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowPaymentFailed(false);
                        setCurrentStep(2);
                        setPaymentMethod('cashfree');
                      }}
                      className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} /> Retry Payment
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentFailed(false);
                        setCurrentStep(2);
                        setPaymentMethod('cod');
                      }}
                      className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-medium py-4 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <DollarSign size={18} className="text-gray-400" /> Switch to Cash on Delivery
                    </button>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Phone size={14} /> Need support? Call <a href="tel:+919508716607" className="font-medium text-black">095087 16607</a>
                    </p>
                  </div>
                </div>
              </motion.div>

            ) : showSuccess ? (
              // ─── SUCCESS SCREEN ─────────────────────────────────────────────
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto mt-4"
              >
                <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden relative">
                  {/* Decorative background header */}
                  <div className="h-32 bg-gradient-to-br from-green-500 to-emerald-600 relative flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                      className="absolute -bottom-10"
                    >
                      <div className="bg-white p-2 rounded-full shadow-xl">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white">
                          <CheckCircle size={32} />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="pt-16 px-8 pb-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-500 mb-10">Thank you for your purchase. Your order has been placed successfully.</p>

                    <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left">
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                          <ClipboardList size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Order No.</span>
                        </div>
                        <p className="text-lg font-mono font-bold text-gray-900">{orderNumber}</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                          <CreditCard size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Amount Paid</span>
                        </div>
                        <div className="flex items-end gap-2">
                          <p className="text-lg font-bold text-green-600">₹{finalTotal.toLocaleString()}</p>
                          <span className="text-xs font-medium text-gray-500 mb-0.5 px-2 py-0.5 bg-gray-200 rounded-md">
                            {paymentMethod === 'cashfree' ? 'Online' : 'COD'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 text-left shadow-sm mb-10">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                        <MapPin size={18} className="text-gray-400" /> Delivery Details
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-y-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Recipient</p>
                          <p className="font-medium text-gray-900">{formData.fullName}</p>
                          <p className="text-gray-500 mt-0.5">{formData.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Address</p>
                          <p className="font-medium text-gray-900 leading-relaxed">
                            {formData.address}<br/>
                            {formData.city}, {formData.state} {formData.pincode}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button onClick={() => router.push('/products')} className="bg-black hover:bg-gray-800 text-white font-medium px-8 py-3.5 rounded-xl transition shadow-lg shadow-black/10">
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

            ) : (
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                {/* Left Column: Forms */}
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        <form onSubmit={handleProceedToPayment} className="space-y-8">
                          
                          {/* Contact Info Card */}
                          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                              <User className="text-gray-400" size={20} /> Contact Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <User size={18} className="text-gray-400" />
                                  </div>
                                  <input
                                    type="text" required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                                    placeholder="John Doe"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                  </div>
                                  <input
                                    type="email" required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                                    placeholder="john@example.com"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Phone size={18} className="text-gray-400" />
                                  </div>
                                  <input
                                    type="tel" required maxLength={10}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g,'') })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                                    placeholder="9876543210"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                  Alternate Phone <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Optional</span>
                                </label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Phone size={18} className="text-gray-300" />
                                  </div>
                                  <input
                                    type="tel" maxLength={10}
                                    value={formData.alternatePhone}
                                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value.replace(/\D/g,'') })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                                    placeholder="Optional"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address Card */}
                          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                              <MapPin className="text-gray-400" size={20} /> Shipping Address
                            </h2>
                            <div className="space-y-5">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Complete Address</label>
                                <div className="relative">
                                  <div className="absolute top-3.5 left-0 pl-3.5 pointer-events-none">
                                    <Building size={18} className="text-gray-400" />
                                  </div>
                                  <textarea required rows={2}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition resize-none"
                                    placeholder="Flat/House No., Building, Street"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode</label>
                                  <input type="text" required
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                                    placeholder="000000"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                                  <input type="text" required
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                                  <input type="text" required
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                  Order Notes <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Optional</span>
                                </label>
                                <input type="text"
                                  value={formData.notes}
                                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition"
                                  placeholder="Special instructions for delivery"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-xl transition shadow-[0_8px_20px_rgb(0,0,0,0.12)] flex items-center justify-center gap-2"
                          >
                            Continue to Payment <ArrowRight size={18} />
                          </button>
                        </form>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-6">
                          <button
                            onClick={() => setCurrentStep(1)}
                            className="text-sm font-semibold text-gray-500 hover:text-black transition flex items-center gap-1.5 mb-6"
                          >
                            <ArrowLeft size={16} /> Back to Shipping
                          </button>

                          <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>

                          <div className="space-y-4 mb-8">
                            {/* Online Payment Card */}
                            <div
                              onClick={() => setPaymentMethod('cashfree')}
                              className={`relative p-5 rounded-2xl border-2 transition cursor-pointer overflow-hidden ${
                                paymentMethod === 'cashfree'
                                  ? 'border-green-500 bg-green-50/30'
                                  : 'border-gray-100 hover:border-gray-200 bg-white'
                              }`}
                            >
                              {paymentMethod === 'cashfree' && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                                  Recommended
                                </div>
                              )}
                              <div className="flex gap-4">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 transition ${
                                  paymentMethod === 'cashfree' ? 'border-green-500' : 'border-gray-300'
                                }`}>
                                  {paymentMethod === 'cashfree' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <CreditCard size={18} className={paymentMethod === 'cashfree' ? 'text-green-600' : 'text-gray-400'} />
                                    Online Payment
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1 mb-3">Pay securely with UPI, Cards, Netbanking.</p>
                                  
                                  {/* Trust Icons */}
                                  <div className="flex flex-wrap gap-2">
                                    {['UPI', 'Visa', 'MasterCard', 'NetBanking'].map(method => (
                                      <div key={method} className="bg-white border border-gray-200 px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-600 shadow-sm">
                                        {method}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* COD Card */}
                            <div
                              onClick={() => setPaymentMethod('cod')}
                              className={`p-5 rounded-2xl border-2 transition cursor-pointer ${
                                paymentMethod === 'cod'
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-100 hover:border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex gap-4">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 transition ${
                                  paymentMethod === 'cod' ? 'border-gray-900' : 'border-gray-300'
                                }`}>
                                  {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <DollarSign size={18} className={paymentMethod === 'cod' ? 'text-gray-900' : 'text-gray-400'} />
                                    Cash on Delivery
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">Pay with cash or UPI at the time of delivery.</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {paymentMethod === 'cashfree' ? (
                            <button
                              onClick={handleCashfreePayment}
                              disabled={isLoading}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-4 rounded-xl transition shadow-[0_8px_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                              {isLoading ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Securely Processing...</>
                              ) : (
                                <><Lock size={18} /> Pay ₹{finalTotal.toLocaleString()} Securely</>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => placeOrder('COD', 'Pending')}
                              disabled={isLoading}
                              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 rounded-xl transition shadow-[0_8px_20px_rgb(0,0,0,0.15)] flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                              {isLoading ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing Order...</>
                              ) : (
                                <><CheckCircle size={18} /> Place Order via COD</>
                              )}
                            </button>
                          )}
                          
                          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
                            <ShieldCheck size={14} /> 256-bit SSL Encrypted Checkout
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:w-[380px] shrink-0">
                  <div className="sticky top-28 bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h3>

                    <div className="space-y-4 mb-6">
                      {items.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="flex gap-4 items-center">
                          <div className="relative w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                            <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full z-10 border-2 border-white">
                              {item.quantity}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate pr-2">{item.name}</h4>
                            {item.flavor && <p className="text-xs text-gray-500 mt-0.5">{item.flavor}</p>}
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      ))}

                      {freeGifts.map((gift, idx) => (
                        <div key={`gift-${idx}`} className="flex gap-4 items-center p-3 bg-green-50/50 rounded-xl border border-green-100">
                          <div className="relative w-12 h-12 bg-white rounded-lg overflow-hidden border border-green-100 shrink-0">
                            <Image src={gift.image} alt={gift.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-1.5 py-0.5 rounded mb-1">Free Gift</span>
                            <h4 className="text-xs font-semibold text-gray-900 truncate pr-2">{gift.name}</h4>
                          </div>
                          <div className="text-xs font-bold text-green-600">FREE</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 py-5 border-y border-gray-100 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-medium text-gray-900">₹{totalPrice.toLocaleString()}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount Applied</span>
                          <span className="font-medium">-₹{discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span className="font-medium text-green-600">FREE</span>
                      </div>
                    </div>

                    <div className="pt-5 flex justify-between items-end">
                      <div>
                        <p className="text-sm text-gray-500">Total to pay</p>
                      </div>
                      <div className="text-2xl font-black text-gray-900">
                        ₹{finalTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}
