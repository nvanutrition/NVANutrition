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
  status: string;
  totalAmount: number;
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
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-6 transition hover:bg-white/10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Order #{order.id}</p>
                            <p className="text-sm text-gray-500">
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Recent'}
                            </p>
                          </div>
                          <div className="flex flex-col items-start md:items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              order.status === 'Delivered' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                              order.status === 'Cancelled' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                              'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}>
                              {order.status || 'Processing'}
                            </span>
                            <span className="font-bold text-white">₹{order.totalAmount?.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-300 font-medium mb-2">Items:</p>
                          <ul className="text-sm text-gray-400 space-y-1">
                            {order.items?.map((item, idx) => (
                              <li key={idx}>• {item.name} (x{item.quantity})</li>
                            ))}
                          </ul>
                        </div>

                        {(order.awbNumber || order.deliveryPartner) && (
                          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between bg-black/20 p-3 rounded-lg">
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm">
                              {order.deliveryPartner && (
                                <span className="text-gray-300"><span className="text-gray-500">Partner:</span> {order.deliveryPartner}</span>
                              )}
                              {order.awbNumber && (
                                <span className="text-green-400 font-mono"><span className="text-gray-500">AWB:</span> {order.awbNumber}</span>
                              )}
                            </div>
                            {order.awbNumber && (
                              <button className="text-xs flex items-center gap-1 bg-green-500/20 text-green-300 hover:bg-green-500/30 px-2 py-1 rounded transition">
                                <ExternalLink size={12} /> Track
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
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
