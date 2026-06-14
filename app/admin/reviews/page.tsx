'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Star, CheckCircle, XCircle, Trash2, ShieldCheck, User, MessageSquare } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fcfcfc]">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-[#fcfcfc] min-h-screen font-sans">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Manage and moderate customer feedback and ratings</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-fit mb-8">
        {['pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition flex items-center gap-2 ${
              activeTab === tab ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab}
            {tab === 'pending' && reviews.filter(r => r.status === 'pending').length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${activeTab === 'pending' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
                {reviews.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-24 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl">
            <Star size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-semibold">No {activeTab} reviews found.</p>
          </div>
        ) : (
          filtered.map(review => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-6 justify-between items-start hover:shadow-lg transition">
              
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-gray-900 font-bold text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    {review.productName}
                  </span>
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-gray-300" : ""} />)}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">{review.comment}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">
                  <span className="flex items-center gap-1.5 text-gray-700"><User size={14} className="text-gray-400" /> {review.userName}</span>
                  {review.verified && <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200"><ShieldCheck size={12} /> Verified Buyer</span>}
                  <span>{review.createdAt?.toDate().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto pt-4 md:pt-0 border-t border-gray-50 md:border-0 mt-4 md:mt-0">
                {activeTab === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(review.id, 'approved')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold text-sm border border-green-200 transition cursor-pointer shadow-sm">
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button onClick={() => updateStatus(review.id, 'rejected')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-sm border border-amber-200 transition cursor-pointer shadow-sm">
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}
                <button onClick={() => deleteReview(review.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-sm border border-red-200 transition cursor-pointer shadow-sm">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
