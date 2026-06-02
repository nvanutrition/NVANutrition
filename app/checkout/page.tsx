'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Smartphone
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

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod'); // Razorpay hidden — COD only
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  // Custom Payment Sandbox Modal States
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxCardNumber, setSandboxCardNumber] = useState('');
  const [sandboxExpiry, setSandboxExpiry] = useState('');
  const [sandboxCvv, setSandboxCvv] = useState('');
  const [sandboxUpiId, setSandboxUpiId] = useState('');
  const [sandboxTab, setSandboxTab] = useState<'card' | 'upi'>('card');
  const [isSandboxProcessing, setIsSandboxProcessing] = useState(false);
  const [sandboxSuccess, setSandboxSuccess] = useState(false);

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

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  if (items.length === 0 && !showSuccess) {
    return (
      <main>
        <Navbar />
        <div className="min-h-screen bg-slate-950 pt-20 flex items-center">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 shadow-2xl"
            >
              <ShoppingCart size={64} className="mx-auto mb-6 text-green-500" />
              <h1 className="text-4xl font-extrabold text-white mb-4">Your Cart is Empty</h1>
              <p className="text-gray-400 mb-8 text-lg">Please add products before checking out.</p>
              <button
                onClick={() => router.push('/products')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold transition shadow-lg shadow-green-500/20"
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
        <div className="min-h-screen bg-slate-950 pt-24 pb-16 text-white">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
              <h1 className="text-4xl font-extrabold mb-3">Sign in to continue checkout</h1>
              <p className="text-gray-400 mb-8">You can add items to cart without logging in. Sign in only when you are ready to checkout.</p>

              <form onSubmit={handleCheckoutEmailLogin} className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-black font-extrabold py-3 rounded-xl disabled:opacity-50"
                >
                  {authLoading ? 'Signing in...' : 'Sign in with Email'}
                </button>
              </form>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800" /></div>
                <div className="relative flex justify-center"><span className="bg-slate-950 px-3 text-gray-500 text-sm">or</span></div>
              </div>

              <button
                onClick={handleCheckoutGoogleLogin}
                disabled={authLoading}
                className="w-full border border-white/10 hover:bg-white/5 rounded-xl py-3 font-semibold text-white disabled:opacity-50"
              >
                Continue with Google
              </button>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    sessionStorage.setItem('authRedirect', '/checkout');
                    router.push('/auth/register');
                  }}
                  className="flex-1 border border-neutral-800 hover:bg-neutral-900 rounded-xl py-3 font-semibold text-white"
                >
                  Create Account
                </button>
                <button
                  onClick={() => router.push('/products')}
                  className="flex-1 border border-neutral-800 hover:bg-neutral-900 rounded-xl py-3 font-semibold text-white"
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
    setCurrentStep(2);
  };

  // Generate NVA-XXXXX-XXXXX order ID
  const generateOrderId = () => {
    const chars = '0123456789';
    const rand5 = () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `NVA-${rand5()}-${rand5()}`;
  };

  // Place order helper
  const placeOrder = async (pMethod: 'COD' | 'Razorpay', finalPaymentStatus: 'Pending' | 'Paid') => {
    setIsLoading(true);
    const orderNum = generateOrderId();
    setOrderNumber(orderNum);

    const orderPayload = {
      orderId: orderNum,
      customerName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      // Nested address object — required by admin order detail and user account views
      address: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pincode,
        alternatePhone: formData.alternatePhone || '',
      },
      notes: formData.notes,
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
      // 1. Write the order payload to Firestore for admin review
      await setDoc(doc(db, 'orders', orderNum), {
        ...orderPayload,
        userId: user?.uid || 'guest',
        status: 'Pending', // for compatibility with AdminOrders status view
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 1.5 Send Email Confirmation
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderNum,
            customerName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
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

      // 2. Decrement the stock of each purchased item in Firestore
      for (const item of items) {
        try {
          const productRef = doc(db, 'products', item.id);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const currentStock = productSnap.data().stock || 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            await updateDoc(productRef, { stock: newStock });
            console.log(`Updated stock for ${item.name}: ${currentStock} -> ${newStock}`);
          }
        } catch (stockErr) {
          console.error(`Failed to decrement stock for item ${item.id}:`, stockErr);
        }
      }

      // 3. Send order details to Google Sheets (if configured)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      toast.success(pMethod === 'COD' ? 'Order placed successfully!' : 'Payment received & order processed!');
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

  // Handle Online Payment (Razorpay or Simulation)
  const handleRazorpayPayment = async () => {
    setIsLoading(true);
    const generatedTempOrderId = 'ORD-TEMP-' + Date.now();

    try {
      // 1. Call Backend to create order
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalTotal, orderId: generatedTempOrderId }),
      });

      const paymentOrder = await res.json();

      if (!paymentOrder.success) {
        toast.error('Payment initialization failed.');
        setIsLoading(false);
        return;
      }

      // 2. Check gateway: real or sandbox
      if (paymentOrder.gateway === 'razorpay') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error('Failed to load payment gateway script. Check connection.');
          setIsLoading(false);
          return;
        }

        const options = {
          key: paymentOrder.keyId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: 'NVA Nutrition',
          description: 'Premium Sports Supplements',
          image: '/logo.png',
          order_id: paymentOrder.orderId,
          handler: async function (response: any) {
            console.log('Razorpay payment successful:', response);
            // Submit final order details as Paid
            await placeOrder('Razorpay', 'Paid');
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          notes: {
            address: formData.address,
          },
          theme: {
            color: '#00C853',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setIsLoading(false);
      } else {
        // Fallback to our custom simulated premium Razorpay overlay
        setIsLoading(false);
        setShowSandboxModal(true);
      }
    } catch (err) {
      console.error('Payment gateway error:', err);
      // Fallback directly to simulated popup in case of API failure
      setIsLoading(false);
      setShowSandboxModal(true);
    }
  };

  // Simulated sandbox modal handlers
  const handleSimulatedCardNumberChange = (val: string) => {
    // Add spaces every 4 characters
    const clean = val.replace(/\s?/g, '').replace(/[^0-9]/g, '');
    const parts = [];
    for (let i = 0; i < clean.length; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    setSandboxCardNumber(parts.join(' ').substring(0, 19));
  };

  const handleSimulatedExpiryChange = (val: string) => {
    const clean = val.replace(/\//g, '').replace(/[^0-9]/g, '');
    if (clean.length >= 2) {
      setSandboxExpiry(`${clean.substring(0, 2)}/${clean.substring(2, 4)}`);
    } else {
      setSandboxExpiry(clean);
    }
  };

  const handleConfirmSimulatedPayment = () => {
    if (sandboxTab === 'card') {
      if (sandboxCardNumber.length < 19 || sandboxExpiry.length < 5 || sandboxCvv.length < 3) {
        toast.error('Please enter valid credit card details');
        return;
      }
    } else {
      if (!sandboxUpiId.includes('@') || sandboxUpiId.length < 5) {
        toast.error('Please enter a valid UPI ID (e.g. user@okhdfcbank)');
        return;
      }
    }

    setIsSandboxProcessing(true);
    setTimeout(() => {
      setIsSandboxProcessing(false);
      setSandboxSuccess(true);
      setTimeout(async () => {
        setShowSandboxModal(false);
        setSandboxSuccess(false);
        setSandboxCardNumber('');
        setSandboxExpiry('');
        setSandboxCvv('');
        setSandboxUpiId('');
        // Place final order as Paid
        await placeOrder('Razorpay', 'Paid');
      }, 1500);
    }, 2000);
  };

  return (
    <main className="bg-slate-950 min-h-screen text-white">
      <Navbar />

      {/* Dynamic Simulated Razorpay Overlay */}
      <AnimatePresence>
        {showSandboxModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-neutral-850 to-neutral-900 p-6 border-b border-neutral-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                    <span className="font-extrabold text-black text-sm">NV</span>
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">NVA Nutrition Payments</h3>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold">
                      <ShieldCheck size={12} className="text-green-500" /> SECURE GATEWAY (SANDBOX)
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSandboxModal(false)}
                  className="text-gray-400 hover:text-white font-bold p-1 bg-neutral-800 rounded-full hover:bg-neutral-700 transition"
                >
                  &times;
                </button>
              </div>

              {/* Amount Display */}
              <div className="p-6 bg-neutral-950 border-b border-neutral-850 flex justify-between items-center">
                <span className="text-sm text-gray-400 font-semibold">Order Total</span>
                <span className="text-2xl font-black text-green-500 font-mono">₹{finalTotal.toLocaleString()}</span>
              </div>

              {sandboxSuccess ? (
                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <motion.div
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                    className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6"
                  >
                    <CheckCircle className="text-green-500" size={48} />
                  </motion.div>
                  <h4 className="text-xl font-bold text-white mb-2">Payment Authorized!</h4>
                  <p className="text-gray-400 text-sm">Redirecting to order confirmation...</p>
                </div>
              ) : isSandboxProcessing ? (
                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-6"></div>
                  <h4 className="text-lg font-bold text-white mb-2">Processing Transaction...</h4>
                  <p className="text-gray-400 text-sm font-semibold">Contacting secure sandbox server...</p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Tabs */}
                  <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1.5 rounded-xl border border-neutral-850">
                    <button
                      onClick={() => setSandboxTab('card')}
                      className={`py-2.5 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${
                        sandboxTab === 'card' 
                          ? 'bg-neutral-850 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <CreditCard size={16} />
                      Card
                    </button>
                    <button
                      onClick={() => setSandboxTab('upi')}
                      className={`py-2.5 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${
                        sandboxTab === 'upi' 
                          ? 'bg-neutral-850 text-white' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Smartphone size={16} />
                      UPI App
                    </button>
                  </div>

                  {/* Card Form */}
                  {sandboxTab === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Card Number</label>
                        <input
                          type="text"
                          value={sandboxCardNumber}
                          onChange={(e) => handleSimulatedCardNumberChange(e.target.value)}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 focus:outline-none transition"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Expiry Date</label>
                          <input
                            type="text"
                            value={sandboxExpiry}
                            onChange={(e) => handleSimulatedExpiryChange(e.target.value)}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 focus:outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">CVV</label>
                          <input
                            type="password"
                            value={sandboxCvv}
                            onChange={(e) => setSandboxCvv(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                            placeholder="***"
                            maxLength={4}
                            className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 focus:outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Form */}
                  {sandboxTab === 'upi' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Virtual Payment Address (VPA)</label>
                        <input
                          type="text"
                          value={sandboxUpiId}
                          onChange={(e) => setSandboxUpiId(e.target.value)}
                          placeholder="hustler@upi"
                          className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 focus:outline-none transition"
                        />
                        <p className="text-[10px] text-gray-500 mt-1 font-medium">Example: yourname@okhdfcbank, mobile@paytm</p>
                      </div>
                    </div>
                  )}

                  {/* Submit pay */}
                  <button
                    onClick={handleConfirmSimulatedPayment}
                    className="w-full bg-green-500 hover:bg-green-600 text-black font-extrabold py-4 rounded-xl transition text-base shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock size={16} />
                    Securely Pay ₹{finalTotal.toLocaleString()}
                  </button>
                  <p className="text-[10px] text-center text-gray-500 font-semibold tracking-wider uppercase">
                    🔒 SSL 256-BIT ENCRYPTION • DEMO GATEWAY
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Step indicators */}
          {!showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
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
                            : 'bg-neutral-800 text-gray-400'
                        }`}>
                          <Icon size={18} />
                        </div>
                        <span className={`text-sm font-bold hidden sm:inline ${
                          isActive || isCompleted ? 'text-white' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </span>
                        {idx < steps.length - 1 && (
                          <div className={`hidden md:block w-16 h-[2px] transition ${
                            isCompleted ? 'bg-green-500' : 'bg-neutral-850'
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
            {showSuccess ? (
              // Confirmation / Success Screen
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

                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                  Thank You For Choosing NVA Nutrition
                </h1>
                <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl mx-auto">
                  Your Order Has Been Received Successfully.
                </p>

                {/* Details card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl mb-8 text-left">
                  <div className="border-b border-neutral-850 pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Order Number</p>
                      <p className="text-3xl font-black text-green-500 font-mono">{orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Payment Status</p>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold ${
                        paymentMethod === 'razorpay' 
                          ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                          : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                      }`}>
                        {paymentMethod === 'razorpay' ? 'Paid Online' : 'Cash On Delivery'}
                      </span>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Subtotal</p>
                      <p className="text-lg font-bold text-white">₹{totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Paid</p>
                      <p className="text-lg font-black text-green-500">₹{finalTotal.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Delivery summary */}
                  <div className="space-y-3 mb-8 bg-neutral-950 p-6 rounded-2xl border border-neutral-850">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Truck size={16} className="text-green-500" /> Shipping & Delivery Information
                    </h4>
                    <p className="text-sm text-gray-400"><span className="font-semibold text-white">Recipient:</span> {formData.fullName}</p>
                    <p className="text-sm text-gray-400"><span className="font-semibold text-white">Address:</span> {formData.address}, {formData.city}, {formData.state} - {formData.pincode}</p>
                    <p className="text-sm text-gray-400"><span className="font-semibold text-white">Phone:</span> {formData.phone}</p>
                  </div>

                  {/* Next steps info */}
                  <div className="flex gap-4 items-start bg-neutral-950/40 p-6 rounded-2xl border border-neutral-850/60">
                    <FileText className="text-green-500 flex-shrink-0" size={24} />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1.5">What Happens Next?</h4>
                      <ul className="text-sm text-gray-400 space-y-2 list-disc pl-4 font-medium">
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
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold px-8 py-4 rounded-xl transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Continue Shopping
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold px-8 py-4 rounded-xl transition hover:bg-neutral-900 cursor-pointer"
                  >
                    Back to Home
                  </button>
                </div>
              </motion.div>
            ) : currentStep === 1 ? (
              // Step 1: Shipping Form
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                      <Truck className="text-green-500" size={24} />
                      Shipping Address
                    </h2>

                    <form onSubmit={handleProceedToPayment} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="John Doe"
                            className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                            className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g,'').slice(0,10) })}
                            placeholder="98765 43210"
                            maxLength={10}
                            className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Alternate Phone <span className="text-gray-600 normal-case font-medium">(Optional)</span></label>
                          <input
                            type="tel"
                            value={formData.alternatePhone}
                            onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value.replace(/\D/g,'').slice(0,10) })}
                            placeholder="Another number"
                            maxLength={10}
                            className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Pincode / Zip Code *</label>
                          <input
                            type="text"
                            required
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            placeholder="400001"
                            className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Delivery Address *</label>
                        <textarea
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Flat/House No., Building Name, Street Address"
                          rows={3}
                          className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition font-semibold resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">City *</label>
                          <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Mumbai"
                            className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">State *</label>
                          <input
                            type="text"
                            required
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="Maharashtra"
                            className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Order Notes (Optional)</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Special instructions (e.g. Ring doorbell, leave at gate)"
                          rows={2}
                          className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-700 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none transition font-semibold resize-none"
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
              // Step 2: Payment Method Form
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <button 
                        onClick={() => setCurrentStep(1)}
                        className="p-2 hover:bg-neutral-800 rounded-full transition text-gray-400 hover:text-white"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Lock className="text-green-500" size={24} />
                        Choose Payment Method
                      </h2>
                    </div>

                    <div className="space-y-4 mb-8">
                      {/* COD */}
                      <div 
                        onClick={() => setPaymentMethod('cod')}
                        className={`border-2 rounded-2xl p-6 flex items-start gap-4 transition cursor-pointer select-none ${
                          paymentMethod === 'cod' 
                            ? 'border-green-500 bg-green-500/5' 
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/20'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0 ${
                          paymentMethod === 'cod' ? 'border-green-500' : 'border-gray-500'
                        }`}>
                          {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white flex items-center gap-2">
                            <DollarSign size={18} className="text-green-500" /> Cash on Delivery (COD)
                          </h3>
                          <p className="text-sm text-gray-400 mt-1 font-medium">Pay securely in cash or via mobile UPI at the time of package delivery.</p>
                        </div>
                      </div>

                      {/* === RAZORPAY HIDDEN — UNCOMMENT TO RE-ENABLE ===
                      <div 
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`border-2 rounded-2xl p-6 flex items-start gap-4 transition cursor-pointer select-none ${
                          paymentMethod === 'razorpay' 
                            ? 'border-green-500 bg-green-500/5' 
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/20'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0 ${
                          paymentMethod === 'razorpay' ? 'border-green-500' : 'border-gray-500'
                        }`}>
                          {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-white flex items-center gap-2">
                            <CreditCard size={18} className="text-green-500" /> Online Payment (Razorpay Secure)
                          </h3>
                          <p className="text-sm text-gray-400 mt-1 font-medium">Pay securely via Credit Cards, Debit Cards, Net Banking, or instant mobile UPI wallet.</p>
                        </div>
                      </div>
                      === END RAZORPAY HIDDEN === */}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-4">
                      <button
                        onClick={() => placeOrder('COD', 'Pending')}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-extrabold py-4 rounded-xl transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer text-base"
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
                      
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="w-full border-2 border-neutral-800 hover:bg-neutral-900 text-white font-bold py-3.5 rounded-xl transition cursor-pointer"
                      >
                        Back to Shipping
                      </button>
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl sticky top-28 space-y-6">
      <h3 className="text-xl font-black text-white flex items-center gap-2">
        <ShoppingCart className="text-green-500" size={20} />
        Order Summary
      </h3>

      {/* Items list */}
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-850">
        {items.map((item, idx) => (
          <div key={`${item.id}-${item.flavor}`} className="flex justify-between items-start gap-4">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
              {item.flavor && <p className="text-[10px] text-gray-500 font-semibold">{item.flavor}</p>}
              <p className="text-[10px] text-gray-400 mt-1">Qty: {item.quantity}</p>
            </div>
            <p className="text-xs font-bold text-green-500">₹{(item.price * item.quantity).toLocaleString()}</p>
          </div>
        ))}
        {freeGifts.map((gift, idx) => (
          <div key={`gift-${gift.sku}-${idx}`} className="flex justify-between items-start gap-4 p-2 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
              <Image src={gift.image} alt={gift.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[8px] font-black tracking-widest uppercase bg-green-500 text-white px-1.5 py-0.5 rounded mb-1">
                Free Gift
              </span>
              <h4 className="text-xs font-bold text-white truncate">{gift.name}</h4>
              <p className="text-[10px] text-gray-400 mt-1">Qty: {gift.quantity}</p>
            </div>
            <p className="text-xs font-black text-green-500 uppercase">Free</p>
          </div>
        ))}
      </div>

      {/* Math summary */}
      <div className="border-t border-neutral-850 pt-4 space-y-3.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400 font-medium">Subtotal</span>
          <span className="font-bold text-white">₹{totalPrice.toLocaleString()}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400 font-medium">Promo Discount</span>
            <span className="font-bold text-green-500">-₹{discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400 font-medium">Shipping</span>
          <span className="font-extrabold text-green-500 bg-green-500/10 px-2.5 py-0.5 rounded-lg text-xs border border-green-500/20">Free</span>
        </div>
        
        <div className="border-t border-neutral-850 pt-4 flex justify-between items-center">
          <span className="text-base font-bold text-white">Grand Total</span>
          <span className="text-xl font-black text-green-500 font-mono">₹{finalTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Secure footer */}
      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 flex items-center justify-center gap-2">
        <Lock size={14} className="text-green-500" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Secured by 256-bit SSL connection</span>
      </div>
    </div>
  );
}
