'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { auth, db } from '@/lib/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, MapPin, User, Phone, Save, Trash2, Star, Home, Package, LogOut, ExternalLink, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  orderId?: string;
  status: string;
  totalAmount: number;
  discountAmount?: number;
  createdAt: any;
  items: any[];
  awbNumber?: string;
  deliveryPartner?: string;
}

export default function AccountPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        const data = snapshot.data();

        setName((data?.name as string) || user.displayName || '');
        setPhone((data?.phone as string) || '');
        setAddresses((data?.addresses as Address[]) || []);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setName(user.displayName || '');
      } finally {
        setLoading(false);
      }
    };

    
    const loadOrders = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          // orderBy('createdAt', 'desc') // Requires composite index, doing client-side sort
        );
        const snapshot = await getDocs(q);
        let userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        userOrders.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        });
        setOrders(userOrders);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadProfile();
    loadOrders();

  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateProfile(auth.currentUser!, {
        displayName: name,
      });

      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email,
          name,
          phone,
          role: 'customer',
          addresses,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      toast.success('Profile saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile');
    }
    setSaving(false);
  };

  const addAddress = async () => {
    if (!addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast.error('Please fill in all required address fields');
      return;
    }

    const nextAddress: Address = {
      ...addressForm,
      id: crypto.randomUUID(),
    };

    const nextAddresses = addressForm.isDefault
      ? [
          nextAddress,
          ...addresses.map((address) => ({ ...address, isDefault: false })),
        ]
      : [...addresses, nextAddress];

    setAddresses(nextAddresses);
    setAddressDialogOpen(false);
    setAddressForm({
      label: 'Home',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    });

    try {
      await setDoc(
        doc(db, 'users', user!.uid),
        {
          addresses: nextAddresses,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      toast.success('Address added');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add address');
    }
  };

  const removeAddress = async (addressId: string) => {
    const nextAddresses = addresses.filter((address) => address.id !== addressId);
    setAddresses(nextAddresses);

    try {
      await setDoc(
        doc(db, 'users', user!.uid),
        {
          addresses: nextAddresses,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      toast.success('Address removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove address');
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    const nextAddresses = addresses.map((address) => ({
      ...address,
      isDefault: address.id === addressId,
    }));
    setAddresses(nextAddresses);

    try {
      await setDoc(
        doc(db, 'users', user!.uid),
        {
          addresses: nextAddresses,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      toast.success('Default address updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update default address');
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-dark pt-24 pb-16 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-gray-400">Update your details and manage delivery addresses.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="glass rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <User className="text-green-400" />
                  <h2 className="text-xl font-semibold">Profile</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <Input value={user?.email || ''} disabled className="bg-white/5 border-white/10 text-white/60" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Phone</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="+91..." />
                  </div>
                  <Button onClick={saveProfile} disabled={saving} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-black font-semibold">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </div>

              
              <div className="glass rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Home className="text-green-400" />
                  <h2 className="text-xl font-semibold">Account</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">Your account is set as <span className="text-white font-semibold">customer</span> by default. Admin access is assigned manually from Firestore.</p>
                <Link href="/admin/orders" className="text-green-400 hover:text-green-300 text-sm font-semibold block mb-4">Go to Admin Panel</Link>
                <Button onClick={handleLogout} variant="destructive" className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>

            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* My Orders Section */}
              <div className="glass rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="text-green-400" />
                  <h2 className="text-xl font-semibold">My Orders</h2>
                </div>

                {loadingOrders ? (
                  <p className="text-gray-400">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                    You haven't placed any orders yet.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {orders.map((order) => {
                      const statusColors: Record<string, string> = {
                        Delivered: 'bg-green-500/15 text-green-400 border-green-500/30',
                        Cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
                        Shipped:   'bg-purple-500/15 text-purple-400 border-purple-500/30',
                        Processing:'bg-blue-500/15 text-blue-400 border-blue-500/30',
                        Pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                      };
                      const statusCls = statusColors[order.status || 'Pending'] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
                      const total = Number(order.totalAmount || 0);
                      const discount = Number(order.discountAmount || 0);
                      return (
                        <div key={order.id} className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden hover:bg-white/5 transition">
                          {/* Order Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/8 bg-white/3">
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Order ID</p>
                              <p className="font-mono text-sm font-bold text-white">{order.orderId || order.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-0.5">
                                {order.createdAt?.toDate
                                  ? order.createdAt.toDate().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                                  : 'Recent'}
                              </p>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusCls}`}>
                                {order.status || 'Processing'}
                              </span>
                            </div>
                          </div>

                          <div className="p-5 space-y-4">
                            {/* Items */}
                            <div className="space-y-2">
                              {order.items?.filter(i => !i.isPromo).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {item.flavor && `${item.flavor}`}{item.unit && ` · ${item.unit}`} · ×{item.quantity}
                                    </p>
                                  </div>
                                  <span className="text-sm font-bold text-gray-300 flex-shrink-0">
                                    ₹{(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              {order.items?.some(i => i.isPromo) && (
                                <div className="flex items-center gap-2 pt-1">
                                  <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">🎁 Free Gift Included</span>
                                </div>
                              )}
                            </div>

                            {/* Bill Summary */}
                            <div className="bg-black/30 rounded-xl border border-white/8 p-4 space-y-2">
                              {discount > 0 && (
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>Discount</span>
                                  <span className="text-green-400">− ₹{discount.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-1 border-t border-white/8">
                                <span className="text-sm font-bold">Total Paid</span>
                                <span className="text-lg font-black text-green-400 font-mono">₹{total.toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Tracking (if shipped) */}
                            {(order.awbNumber || order.deliveryPartner) && (
                              <div className="p-3 bg-purple-500/8 border border-purple-500/20 rounded-xl">
                                <p className="text-xs text-purple-400 font-bold mb-2">📦 Shipment Tracking</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                  {order.deliveryPartner && (
                                    <span className="text-gray-300">Courier: <span className="text-white font-semibold">{order.deliveryPartner}</span></span>
                                  )}
                                  {order.awbNumber && (
                                    <span className="text-gray-300 font-mono">AWB: <span className="text-purple-300 font-bold">{order.awbNumber}</span></span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="text-green-400" />
                    <h2 className="text-xl font-semibold">Saved Addresses</h2>
                  </div>
                  <Button onClick={() => setAddressDialogOpen(true)} className="bg-green-500 text-black hover:bg-green-400">
                    <Plus className="w-4 h-4" />
                    Add Address
                  </Button>
                </div>

                {loading ? (
                  <p className="text-gray-400">Loading profile...</p>
                ) : addresses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                    No saved addresses yet. Add your first delivery address.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <p className="font-semibold text-white">{address.label}</p>
                            {address.isDefault && <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><Star className="w-3 h-3" /> Default</p>}
                          </div>
                          <button onClick={() => removeAddress(address.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-400">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                        <p className="text-sm text-gray-400">{address.city}, {address.state} - {address.pincode}</p>
                        {!address.isDefault && (
                          <button onClick={() => setDefaultAddress(address.id)} className="mt-3 text-sm text-green-400 hover:text-green-300 font-semibold">Set as default</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
            <DialogContent className="bg-slate-950 border-white/10 text-white sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Address</DialogTitle>
                <DialogDescription className="text-gray-400">Save multiple delivery addresses for faster checkout.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Home, Office, etc." />
                <Textarea value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Address line 1" />
                <Textarea value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Address line 2 (optional)" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="City" />
                  <Input value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="State" />
                  <Input value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="Pincode" />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
                  Set as default address
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddressDialogOpen(false)} className="border-white/10 text-white bg-transparent">Cancel</Button>
                <Button onClick={addAddress} className="bg-green-500 text-black hover:bg-green-400">Save Address</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </ProtectedRoute>
  );
}
