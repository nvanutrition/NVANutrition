'use client';

import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Edit2, Trash2, Plus, Package, Search, Star, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown, Filter, Eye, RefreshCw,
  CheckCircle, XCircle, Tag, DollarSign, Gift, Save, Upload, X
} from 'lucide-react';
import { NutritionOption } from '@/lib/db-products';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  weight?: string;
  weightUnit?: string;
  benefits: string[];
  flavors: string[];
  servings: number;
  images: string[];
  originalMrp?: number;
  discountPercent?: number;
  sku?: string;
  isFeatured?: boolean;
  priority?: number;
  nutritionOptions?: NutritionOption[];
  ingredients?: any[];
  usage?: string;
  fullIngredients?: string;
  isFreeGift?: boolean;
}

type SortField = 'name' | 'price' | 'stock' | 'category' | 'priority';
type SortDir = 'asc' | 'desc';

const CATEGORIES = ['All', 'Whey Protein', 'Mass Gainer', 'Creatine', 'BCAA', 'Pre Workout', 'Fat Burner', 'Multivitamin', 'Supplements'];
const STOCK_FILTERS = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider"><XCircle size={12} /> Out of Stock</span>;
  if (stock <= 10)
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider"><AlertTriangle size={12} /> Low ({stock})</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider"><CheckCircle size={12} /> {stock} In Stock</span>;
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ChevronsUpDown size={14} className="text-gray-400 ml-1 inline" />;
  return dir === 'asc'
    ? <ChevronUp size={14} className="text-black ml-1 inline" />
    : <ChevronDown size={14} className="text-black ml-1 inline" />;
}

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Free Gifts tab
  const [activeTab, setActiveTab] = useState<'storefront' | 'free_gifts'>('storefront');
  const [showAddGift, setShowAddGift] = useState(false);
  const [giftForm, setGiftForm] = useState({ name: '', stock: '100' });
  const [giftFile, setGiftFile] = useState<{file: File, preview: string} | null>(null);
  const [savingGift, setSavingGift] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list: Product[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Product));
      setProducts(list);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    try {
      for (const url of (product.images || [])) {
        try { await deleteObject(ref(storage, url)); } catch { /* ignore */ }
      }
      await deleteDoc(doc(db, 'products', product.id));
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = activeTab === 'storefront'
      ? products.filter(p => !p.isFreeGift)
      : products.filter(p => p.isFreeGift);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'All') list = list.filter(p => p.category === categoryFilter);

    if (stockFilter === 'In Stock') list = list.filter(p => p.stock > 10);
    else if (stockFilter === 'Low Stock') list = list.filter(p => p.stock > 0 && p.stock <= 10);
    else if (stockFilter === 'Out of Stock') list = list.filter(p => p.stock === 0);

    list.sort((a, b) => {
      let av: any = a[sortField] ?? '';
      let bv: any = b[sortField] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [products, search, categoryFilter, stockFilter, sortField, sortDir, activeTab]);

  const stats = useMemo(() => {
    const storefrontProducts = products.filter(p => !p.isFreeGift);
    return {
      total: storefrontProducts.length,
      featured: storefrontProducts.filter(p => p.isFeatured).length,
      lowStock: storefrontProducts.filter(p => p.stock > 0 && p.stock <= 10).length,
      outOfStock: storefrontProducts.filter(p => p.stock === 0).length,
    };
  }, [products]);

  const handleSaveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftForm.name || !giftForm.stock) return toast.error('Name and stock required');
    setSavingGift(true);
    try {
      const prefix = (giftForm.name.trim().split(/\s+/).map(w => w[0]).join('').replace(/[^a-zA-Z]/g, '') || 'GIFT').toUpperCase();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const sku = `GIFT-${prefix}-${rand}`;
      
      const payload = {
        name: giftForm.name,
        category: 'Free Gift',
        price: 0,
        stock: parseInt(giftForm.stock),
        images: [] as string[],
        sku,
        isFreeGift: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (giftFile) {
        const path = `products/gifts/${Date.now()}-${giftFile.file.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, giftFile.file);
        const url = await getDownloadURL(fileRef);
        payload.images = [url];
      }
      
      const docRef = await import('firebase/firestore').then(m => m.addDoc(collection(db, 'products'), payload));
      setProducts(p => [...p, { id: docRef.id, ...payload, benefits: [], flavors: [], servings: 0 } as any]);
      setShowAddGift(false);
      setGiftForm({ name: '', stock: '100' });
      setGiftFile(null);
      toast.success('Free gift created!');
    } catch (err) {
      toast.error('Failed to create gift');
    } finally {
      setSavingGift(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-[#fcfcfc] min-h-screen font-sans">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <Package size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Manage storefront inventory and free gifts</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchProducts} className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-black hover:bg-gray-50 transition shadow-sm" title="Refresh">
            <RefreshCw size={18} />
          </button>
          {activeTab === 'storefront' ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/admin/products/edit')}
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-black/10 transition text-sm">
              <Plus size={18} /> Add Product
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAddGift(true)}
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-black/10 transition text-sm">
              <Gift size={18} /> Add Free Gift
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-fit mb-8">
        <button onClick={() => setActiveTab('storefront')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${activeTab === 'storefront' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
          <Package size={16} /> Storefront Products
        </button>
        <button onClick={() => setActiveTab('free_gifts')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${activeTab === 'free_gifts' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
          <Gift size={16} /> Promotional Gifts
        </button>
      </div>

      {/* Summary Stats Row */}
      {activeTab === 'storefront' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Package, label: 'Store Products', value: stats.total, color: 'text-gray-900', bg: 'bg-gray-50' },
            { icon: Star, label: 'Featured', value: stats.featured, color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { icon: AlertTriangle, label: 'Low Stock', value: stats.lowStock, color: 'text-amber-500', bg: 'bg-amber-50' },
            { icon: XCircle, label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-500', bg: 'bg-red-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} mb-4`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Main Content Area */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {/* Search & Filters Header */}
        <div className="p-5 border-b border-gray-50 bg-white">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU, or category..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition" />
            </div>
            {activeTab === 'storefront' && (
              <button onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition ${showFilters ? 'bg-gray-100 border-gray-200 text-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <Filter size={16} /> Filters {(categoryFilter !== 'All' || stockFilter !== 'All') && <span className="w-2 h-2 bg-black rounded-full" />}
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && activeTab === 'storefront' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pt-4 mt-4 border-t border-gray-50 flex flex-wrap gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</span>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${categoryFilter === cat ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stock</span>
                    <div className="flex flex-wrap gap-2">
                      {STOCK_FILTERS.map(sf => (
                        <button key={sf} onClick={() => setStockFilter(sf)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${stockFilter === sf ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                          {sf}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(categoryFilter !== 'All' || stockFilter !== 'All') && (
                    <button onClick={() => { setCategoryFilter('All'); setStockFilter('All'); }}
                      className="self-end mb-1 text-xs text-red-500 hover:text-red-600 font-bold underline transition">
                      Clear Filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package size={40} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 font-semibold">No products found.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-gray-50 w-16">Photo</th>
                  {[
                    { label: 'Product Details', field: 'name' as SortField },
                    { label: 'Category', field: 'category' as SortField },
                  ].map(({ label, field }) => (
                    <th key={field} className="px-6 py-4 font-semibold border-b border-gray-50 cursor-pointer group hover:bg-gray-100/50 transition" onClick={() => toggleSort(field)}>
                      {label} <SortIcon field={field} current={sortField} dir={sortDir} />
                    </th>
                  ))}
                  <th className="px-6 py-4 font-semibold border-b border-gray-50">SKU</th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-50 cursor-pointer group hover:bg-gray-100/50 transition" onClick={() => toggleSort('price')}>
                    Pricing <SortIcon field="price" current={sortField} dir={sortDir} />
                  </th>
                  <th className="px-6 py-4 font-semibold border-b border-gray-50 cursor-pointer group hover:bg-gray-100/50 transition" onClick={() => toggleSort('stock')}>
                    Stock <SortIcon field="stock" current={sortField} dir={sortDir} />
                  </th>
                  {activeTab === 'storefront' && (
                    <th className="px-6 py-4 font-semibold border-b border-gray-50 text-center">Featured</th>
                  )}
                  <th className="px-6 py-4 font-semibold border-b border-gray-50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence>
                  {filtered.map((product) => (
                    <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-gray-50/50 transition group">
                      
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-xl border border-gray-100 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-1.5" />
                          ) : (
                            <Package size={18} className="text-gray-300" />
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-gray-900 font-bold text-sm truncate mb-0.5">{product.name}</p>
                        {product.flavors?.length > 0 && (
                          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{product.flavors.length} flavor(s)</p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-200 uppercase tracking-wider">
                          <Tag size={10} /> {product.category}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {product.sku ? (
                          <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded-md tracking-widest">{product.sku}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-black text-sm">₹{product.price.toLocaleString()}</span>
                          {product.originalMrp && product.originalMrp > product.price && (
                            <span className="text-gray-400 text-[10px] font-bold line-through mt-0.5">MRP ₹{product.originalMrp.toLocaleString()}</span>
                          )}
                          {product.discountPercent && product.discountPercent > 0 ? (
                            <span className="text-amber-500 text-[10px] font-black uppercase mt-0.5 tracking-wider">{product.discountPercent}% OFF</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StockBadge stock={product.stock ?? 0} />
                      </td>

                      {activeTab === 'storefront' && (
                        <td className="px-6 py-4 text-center">
                          {product.isFeatured ? <Star size={16} className="text-yellow-400 fill-yellow-400 mx-auto" /> : <span className="text-gray-300">—</span>}
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`/products/${product.sku || product.id}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition shadow-sm" title="View Store">
                            <Eye size={14} />
                          </a>
                          {!product.isFreeGift && (
                            <button onClick={() => router.push(`/admin/products/edit?id=${product.id}`)} className="p-2 bg-white border border-gray-200 rounded-xl text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition shadow-sm" title="Edit">
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(product)} disabled={deletingId === product.id} className="p-2 bg-white border border-gray-200 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition shadow-sm disabled:opacity-50" title="Delete">
                            {deletingId === product.id ? <div className="h-3.5 w-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>

                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500 font-medium">
          <span>Click column headers to sort {activeTab === 'storefront' && <>• <Star size={10} className="inline text-yellow-400 fill-yellow-400" /> = featured on homepage</>}</span>
          <span>Showing {filtered.length} products</span>
        </div>
      </motion.div>

      {/* Add Free Gift Modal */}
      <AnimatePresence>
        {showAddGift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-gray-100 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                    <Gift size={18} className="text-gray-900" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Add Free Gift</h3>
                </div>
                <button onClick={() => setShowAddGift(false)} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-900"><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveGift} className="p-6 space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Gift Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={giftForm.name} onChange={e => setGiftForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-400 rounded-xl focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm font-semibold"
                    placeholder="e.g. Premium Shaker Bottle" />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Gift Image</label>
                  {!giftFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition group">
                      <Upload size={24} className="text-gray-400 group-hover:text-gray-600 transition mb-2" />
                      <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 transition">Click to upload image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setGiftFile({ file, preview: URL.createObjectURL(file) });
                      }} />
                    </label>
                  ) : (
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-200 group bg-gray-50">
                      <img src={giftFile.preview} alt="Preview" className="w-full h-full object-contain" />
                      <button type="button" onClick={() => setGiftFile(null)} className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 transition shadow-sm cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Available Stock <span className="text-red-500">*</span></label>
                  <input type="number" required min={0} value={giftForm.stock} onChange={e => setGiftForm(p => ({ ...p, stock: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition text-sm font-semibold" />
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowAddGift(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition font-bold text-sm">Cancel</button>
                  <button type="submit" disabled={savingGift}
                    className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-black/10 transition">
                    {savingGift ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                    Create Gift
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
