'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Tag, Plus, Trash2, Edit, Save, X, ToggleLeft, ToggleRight, CheckCircle, Percent } from 'lucide-react';
import { fetchDbProducts, DbProduct } from '@/lib/db-products';

interface Offer {
  id: string;
  name: string;
  status: 'live' | 'draft';
  offerType: 'free_product' | 'percentage_discount' | 'flat_discount' | 'bxgy';
  minCartValue?: number;
  targetSku?: string;
  minQtyOfTargetSku?: number;
  rewardValue?: number;
  rewardSku?: string;
  rewardSkuQty?: number;
  buySku?: string;
  buyQty?: number;
  getSku?: string;
  getQty?: number;
}

export default function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    status: 'draft' as 'live' | 'draft',
    offerType: 'percentage_discount' as 'free_product' | 'percentage_discount' | 'flat_discount' | 'bxgy',
    minCartValue: '',
    targetSku: '',
    minQtyOfTargetSku: '',
    rewardValue: '',
    rewardSku: '',
    rewardSkuQty: '',
    buySku: '',
    buyQty: '',
    getSku: '',
    getQty: '',
  });

  useEffect(() => {
    fetchOffers();
    fetchDbProducts(true).then(setProducts);
  }, []);

  const fetchOffers = async () => {
    try {
      const snap = await getDocs(collection(db, 'offers'));
      const list: Offer[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as Offer);
      });
      setOffers(list);
    } catch (e) {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Offer Name is required');
      return;
    }

    const basePayload = {
      name: formData.name,
      status: formData.status,
      offerType: formData.offerType,
      minCartValue: formData.minCartValue ? parseFloat(formData.minCartValue) : undefined,
      targetSku: formData.targetSku || undefined,
      minQtyOfTargetSku: formData.minQtyOfTargetSku ? parseInt(formData.minQtyOfTargetSku) : undefined,
      rewardValue: formData.rewardValue ? parseFloat(formData.rewardValue) : undefined,
      rewardSku: formData.rewardSku || undefined,
      rewardSkuQty: formData.rewardSkuQty ? parseInt(formData.rewardSkuQty) : undefined,
      buySku: formData.buySku || undefined,
      buyQty: formData.buyQty ? parseInt(formData.buyQty) : undefined,
      getSku: formData.getSku || undefined,
      getQty: formData.getQty ? parseInt(formData.getQty) : undefined,
    };
    
    // Firestore throws error for undefined values. Strip them out.
    const payload = Object.fromEntries(Object.entries(basePayload).filter(([_, v]) => v !== undefined));

    try {
      if (editingId) {
        await updateDoc(doc(db, 'offers', editingId), payload);
        toast.success('Offer updated successfully');
      } else {
        await addDoc(collection(db, 'offers'), payload);
        toast.success('Offer created successfully');
      }
      resetForm();
      fetchOffers();
    } catch (e) {
      toast.error('Failed to save offer');
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    const nextStatus = offer.status === 'live' ? 'draft' : 'live';
    try {
      await updateDoc(doc(db, 'offers', offer.id), { status: nextStatus });
      toast.success(`Offer marked as ${nextStatus}`);
      fetchOffers();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await deleteDoc(doc(db, 'offers', id));
      toast.success('Offer deleted');
      fetchOffers();
    } catch (e) {
      toast.error('Failed to delete offer');
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setFormData({
      name: offer.name,
      status: offer.status,
      offerType: offer.offerType,
      minCartValue: offer.minCartValue?.toString() || '',
      targetSku: offer.targetSku || '',
      minQtyOfTargetSku: offer.minQtyOfTargetSku?.toString() || '',
      rewardValue: offer.rewardValue?.toString() || '',
      rewardSku: offer.rewardSku || '',
      rewardSkuQty: offer.rewardSkuQty?.toString() || '',
      buySku: offer.buySku || '',
      buyQty: offer.buyQty?.toString() || '',
      getSku: offer.getSku || '',
      getQty: offer.getQty?.toString() || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'draft',
      offerType: 'percentage_discount',
      minCartValue: '',
      targetSku: '',
      minQtyOfTargetSku: '',
      rewardValue: '',
      rewardSku: '',
      rewardSkuQty: '',
      buySku: '',
      buyQty: '',
      getSku: '',
      getQty: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="p-4 sm:p-8 bg-[#fcfcfc] min-h-screen font-sans">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <Tag size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Manage discount rules, BXGY, and promotional campaigns</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-black/10 text-sm">
            <Plus size={18} /> New Promotion
          </button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 mb-8 max-w-4xl"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {editingId ? <><Edit size={18} className="text-gray-400" /> Edit Offer</> : <><Plus size={18} className="text-gray-400" /> Create New Offer</>}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Offer Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Buy 2 Get 1 Free" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold cursor-pointer"
                  >
                    <option value="draft">Draft / Inactive</option>
                    <option value="live">Live / Active</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Promotion Type</label>
                  <select value={formData.offerType} onChange={e => setFormData({ ...formData, offerType: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold cursor-pointer"
                  >
                    <option value="percentage_discount">% Percentage Discount</option>
                    <option value="flat_discount">Flat Amount Off (₹)</option>
                    <option value="free_product">Add Free Gift Product</option>
                    <option value="bxgy">Buy X Get Y Free (BXGY)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Min Cart Total (₹)</label>
                  <input type="number" placeholder="e.g. 2999" value={formData.minCartValue} onChange={e => setFormData({ ...formData, minCartValue: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold"
                  />
                </div>
              </div>

              {/* Condition: SKU checks */}
              {formData.offerType !== 'bxgy' && (
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={14} className="text-gray-400" /> Optional SKU Trigger Conditions
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Requires Specific Product SKU</label>
                    <select value={formData.targetSku} onChange={e => setFormData({ ...formData, targetSku: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold cursor-pointer"
                    >
                      <option value="">-- Any Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.sku || p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Min Quantity of SKU</label>
                    <input type="number" placeholder="e.g. 2" value={formData.minQtyOfTargetSku} onChange={e => setFormData({ ...formData, minQtyOfTargetSku: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Type Specific Fields */}
              {(formData.offerType === 'percentage_discount' || formData.offerType === 'flat_discount') && (
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Discount Value ({formData.offerType === 'percentage_discount' ? '%' : '₹'})
                  </label>
                  <input type="number" placeholder={formData.offerType === 'percentage_discount' ? '15' : '500'} value={formData.rewardValue} onChange={e => setFormData({ ...formData, rewardValue: e.target.value })}
                    className="w-full md:w-1/2 px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold"
                  />
                </div>
              )}

              {formData.offerType === 'free_product' && (
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Reward Gift SKU</label>
                    <select value={formData.rewardSku} onChange={e => setFormData({ ...formData, rewardSku: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold cursor-pointer"
                    >
                      <option value="">-- Select Reward Gift SKU --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.sku || p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Gift Quantity</label>
                    <input type="number" placeholder="1" value={formData.rewardSkuQty} onChange={e => setFormData({ ...formData, rewardSkuQty: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold"
                    />
                  </div>
                </div>
              )}

              {formData.offerType === 'bxgy' && (
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Package size={14} className="text-gray-400" /> Buy X Get Y Setup
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Buy SKU</label>
                    <select value={formData.buySku} onChange={e => setFormData({ ...formData, buySku: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold cursor-pointer"
                    >
                      <option value="">-- Select Buy SKU --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.sku || p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Buy Min Qty</label>
                    <input type="number" placeholder="2" value={formData.buyQty} onChange={e => setFormData({ ...formData, buyQty: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Get SKU (Free)</label>
                    <select value={formData.getSku} onChange={e => setFormData({ ...formData, getSku: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold cursor-pointer"
                    >
                      <option value="">-- Select Free Get SKU --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.sku || p.id}>{p.name} ({p.sku || 'No SKU'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Get Free Qty</label>
                    <input type="number" placeholder="1" value={formData.getQty} onChange={e => setFormData({ ...formData, getQty: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm text-gray-900 font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
                <button type="button" onClick={resetForm}
                  className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-bold transition text-sm"
                >
                  Cancel
                </button>
                <button type="submit"
                  className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-black/10 text-sm"
                >
                  <Save size={16} /> Save Offer
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5 border-b border-gray-50">Offer Name</th>
                  <th className="px-6 py-5 border-b border-gray-50">Type</th>
                  <th className="px-6 py-5 border-b border-gray-50">Conditions</th>
                  <th className="px-6 py-5 border-b border-gray-50">Reward</th>
                  <th className="px-6 py-5 border-b border-gray-50">Status</th>
                  <th className="px-6 py-5 border-b border-gray-50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500 font-medium">
                      <Tag size={40} className="mx-auto text-gray-200 mb-4" />
                      <p>No active promotion campaigns found.</p>
                    </td>
                  </tr>
                ) : (
                  offers.map(offer => (
                    <tr key={offer.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-5 font-bold text-gray-900 text-sm">{offer.name}</td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                          {offer.offerType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-gray-500 font-medium space-y-1">
                        {offer.minCartValue && <div>Min Cart: <span className="font-bold text-gray-900">₹{offer.minCartValue}</span></div>}
                        {offer.targetSku && <div>Target: <span className="font-bold text-gray-900">{offer.targetSku}</span> (Qty ≥ {offer.minQtyOfTargetSku || 1})</div>}
                        {offer.offerType === 'bxgy' && <div>Buy: <span className="font-bold text-gray-900">{offer.buySku}</span> (Qty: {offer.buyQty})</div>}
                        {(!offer.minCartValue && !offer.targetSku && offer.offerType !== 'bxgy') && <span className="text-gray-400 italic">Storewide</span>}
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-900">
                        {offer.offerType === 'percentage_discount' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">{offer.rewardValue}% Off</span>}
                        {offer.offerType === 'flat_discount' && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">₹{offer.rewardValue} Off</span>}
                        {offer.offerType === 'free_product' && `Free SKU: ${offer.rewardSku} (Qty: ${offer.rewardSkuQty || 1})`}
                        {offer.offerType === 'bxgy' && `Free SKU: ${offer.getSku} (Qty: ${offer.getQty})`}
                      </td>
                      <td className="px-6 py-5">
                        <button onClick={() => handleToggleStatus(offer)} className="flex items-center gap-1 cursor-pointer transition focus:outline-none">
                          {offer.status === 'live' ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Draft
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleEdit(offer)} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition shadow-sm" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(offer.id)} className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl transition shadow-sm" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
