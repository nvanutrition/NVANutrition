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
 CheckCircle, XCircle, Tag, DollarSign, BarChart2, Gift, Save, Upload, X
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
 return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/25"><XCircle size={11} /> Out of Stock</span>;
 if (stock <= 10)
 return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25"><AlertTriangle size={11} /> Low ({stock})</span>;
 return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/25"><CheckCircle size={11} /> {stock}</span>;
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
 if (field !== current) return <ChevronsUpDown size={13} className="text-gray-600 ml-1 inline" />;
 return dir === 'asc'
 ? <ChevronUp size={13} className="text-green-400 ml-1 inline" />
 : <ChevronDown size={13} className="text-green-400 ml-1 inline" />;
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

 // Search
 if (search) {
 const q = search.toLowerCase();
 list = list.filter(p =>
 p.name.toLowerCase().includes(q) ||
 (p.sku || '').toLowerCase().includes(q) ||
 p.category.toLowerCase().includes(q)
 );
 }

 // Category filter
 if (categoryFilter !== 'All') list = list.filter(p => p.category === categoryFilter);

 // Stock filter
 if (stockFilter === 'In Stock') list = list.filter(p => p.stock > 10);
 else if (stockFilter === 'Low Stock') list = list.filter(p => p.stock > 0 && p.stock <= 10);
 else if (stockFilter === 'Out of Stock') list = list.filter(p => p.stock === 0);

 // Sort
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
 const prefix = (giftForm.name.trim().split(/\\s+/).map(w => w[0]).join('').replace(/[^a-zA-Z]/g, '') || 'GIFT').toUpperCase();
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
 <div className="min-h-screen bg-gradient-dark p-6 space-y-6">

 {/* ─── Page Header ─── */}
 <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
 className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
 <Package className="text-green-500" size={28} />
 Product Catalog
 </h1>
 <p className="text-muted-foreground text-sm mt-1">
 Manage your storefront products and promotional free gifts
 </p>
 </div>
 <div className="flex items-center gap-3">
 <button
 onClick={fetchProducts}
 className="p-2.5 glass border border-border rounded-xl text-muted-foreground hover:text-foreground transition cursor-pointer"
 title="Refresh"
 >
 <RefreshCw size={18} />
 </button>
 {activeTab === 'storefront' ? (
 <motion.button
 whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
 onClick={() => router.push('/admin/products/edit')}
 className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-green-500/20 cursor-pointer text-sm"
 >
 <Plus size={18} /> Add Product
 </motion.button>
 ) : (
 <motion.button
 whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
 onClick={() => setShowAddGift(true)}
 className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-foreground px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 cursor-pointer text-sm"
 >
 <Gift size={18} /> Add Free Gift
 </motion.button>
 )}
 </div>
 </motion.div>

 {/* ─── Tabs ─── */}
 <div className="flex gap-2 p-1 glass rounded-xl border border-border w-fit">
 <button
 onClick={() => setActiveTab('storefront')}
 className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === 'storefront' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-muted-foreground hover:text-foreground'}`}
 >
 <Package size={16} /> Storefront Products
 </button>
 <button
 onClick={() => setActiveTab('free_gifts')}
 className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${activeTab === 'free_gifts' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-muted-foreground hover:text-foreground'}`}
 >
 <Gift size={16} /> Promotional Free Gifts
 </button>
 </div>

 {/* ─── Summary Stats Row ─── */}
 {activeTab === 'storefront' && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
 className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 {[
 { icon: Package, label: 'Store Products', value: stats.total, color: '#00C853' },
 { icon: Star, label: 'Featured', value: stats.featured, color: '#FBBF24' },
 { icon: AlertTriangle, label: 'Low Stock', value: stats.lowStock, color: '#F97316' },
 { icon: XCircle, label: 'Out of Stock', value: stats.outOfStock, color: '#EF4444' },
 ].map(({ icon: Icon, label, value, color }) => (
 <div key={label} className="glass rounded-xl p-4 border border-border flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
 style={{ backgroundColor: `${color}18` }}>
 <Icon size={20} style={{ color }} />
 </div>
 <div>
 <p className="text-2xl font-black text-foreground">{value}</p>
 <p className="text-xs text-gray-500 font-semibold">{label}</p>
 </div>
 </div>
 ))}
 </motion.div>
 )}

 {/* ─── Search & Filter Bar ─── */}
 {activeTab === 'storefront' && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
 className="glass rounded-xl border border-border p-4 space-y-3">
 <div className="flex flex-col sm:flex-row gap-3">
 {/* Search */}
 <div className="relative flex-1">
 <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
 <input
 type="text"
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Search by name, SKU, or category…"
 className="w-full pl-10 pr-4 py-2.5 bg-background/30 border border-border text-foreground placeholder:text-gray-600 rounded-xl focus:outline-none focus:border-green-500 transition text-sm"
 />
 </div>
 {/* Filter toggle */}
 <button
 onClick={() => setShowFilters(v => !v)}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition cursor-pointer ${showFilters ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'border-border text-muted-foreground hover:text-foreground'}`}
 >
 <Filter size={15} /> Filters {(categoryFilter !== 'All' || stockFilter !== 'All') && <span className="w-2 h-2 bg-green-400 rounded-full" />}
 </button>
 </div>

 <AnimatePresence>
 {showFilters && (
 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
 <div className="pt-3 border-t border-border flex flex-wrap gap-4">
 {/* Category */}
 <div className="flex flex-col gap-1.5">
 <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Category</span>
 <div className="flex flex-wrap gap-2">
 {CATEGORIES.map(cat => (
 <button key={cat} onClick={() => setCategoryFilter(cat)}
 className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${categoryFilter === cat ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'border-border text-muted-foreground hover:text-foreground'}`}>
 {cat}
 </button>
 ))}
 </div>
 </div>
 {/* Stock */}
 <div className="flex flex-col gap-1.5">
 <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Stock Status</span>
 <div className="flex flex-wrap gap-2">
 {STOCK_FILTERS.map(sf => (
 <button key={sf} onClick={() => setStockFilter(sf)}
 className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${stockFilter === sf ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'border-border text-muted-foreground hover:text-foreground'}`}>
 {sf}
 </button>
 ))}
 </div>
 </div>
 {(categoryFilter !== 'All' || stockFilter !== 'All') && (
 <button onClick={() => { setCategoryFilter('All'); setStockFilter('All'); }}
 className="self-end text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer">
 Clear filters
 </button>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 )}

 {/* ─── Products Table ─── */}
 {loading ? (
 <div className="flex justify-center py-24">
 <div className="flex flex-col items-center gap-3">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
 <p className="text-gray-500 text-sm">Loading products…</p>
 </div>
 </div>
 ) : filtered.length === 0 ? (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
 className="text-center py-20 glass rounded-xl border-2 border-dashed border-border">
 <Package size={44} className="mx-auto text-gray-600 mb-3" />
 <p className="text-muted-foreground text-base font-semibold">No products found</p>
 <p className="text-gray-600 text-sm mt-1">Try adjusting your search or filters</p>
 </motion.div>
 ) : (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
 className="glass rounded-xl border border-border overflow-hidden">

 {/* Result count */}
 <div className="px-5 py-3 border-b border-border flex items-center justify-between">
 <span className="text-sm text-muted-foreground">
 Showing <span className="text-foreground font-bold">{filtered.length}</span> of <span className="text-foreground font-bold">{products.length}</span> products
 </span>
 </div>

 {/* Table scroll wrapper */}
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border bg-white/3">
 {/* Image col — no sort */}
 <th className="px-4 py-3 text-left w-16">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Photo</span>
 </th>

 {/* Sortable cols */}
 {([
 { label: 'Product Name', field: 'name' as SortField },
 { label: 'Category', field: 'category' as SortField },
 ]).map(({ label, field }) => (
 <th key={field} className="px-4 py-3 text-left cursor-pointer group" onClick={() => toggleSort(field)}>
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-muted-foreground transition">
 {label} <SortIcon field={field} current={sortField} dir={sortDir} />
 </span>
 </th>
 ))}

 {/* SKU — no sort */}
 <th className="px-4 py-3 text-left">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</span>
 </th>

 {/* Price cols — sortable */}
 <th className="px-4 py-3 text-left cursor-pointer group" onClick={() => toggleSort('price')}>
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-muted-foreground transition">
 Pricing <SortIcon field="price" current={sortField} dir={sortDir} />
 </span>
 </th>

 {/* Stock — sortable */}
 <th className="px-4 py-3 text-left cursor-pointer group" onClick={() => toggleSort('stock')}>
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-muted-foreground transition">
 Stock <SortIcon field="stock" current={sortField} dir={sortDir} />
 </span>
 </th>

 {/* Featured */}
 <th className="px-4 py-3 text-center">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Featured</span>
 </th>

 {/* Actions */}
 <th className="px-4 py-3 text-right">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</span>
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 <AnimatePresence>
 {filtered.map((product, idx) => (
 <motion.tr
 key={product.id}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: 10 }}
 transition={{ delay: idx * 0.03 }}
 className="hover:bg-white/[0.03] transition group"
 >
 {/* Thumbnail */}
 <td className="px-4 py-3">
 <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center flex-shrink-0">
 {product.images?.[0] ? (
 <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-1" />
 ) : (
 <Package size={18} className="text-gray-600" />
 )}
 </div>
 </td>

 {/* Product Name */}
 <td className="px-4 py-3 max-w-[200px]">
 <p className="text-foreground font-semibold truncate">{product.name}</p>
 {product.flavors?.length > 0 && (
 <p className="text-gray-600 text-xs mt-0.5 truncate">{product.flavors.length} flavor{product.flavors.length > 1 ? 's' : ''}</p>
 )}
 </td>

 {/* Category */}
 <td className="px-4 py-3">
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/8 text-muted-foreground text-xs font-semibold border border-border">
 <Tag size={10} />
 {product.category}
 </span>
 </td>

 {/* SKU */}
 <td className="px-4 py-3">
 {product.sku ? (
 <span className="font-mono text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-lg">
 {product.sku}
 </span>
 ) : (
 <span className="text-gray-700 text-xs">—</span>
 )}
 </td>

 {/* Pricing */}
 <td className="px-4 py-3">
 <div className="flex flex-col">
 <span className="text-green-400 font-black text-base leading-tight">
 ₹{product.price.toLocaleString()}
 </span>
 {product.originalMrp && product.originalMrp > product.price && (
 <span className="text-gray-600 text-xs line-through">
 MRP ₹{product.originalMrp.toLocaleString()}
 </span>
 )}
 {product.discountPercent && product.discountPercent > 0 ? (
 <span className="text-amber-400 text-xs font-bold">{product.discountPercent}% off</span>
 ) : null}
 </div>
 </td>

 {/* Stock */}
 <td className="px-4 py-3">
 <StockBadge stock={product.stock ?? 0} />
 </td>

 {/* Featured */}
 <td className="px-4 py-3 text-center">
 {product.isFeatured ? (
 <span title="Featured product" className="inline-flex items-center justify-center">
 <Star size={18} className="text-yellow-400 fill-yellow-400" />
 </span>
 ) : (
 <span className="text-gray-700">—</span>
 )}
 </td>

 {/* Actions */}
 <td className="px-4 py-3">
 <div className="flex items-center justify-end gap-2">
 <a
 href={`/products/${product.sku || product.id}`}
 target="_blank"
 rel="noopener noreferrer"
 title="View on storefront"
 className="p-2 rounded-lg text-gray-500 hover:text-foreground hover:bg-muted transition cursor-pointer"
 >
 <Eye size={15} />
 </a>
 <button
 onClick={() => router.push(`/admin/products/edit?id=${product.id}`)}
 title="Edit product"
 className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/15 border border-transparent hover:border-blue-500/20 transition cursor-pointer"
 >
 <Edit2 size={15} />
 </button>
 <button
 onClick={() => handleDelete(product)}
 disabled={deletingId === product.id}
 title="Delete product"
 className="p-2 rounded-lg text-red-400 hover:bg-red-500/15 border border-transparent hover:border-red-500/20 transition cursor-pointer disabled:opacity-40"
 >
 {deletingId === product.id
 ? <div className="h-3.5 w-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
 : <Trash2 size={15} />
 }
 </button>
 </div>
 </td>
 </motion.tr>
 ))}
 </AnimatePresence>
 </tbody>
 </table>
 </div>

 {/* Table footer */}
 <div className="px-5 py-3 border-t border-border flex justify-between items-center text-xs text-gray-600">
 <span>Click column headers to sort {activeTab === 'storefront' && <>· <Star size={10} className="inline text-yellow-400 fill-yellow-400" /> = shown on homepage</>}</span>
 <span>Last refreshed: {new Date().toLocaleTimeString()}</span>
 </div>
 </motion.div>
 )}

 {/* ─── Add Free Gift Modal ─── */}
 <AnimatePresence>
 {showAddGift && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
 className="bg-[#0a0f0a] border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
 <div className="px-6 py-4 border-b border-border flex items-center justify-between">
 <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Gift className="text-blue-400" size={18} /> Add Free Gift</h3>
 <button onClick={() => setShowAddGift(false)} className="text-gray-500 hover:text-foreground transition"><XCircle size={20} /></button>
 </div>
 <form onSubmit={handleSaveGift} className="p-6 space-y-4">
 <div>
 <label className="text-xs font-semibold text-muted-foreground block mb-1">Gift Name <span className="text-red-400">*</span></label>
 <input type="text" required value={giftForm.name} onChange={e => setGiftForm(p => ({ ...p, name: e.target.value }))}
 className="w-full px-4 py-2.5 bg-background/30 border border-border text-foreground placeholder:text-gray-600 rounded-xl focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 text-sm"
 placeholder="e.g. Free Shaker Bottle" />
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground block mb-1">Gift Image</label>
 {!giftFile ? (
 <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/15 hover:border-blue-500/40 rounded-xl cursor-pointer bg-background/20 hover:bg-background/30 transition group">
 <Upload size={20} className="text-gray-500 group-hover:text-blue-400 transition mb-1" />
 <span className="text-xs font-semibold text-gray-500 group-hover:text-muted-foreground transition">Click to upload image</span>
 <input type="file" accept="image/*" className="hidden" onChange={e => {
 const file = e.target.files?.[0];
 if (file) setGiftFile({ file, preview: URL.createObjectURL(file) });
 }} />
 </label>
 ) : (
 <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-blue-500/30 group">
 <img src={giftFile.preview} alt="Preview" className="w-full h-full object-contain bg-muted" />
 <button type="button" onClick={() => setGiftFile(null)} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-foreground opacity-0 group-hover:opacity-100 transition shadow-lg cursor-pointer">
 <X size={12} />
 </button>
 </div>
 )}
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground block mb-1">Available Stock <span className="text-red-400">*</span></label>
 <input type="number" required min={0} value={giftForm.stock} onChange={e => setGiftForm(p => ({ ...p, stock: e.target.value }))}
 className="w-full px-4 py-2.5 bg-background/30 border border-border text-foreground rounded-xl focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 text-sm" />
 </div>
 <div className="pt-4 flex gap-3">
 <button type="button" onClick={() => setShowAddGift(false)}
 className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition font-semibold text-sm">Cancel</button>
 <button type="submit" disabled={savingGift}
 className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-foreground rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition">
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
