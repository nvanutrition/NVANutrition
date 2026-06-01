'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Tag, Plus, Trash2, Edit, Save, X, ToggleLeft, ToggleRight, CheckCircle, Percent } from 'lucide-react';

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

    const payload: Partial<Offer> = {
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
    <div className="p-8 bg-gradient-dark min-h-screen text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-3">
            <Tag className="text-green-500" /> Offers Engine
          </h1>
          <p className="text-gray-400 mt-1">Manage rules, buy-one-get-ones, and cart discounts</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-green-500/20 cursor-pointer"
          >
            <Plus size={18} /> New Promotion
          </button>
        )}
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/10 rounded-2xl p-6 mb-8 max-w-4xl"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2 text-green-400">
              {editingId ? 'Edit Offer' : 'Create New Offer'}
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Offer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Buy 2 Get 1 Free Creatine"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Offer Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-green-500 cursor-pointer"
                >
                  <option value="draft" className="bg-neutral-900">Draft / Inactive</option>
                  <option value="live" className="bg-neutral-900">Live / Active</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Promotion Type</label>
                <select
                  value={formData.offerType}
                  onChange={e => setFormData({ ...formData, offerType: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-green-500 cursor-pointer"
                >
                  <option value="percentage_discount" className="bg-neutral-900">% Percentage Discount</option>
                  <option value="flat_discount" className="bg-neutral-900">Flat Amount Off</option>
                  <option value="free_product" className="bg-neutral-900">Add Free Gift Product</option>
                  <option value="bxgy" className="bg-neutral-900">Buy X Get Y Free (BXGY)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Min Cart Total (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 2999"
                  value={formData.minCartValue}
                  onChange={e => setFormData({ ...formData, minCartValue: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Condition: SKU checks */}
            {formData.offerType !== 'bxgy' && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 text-xs font-black text-green-400 uppercase tracking-wide">
                  Optional SKU Trigger Conditions
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Requires Specific Product SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-WHEY-MILK"
                    value={formData.targetSku}
                    onChange={e => setFormData({ ...formData, targetSku: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Min Quantity of SKU</label>
                  <input
                    type="number"
                    placeholder="e.g. 2"
                    value={formData.minQtyOfTargetSku}
                    onChange={e => setFormData({ ...formData, minQtyOfTargetSku: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            {/* Type Specific Fields */}
            {(formData.offerType === 'percentage_discount' || formData.offerType === 'flat_discount') && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Discount Value ({formData.offerType === 'percentage_discount' ? '%' : '₹'})
                </label>
                <input
                  type="number"
                  placeholder={formData.offerType === 'percentage_discount' ? '15' : '500'}
                  value={formData.rewardValue}
                  onChange={e => setFormData({ ...formData, rewardValue: e.target.value })}
                  className="w-full md:w-1/2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg"
                />
              </div>
            )}

            {formData.offerType === 'free_product' && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Reward Gift SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-SHAKER-BLACK"
                    value={formData.rewardSku}
                    onChange={e => setFormData({ ...formData, rewardSku: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Gift Quantity</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.rewardSkuQty}
                    onChange={e => setFormData({ ...formData, rewardSkuQty: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            {formData.offerType === 'bxgy' && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4 text-xs font-black text-green-400 uppercase tracking-wide">
                  Buy X Get Y Setup
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Buy SKU</label>
                  <input
                    type="text"
                    placeholder="SKU-WHEY"
                    value={formData.buySku}
                    onChange={e => setFormData({ ...formData, buySku: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Buy Min Qty</label>
                  <input
                    type="number"
                    placeholder="2"
                    value={formData.buyQty}
                    onChange={e => setFormData({ ...formData, buyQty: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Get SKU (Free)</label>
                  <input
                    type="text"
                    placeholder="SKU-CREATINE"
                    value={formData.getSku}
                    onChange={e => setFormData({ ...formData, getSku: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Get Free Qty</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.getQty}
                    onChange={e => setFormData({ ...formData, getQty: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-green-500/20 cursor-pointer text-sm"
              >
                <Save size={16} /> Save Offer
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
        </div>
      ) : (
        <div className="glass border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Offer Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Conditions</th>
                  <th className="px-6 py-4">Reward</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 font-medium">
                      No active promotion campaigns found.
                    </td>
                  </tr>
                ) : (
                  offers.map(offer => (
                    <tr key={offer.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-bold text-white text-sm">{offer.name}</td>
                      <td className="px-6 py-4 text-xs font-extrabold font-mono tracking-wider uppercase text-green-400">
                        {offer.offerType.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 space-y-1">
                        {offer.minCartValue && <div>Min Cart: ₹{offer.minCartValue}</div>}
                        {offer.targetSku && <div>Target: {offer.targetSku} (Qty ≥ {offer.minQtyOfTargetSku || 1})</div>}
                        {offer.offerType === 'bxgy' && <div>Buy: {offer.buySku} (Qty: {offer.buyQty})</div>}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-white">
                        {offer.offerType === 'percentage_discount' && `${offer.rewardValue}% Off`}
                        {offer.offerType === 'flat_discount' && `₹${offer.rewardValue} Off`}
                        {offer.offerType === 'free_product' && `Free SKU: ${offer.rewardSku} (Qty: {offer.rewardSkuQty || 1})`}
                        {offer.offerType === 'bxgy' && `Get Free SKU: ${offer.getSku} (Qty: {offer.getQty})`}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(offer)}
                          className="flex items-center gap-1 cursor-pointer transition"
                        >
                          {offer.status === 'live' ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-extrabold rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-400 text-xs font-extrabold rounded-full">
                              Draft
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(offer)}
                            className="p-2 bg-white/5 border border-white/10 hover:border-green-500 hover:text-green-500 rounded-lg transition cursor-pointer"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(offer.id)}
                            className="p-2 bg-white/5 border border-white/10 hover:border-red-500 hover:text-red-500 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 size={16} />
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
