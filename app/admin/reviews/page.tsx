'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Star, CheckCircle, XCircle, Trash2, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  sku: string;
  productName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  createdAt: any;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const snap = await getDocs(collection(db, 'reviews'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      list.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setReviews(list);
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'reviews', id), { status });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toast.success(`Review ${status}`);
    } catch {
      toast.error('Failed to update review status');
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const filtered = reviews.filter(r => r.status === activeTab);

  if (loading) return <div className="p-8 text-white font-bold">Loading...</div>;

  return (
    <div className="p-8 bg-gradient-dark min-h-screen text-white">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            Product Reviews
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Manage and moderate customer feedback.</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-black/40 p-2 rounded-2xl w-fit border border-white/5">
        {['pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 cursor-pointer ${
              activeTab === tab ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
            {tab === 'pending' && reviews.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                {reviews.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Star size={48} className="mx-auto mb-4 opacity-20" />
            <p>No {activeTab} reviews found.</p>
          </div>
        ) : (
          filtered.map(review => (
            <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold text-sm bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
                    {review.productName}
                  </span>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-gray-600" : ""} />)}
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5"><User size={14} className="text-gray-400" /> {review.userName}</span>
                  {review.verified && <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20"><ShieldCheck size={12} /> Verified Buyer</span>}
                  <span>{review.createdAt?.toDate().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                {activeTab === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(review.id, 'approved')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl font-bold text-sm border border-green-500/30 transition cursor-pointer">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => updateStatus(review.id, 'rejected')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-xl font-bold text-sm border border-orange-500/30 transition cursor-pointer">
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}
                <button onClick={() => deleteReview(review.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl font-bold text-sm border border-red-500/30 transition cursor-pointer">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
