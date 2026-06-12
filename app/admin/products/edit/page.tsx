'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
 ArrowLeft, Save, Tag, DollarSign, FileText, Zap, List, Image as ImageIcon,
 Plus, Trash2, X, Upload, Star, Eye, ChevronRight, CheckCircle, AlertCircle,
 Package, Info, Leaf, Flame, Activity, Dumbbell, Droplets
} from 'lucide-react';
import { NutritionOption } from '@/lib/db-products';
import { Suspense } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Ingredient { name: string; quantity: string; unit: string; logo?: string }

interface FormData {
 name: string;
 category: string;
 sku: string;
 weight: string;
 weightUnit: string;
 servings: string;
 flavors: string;
 originalMrp: string;
 discountPercent: string;
 price: string;
 stock: string;
 isFeatured: boolean;
 priority: string;
 shortDescription: string;
 longDescription: string;
 benefits: string;
 usage: string;
 fullIngredients: string;
 nutritionOptions: NutritionOption[];
 ingredients: Ingredient[];
 images: string[];
}

const EMPTY_FORM: FormData = {
 name: '', category: 'Whey Protein', sku: '', weight: '', weightUnit: 'kg',
 servings: '30', flavors: '', originalMrp: '', discountPercent: '', price: '',
 stock: '', isFeatured: false, priority: '5', shortDescription: '', longDescription: '',
 benefits: '', usage: '', fullIngredients: '', nutritionOptions: [], ingredients: [], images: [],
};

const CATEGORIES = ['Whey Protein', 'Mass Gainer', 'Creatine', 'BCAA', 'Pre Workout', 'Fat Burner', 'Multivitamin', 'Supplements'];
const WEIGHT_UNITS = ['g', 'kg', 'lbs', 'ml', 'l'];

const LOGO_OPTIONS = [
 { value: 'default', label: 'Default', icon: Package },
 { value: 'leaf', label: 'Leaf / Natural', icon: Leaf },
 { value: 'zap', label: 'Energy', icon: Zap },
 { value: 'dumbbell', label: 'Muscle', icon: Dumbbell },
 { value: 'flame', label: 'Flame', icon: Flame },
 { value: 'droplet', label: 'Liquid', icon: Droplets },
 { value: 'activity', label: 'Health Pulse', icon: Activity },
];

const TABS = [
 { id: 'basic', label: 'Basic Info', icon: Tag, hint: 'Name, category, SKU, variants' },
 { id: 'pricing', label: 'Pricing', icon: DollarSign, hint: 'MRP, discount, selling price, stock' },
 { id: 'content', label: 'Content', icon: FileText, hint: 'Descriptions shown on storefront' },
 { id: 'nutrition', label: 'Nutrition', icon: Zap, hint: 'Macros shown on product page' },
 { id: 'ingredients', label: 'Ingredients', icon: List, hint: 'Active ingredients with amounts' },
 { id: 'images', label: 'Images', icon: ImageIcon, hint: 'Product photos' },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
 return (
 <div>
 <label className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-1.5">
 {label}
 {required && <span className="text-red-400">*</span>}
 {hint && (
 <span className="ml-auto text-[10px] text-gray-600 font-normal flex items-center gap-1">
 <Eye size={9} /> {hint}
 </span>
 )}
 </label>
 {children}
 </div>
 );
}

const inputCls = "w-full px-4 py-2.5 bg-background/30 border border-border text-foreground placeholder:text-gray-600 rounded-xl focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition text-sm";
const selectCls = "w-full px-4 py-2.5 bg-background/30 border border-border text-foreground rounded-xl focus:outline-none focus:border-green-500/60 transition text-sm";
const textareaCls = "w-full px-4 py-2.5 bg-background/30 border border-border text-foreground placeholder:text-gray-600 rounded-xl focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition text-sm resize-none";

// ─── Live Preview Card ───────────────────────────────────────────────────────
function LivePreview({ data, previewImage }: { data: FormData; previewImage?: string }) {
 const discount = parseFloat(data.discountPercent) || 0;
 const price = parseFloat(data.price) || 0;
 const mrp = parseFloat(data.originalMrp) || 0;

 return (
 <div className="sticky top-6 space-y-4">
 <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
 <Eye size={12} /> Live Preview — Customer View
 </div>

 {/* Product Card Preview */}
 <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#0d1117] shadow-2xl">
 {/* Image */}
 <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] h-52 flex items-center justify-center overflow-hidden">
 {previewImage || data.images[0] ? (
 <img src={previewImage || data.images[0]} alt={data.name || 'Product'} className="h-full object-contain p-4" />
 ) : (
 <div className="flex flex-col items-center gap-2 text-gray-600">
 <ImageIcon size={36} />
 <span className="text-xs">No image</span>
 </div>
 )}
 {discount > 0 && (
 <div className="absolute top-3 left-3 bg-green-600 text-foreground text-xs font-black px-2.5 py-1 rounded-lg shadow">
 {discount}% OFF
 </div>
 )}
 {data.isFeatured && (
 <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
 <Star size={10} className="fill-black" /> FEATURED
 </div>
 )}
 </div>

 {/* Info */}
 <div className="p-4 space-y-3">
 {data.category && (
 <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{data.category}</span>
 )}
 <h3 className="text-foreground font-bold text-base leading-snug">
 {data.name || <span className="text-gray-600">Product Name</span>}
 </h3>
 <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
 {data.shortDescription || <span className="text-gray-700">Short description will appear here on the product card…</span>}
 </p>

 {/* Pricing */}
 <div className="flex items-baseline gap-2">
 <span className="text-green-400 font-black text-xl">
 {price > 0 ? `₹${price.toLocaleString()}` : <span className="text-gray-600">₹ —</span>}
 </span>
 {mrp > price && mrp > 0 && (
 <span className="text-gray-600 text-xs line-through">₹{mrp.toLocaleString()}</span>
 )}
 </div>

 {/* Flavors chips */}
 {data.flavors && (
 <div className="flex flex-wrap gap-1.5">
 {data.flavors.split(',').map(f => f.trim()).filter(Boolean).slice(0, 4).map(f => (
 <span key={f} className="px-2 py-0.5 rounded-full bg-white/8 text-muted-foreground text-[10px] font-semibold border border-border">{f}</span>
 ))}
 </div>
 )}

 {/* Nutrition preview */}
 {data.nutritionOptions.length > 0 && (
 <div className="grid grid-cols-2 gap-1.5 pt-1">
 {data.nutritionOptions.slice(0, 4).map((n, i) => (
 <div key={i} className="bg-muted rounded-lg px-2.5 py-1.5 text-center border border-white/8">
 <p className="text-foreground text-xs font-black">{n.quantity}{n.unit}</p>
 <p className="text-gray-500 text-[10px]">{n.name}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Field mapping legend */}
 <div className="rounded-xl border border-border bg-white/3 p-4 space-y-2">
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Field → Storefront Mapping</p>
 {[
 { field: 'Short Description', where: 'Product card & listing page' },
 { field: 'Long Description', where: 'Product detail page — About section' },
 { field: 'Benefits', where: 'Product detail page — Key Benefits tab' },
 { field: 'Usage', where: 'Product detail page — How to Use tab' },
 { field: 'Full Ingredients', where: 'Product label text block' },
 { field: 'Nutrition Macros', where: 'Nutrition grid on detail page' },
 { field: 'Key Ingredients', where: 'Ingredients spotlight cards' },
 ].map(({ field, where }) => (
 <div key={field} className="flex items-start gap-2 text-xs">
 <ChevronRight size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
 <div>
 <span className="text-foreground font-semibold">{field}</span>
 <span className="text-gray-600"> → {where}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ProductEditInner() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const editId = searchParams.get('id');
 const isEditing = !!editId;

 const [form, setForm] = useState<FormData>(EMPTY_FORM);
 const [activeTab, setActiveTab] = useState<TabId>('basic');
 const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);
 const [saving, setSaving] = useState(false);
 const [loadingProduct, setLoadingProduct] = useState(isEditing);

 // Auto-calc price
 useEffect(() => {
 const mrp = parseFloat(form.originalMrp);
 const disc = parseFloat(form.discountPercent);
 if (!isNaN(mrp) && !isNaN(disc)) {
 setForm(p => ({ ...p, price: Math.round(mrp * (1 - disc / 100)).toString() }));
 }
 }, [form.originalMrp, form.discountPercent]);

 // Load product if editing
 useEffect(() => {
 if (!editId) return;
 (async () => {
 try {
 const docSnap = await getDoc(doc(db, 'products', editId));
 if (!docSnap.exists()) { toast.error('Product not found'); router.push('/admin/products'); return; }
 const d = docSnap.data() as any;
 setForm({
 name: d.name || '',
 category: d.category || 'Whey Protein',
 sku: d.sku || '',
 weight: d.weight || '',
 weightUnit: d.weightUnit || 'kg',
 servings: d.servings?.toString() || '30',
 flavors: Array.isArray(d.flavors) ? d.flavors.join(', ') : (d.flavors || ''),
 originalMrp: d.originalMrp?.toString() || '',
 discountPercent: d.discountPercent?.toString() || '0',
 price: d.price?.toString() || '',
 stock: d.stock?.toString() || '',
 isFeatured: d.isFeatured || false,
 priority: d.priority?.toString() || '5',
 shortDescription: d.shortDescription || d.description || '',
 longDescription: d.longDescription || d.description || '',
 benefits: Array.isArray(d.benefits) ? d.benefits.join(', ') : (d.benefits || ''),
 usage: d.usage || '',
 fullIngredients: d.fullIngredients || '',
 nutritionOptions: d.nutritionOptions || [],
 ingredients: (d.ingredients || []).map((ing: any) =>
 typeof ing === 'string' ? { name: ing, quantity: '', unit: 'g', logo: 'default' } : ing
 ),
 images: d.images || [],
 });
 } catch { toast.error('Failed to load product'); }
 finally { setLoadingProduct(false); }
 })();
 }, [editId]);

 const up = useCallback((patch: Partial<FormData>) => setForm(p => ({ ...p, ...patch })), []);

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = Array.from(e.target.files || []);
 setSelectedFiles(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
 };

 const addImageUrl = (url: string) => {
 if (url) setForm(p => ({ ...p, images: [...p.images, url] }));
 };

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!form.name || !form.price || !form.stock) {
 toast.error('Product name, selling price and stock are required');
 return;
 }

 setSaving(true);
 try {
 // Upload new files
 const newUrls: string[] = [];
 for (let i = 0; i < selectedFiles.length; i++) {
 const { file } = selectedFiles[i];
 const path = `products/${editId || Date.now()}/${i}-${file.name}`;
 const fileRef = ref(storage, path);
 await uploadBytes(fileRef, file);
 newUrls.push(await getDownloadURL(fileRef));
 }

 // Generate SKU if new
 let sku = form.sku;
 if (!isEditing) {
 const prefix = (form.name.trim().split(/\\s+/).map(w => w[0]).join('').replace(/[^a-zA-Z]/g, '') || 'PRD').toUpperCase();
 const rand = Math.floor(1000 + Math.random() * 9000);
 const wt = form.weight ? `-${form.weight}${form.weightUnit}` : '';
 sku = `${prefix}-${rand}${wt}`.toUpperCase();
 }

 const payload = {
 name: form.name,
 category: form.category,
 sku,
 weight: form.weight,
 weightUnit: form.weightUnit,
 servings: parseInt(form.servings) || 30,
 flavors: form.flavors.split(',').map(f => f.trim()).filter(Boolean),
 originalMrp: parseFloat(form.originalMrp) || parseFloat(form.price),
 discountPercent: parseFloat(form.discountPercent) || 0,
 price: parseFloat(form.price),
 stock: parseInt(form.stock),
 isFeatured: form.isFeatured,
 priority: parseInt(form.priority) || 5,
 shortDescription: form.shortDescription,
 longDescription: form.longDescription,
 description: form.shortDescription, // backward compat
 benefits: form.benefits.split(',').map(b => b.trim()).filter(Boolean),
 usage: form.usage,
 fullIngredients: form.fullIngredients,
 nutritionOptions: form.nutritionOptions,
 ingredients: form.ingredients,
 images: [...form.images, ...newUrls],
 updatedAt: new Date(),
 };

 if (isEditing) {
 await updateDoc(doc(db, 'products', editId!), payload);
 toast.success('Product updated!');
 } else {
 await addDoc(collection(db, 'products'), { ...payload, rating: 5.0, reviews: 0, createdAt: new Date() });
 toast.success('Product created!');
 }
 router.push('/admin/products');
 } catch (err) {
 console.error(err);
 toast.error('Failed to save product');
 } finally {
 setSaving(false);
 }
 };

 if (loadingProduct) {
 return (
 <div className="flex items-center justify-center h-screen bg-gradient-dark">
 <div className="flex flex-col items-center gap-3">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
 <p className="text-muted-foreground text-sm">Loading product…</p>
 </div>
 </div>
 );
 }

 const previewFile = selectedFiles[0]?.preview;

 return (
 <div className="min-h-screen bg-gradient-dark">
 <form onSubmit={handleSave}>
 {/* ─── Sticky Top Bar ─── */}
 <div className="sticky top-0 z-30 bg-[#0a0f0a]/90 backdrop-blur-xl border-b border-border px-6 py-3 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={() => router.push('/admin/products')}
 className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
 >
 <ArrowLeft size={18} />
 </button>
 <div>
 <h1 className="text-foreground font-bold text-lg leading-tight">
 {isEditing ? 'Edit Product' : 'Add New Product'}
 </h1>
 <p className="text-gray-500 text-xs">
 {isEditing ? `Editing: ${form.name}` : 'Fill in the details below'}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={() => router.push('/admin/products')}
 className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition text-sm font-semibold cursor-pointer"
 >
 Cancel
 </button>
 <motion.button
 type="submit"
 whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
 disabled={saving}
 className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-black px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 cursor-pointer transition"
 >
 {saving ? <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
 {saving ? 'Saving…' : (isEditing ? 'Save Changes' : 'Create Product')}
 </motion.button>
 </div>
 </div>

 {/* ─── Body ─── */}
 <div className="p-6 flex gap-6 items-start max-w-[1400px] mx-auto">
 {/* Left: Tabs + Form */}
 <div className="flex-1 min-w-0 space-y-5">

 {/* Tab strip */}
 <div className="flex overflow-x-auto gap-1 p-1 glass rounded-2xl border border-border no-scrollbar">
 {TABS.map(tab => (
 <button
 key={tab.id}
 type="button"
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 cursor-pointer ${
 activeTab === tab.id
 ? 'bg-green-500/20 text-green-400 border border-green-500/30'
 : 'text-gray-500 hover:text-muted-foreground hover:bg-muted'
 }`}
 >
 <tab.icon size={15} />
 {tab.label}
 </button>
 ))}
 </div>

 {/* Tab hint */}
 <div className="flex items-center gap-2 text-xs text-gray-600 bg-white/3 border border-white/8 rounded-xl px-4 py-2.5">
 <Info size={12} className="text-green-500 flex-shrink-0" />
 <span><strong className="text-muted-foreground">{TABS.find(t => t.id === activeTab)?.label}:</strong> {TABS.find(t => t.id === activeTab)?.hint}</span>
 </div>

 {/* ── TAB: Basic Info ── */}
 <AnimatePresence mode="wait">
 {activeTab === 'basic' && (
 <motion.div key="basic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
 className="glass rounded-2xl border border-border p-6 space-y-5">
 <h2 className="text-foreground font-bold text-base flex items-center gap-2"><Tag size={16} className="text-green-400" /> Basic Information</h2>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="md:col-span-2">
 <Field label="Product Name" required>
 <input className={inputCls} value={form.name} onChange={e => up({ name: e.target.value })} placeholder="e.g., NVA Whey Protein Pro" />
 </Field>
 </div>

 <Field label="Category" required>
 <select className={selectCls} value={form.category} onChange={e => up({ category: e.target.value })}>
 {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
 </select>
 </Field>

 <Field label="SKU / Product Code" hint={isEditing ? "Fixed" : "Auto-generated based on name & weight"}>
 <input className={`${inputCls} opacity-50 cursor-not-allowed`} disabled value={form.sku}
 placeholder={isEditing ? form.sku || '—' : 'Will be auto-generated (e.g. RGPC-1234)'} />
 </Field>

 {/* Weight row */}
 <div>
 <label className="text-sm font-semibold text-muted-foreground block mb-1.5">Product Weight / Size</label>
 <div className="flex gap-2">
 <input type="number" step="any" className={`${inputCls} flex-1 min-w-0`} value={form.weight} onChange={e => up({ weight: e.target.value })} placeholder="e.g., 2" />
 <select className="w-24 px-4 py-2.5 bg-background/30 border border-border text-foreground rounded-xl focus:outline-none focus:border-green-500/60 transition text-sm flex-shrink-0" value={form.weightUnit} onChange={e => up({ weightUnit: e.target.value })}>
 {WEIGHT_UNITS.map(u => <option key={u} value={u} className="bg-gray-900">{u}</option>)}
 </select>
 </div>
 </div>

 <Field label="Total Servings per Pack">
 <input type="number" className={inputCls} value={form.servings} onChange={e => up({ servings: e.target.value })} placeholder="30" />
 </Field>

 <div className="md:col-span-2">
 <Field label="Available Flavors" hint="Shown as selectable chips on product page">
 <input className={inputCls} value={form.flavors} onChange={e => up({ flavors: e.target.value })}
 placeholder="Double Rich Chocolate, Vanilla Ice Cream, Strawberry… (comma separated)" />
 </Field>
 </div>

 {/* Display / Featured */}
 <Field label="Display Priority" hint="1 = highest priority on homepage (lower number = shown first)">
 <input type="number" min={1} max={10} className={inputCls} value={form.priority} onChange={e => up({ priority: e.target.value })} placeholder="5" />
 </Field>

 <div className="flex items-end">
 <label className="flex items-center gap-3 cursor-pointer select-none">
 <div
 onClick={() => up({ isFeatured: !form.isFeatured })}
 className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.isFeatured ? 'bg-green-500' : 'bg-muted'}`}
 >
 <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-6' : ''}`} />
 </div>
 <div>
 <p className="text-foreground font-semibold text-sm">Mark as Featured</p>
 <p className="text-gray-600 text-xs">Shown on the homepage featured section</p>
 </div>
 </label>
 </div>
 </div>
 </motion.div>
 )}

 {/* ── TAB: Pricing ── */}
 {activeTab === 'pricing' && (
 <motion.div key="pricing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
 className="glass rounded-2xl border border-border p-6 space-y-5">
 <h2 className="text-foreground font-bold text-base flex items-center gap-2"><DollarSign size={16} className="text-green-400" /> Pricing & Stock</h2>

 {/* Price calculator */}
 <div className="bg-gradient-to-br from-green-500/8 to-emerald-500/5 border border-green-500/20 rounded-2xl p-5 space-y-4">
 <p className="text-xs text-green-400 font-bold uppercase tracking-wider flex items-center gap-1.5"><Zap size={11} /> Auto Price Calculator</p>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
 <Field label="Original MRP (₹)" hint="Manufacturer's printed price">
 <input type="number" className={inputCls} value={form.originalMrp} onChange={e => up({ originalMrp: e.target.value })} placeholder="3299" />
 </Field>
 <Field label="Discount %" hint="Your discount from MRP">
 <input type="number" className={inputCls} value={form.discountPercent} onChange={e => up({ discountPercent: e.target.value })} placeholder="23" />
 </Field>
 <Field label="Final Selling Price (₹)" required hint="Price customer pays — auto-calculated">
 <input type="number"
 className="w-full px-4 py-2.5 bg-green-500/10 border border-green-500/40 text-green-400 font-black text-lg placeholder:text-gray-600 rounded-xl focus:outline-none focus:border-green-400 transition"
 value={form.price} onChange={e => up({ price: e.target.value })} placeholder="2540" required />
 </Field>
 </div>
 {form.originalMrp && form.price && parseFloat(form.originalMrp) > 0 && (
 <div className="flex items-center gap-3 pt-1 text-xs text-gray-500">
 <CheckCircle size={12} className="text-green-400" />
 Customer saves <strong className="text-green-400 mx-1">₹{(parseFloat(form.originalMrp) - parseFloat(form.price)).toLocaleString()}</strong> ({form.discountPercent}% off MRP)
 </div>
 )}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <Field label="Stock Quantity" required hint="Current units available">
 <input type="number" className={inputCls} value={form.stock} onChange={e => up({ stock: e.target.value })} placeholder="100" required />
 </Field>
 <div className="flex items-end">
 {form.stock && (
 <div className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold border ${
 parseInt(form.stock) === 0 ? 'bg-red-500/10 border-red-500/20 text-red-400'
 : parseInt(form.stock) <= 10 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
 : 'bg-green-500/10 border-green-500/20 text-green-400'
 }`}>
 {parseInt(form.stock) === 0 ? '⚠ Out of Stock — not visible to customers'
 : parseInt(form.stock) <= 10 ? `⚠ Low stock — only ${form.stock} units left`
 : `✓ In stock — ${form.stock} units available`}
 </div>
 )}
 </div>
 </div>
 </motion.div>
 )}

 {/* ── TAB: Content ── */}
 {activeTab === 'content' && (
 <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
 className="glass rounded-2xl border border-border p-6 space-y-5">
 <h2 className="text-foreground font-bold text-base flex items-center gap-2"><FileText size={16} className="text-green-400" /> Content & Descriptions</h2>

 <div className="space-y-5">
 <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 flex gap-3 text-xs text-blue-300">
 <Info size={14} className="flex-shrink-0 mt-0.5" />
 <div>Each field below appears in a different location. The <strong>Short Description</strong> appears on product cards in the shop. The <strong>Long Description</strong> appears on the product detail page.</div>
 </div>

 <Field label="Short Description" hint="→ Shown on product CARDS in shop listing & search" required>
 <textarea className={textareaCls} rows={2} value={form.shortDescription}
 onChange={e => up({ shortDescription: e.target.value })}
 placeholder="1–2 sentence summary for product cards and search results…" />
 </Field>

 <Field label="Long Description" hint="→ Shown on PRODUCT DETAIL page — About / Overview section">
 <textarea className={textareaCls} rows={5} value={form.longDescription}
 onChange={e => up({ longDescription: e.target.value })}
 placeholder="Full product description with key selling points, science, certifications…" />
 </Field>

 <Field label="Key Benefits" hint="→ Shown as bullet points in the Benefits tab on product page">
 <textarea className={textareaCls} rows={3} value={form.benefits}
 onChange={e => up({ benefits: e.target.value })}
 placeholder="Builds lean muscle mass, Supports fast recovery, 25g protein per serving… (comma separated)" />
 </Field>

 <Field label="Usage / How to Use" hint="→ Shown in the How to Use tab on product page">
 <textarea className={textareaCls} rows={3} value={form.usage}
 onChange={e => up({ usage: e.target.value })}
 placeholder="Mix 1 scoop (30g) with 200-250ml cold water or milk. Take post-workout for best results…" />
 </Field>

 <Field label="Full Ingredients List (Label Text)" hint="→ Shown in the Ingredients label text block on product page">
 <textarea className={textareaCls} rows={3} value={form.fullIngredients}
 onChange={e => up({ fullIngredients: e.target.value })}
 placeholder="Whey Protein Concentrate (80%), Whey Protein Isolate, Cocoa Powder, Natural Flavors, Sucralose…" />
 </Field>
 </div>
 </motion.div>
 )}

 {/* ── TAB: Nutrition ── */}
 {activeTab === 'nutrition' && (
 <motion.div key="nutrition" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
 className="glass rounded-2xl border border-border p-6 space-y-5">
 <div className="flex items-center justify-between">
 <h2 className="text-foreground font-bold text-base flex items-center gap-2"><Zap size={16} className="text-green-400" /> Nutrition Macros</h2>
 <button type="button"
 onClick={() => up({ nutritionOptions: [...form.nutritionOptions, { name: '', quantity: '', unit: 'g', basis: 'per_serving' }] })}
 className="flex items-center gap-1.5 text-xs font-bold bg-green-500/15 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/25 transition cursor-pointer border border-green-500/20">
 <Plus size={13} /> Add Row
 </button>
 </div>

 <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-xs text-blue-300 flex gap-2">
 <Info size={13} className="flex-shrink-0" />
 These values are displayed in the <strong>Nutrition Facts</strong> grid on the product detail page (per serving).
 </div>

 {/* Header row */}
 {form.nutritionOptions.length > 0 && (
 <div className="grid grid-cols-12 gap-2 text-xs text-gray-600 font-bold uppercase px-1">
 <div className="col-span-4">Nutrient Name</div>
 <div className="col-span-3">Amount / Serving</div>
 <div className="col-span-3">Unit</div>
 <div className="col-span-2 text-right">Remove</div>
 </div>
 )}

 <div className="space-y-2">
 {form.nutritionOptions.map((opt, idx) => (
 <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white/3 border border-white/8 rounded-xl p-3">
 <div className="col-span-4">
 <input type="text" placeholder="e.g. Protein" value={opt.name}
 onChange={e => { const n = [...form.nutritionOptions]; n[idx].name = e.target.value; up({ nutritionOptions: n }); }}
 className={inputCls} />
 </div>
 <div className="col-span-3">
 <input type="text" placeholder="25" value={opt.quantity}
 onChange={e => { const n = [...form.nutritionOptions]; n[idx].quantity = e.target.value; up({ nutritionOptions: n }); }}
 className={inputCls} />
 </div>
 <div className="col-span-3">
 <input type="text" placeholder="g" value={opt.unit}
 onChange={e => { const n = [...form.nutritionOptions]; n[idx].unit = e.target.value; up({ nutritionOptions: n }); }}
 className={inputCls} />
 </div>
 <div className="col-span-2 flex justify-end">
 <button type="button"
 onClick={() => up({ nutritionOptions: form.nutritionOptions.filter((_, i) => i !== idx) })}
 className="p-2 text-red-400 hover:bg-red-500/15 rounded-lg transition cursor-pointer">
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 ))}
 {form.nutritionOptions.length === 0 && (
 <div className="text-center py-10 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm">
 No nutrition rows yet. Click "Add Row" to add macros.
 </div>
 )}
 </div>

 {/* Quick-add common macros */}
 <div className="flex flex-wrap gap-2 pt-2">
 <p className="w-full text-xs text-gray-600 font-semibold">Quick add common macros:</p>
 {[
 { name: 'Protein', unit: 'g' }, { name: 'Carbohydrates', unit: 'g' },
 { name: 'Fats', unit: 'g' }, { name: 'Calories', unit: 'kcal' },
 { name: 'Sugar', unit: 'g' }, { name: 'Fiber', unit: 'g' },
 { name: 'Sodium', unit: 'mg' }, { name: 'Creatine', unit: 'g' },
 ].map(m => (
 <button key={m.name} type="button"
 onClick={() => up({ nutritionOptions: [...form.nutritionOptions, { name: m.name, quantity: '', unit: m.unit, basis: 'per_serving' }] })}
 className="px-3 py-1 text-xs rounded-lg bg-muted border border-border text-muted-foreground hover:text-green-400 hover:border-green-500/30 transition cursor-pointer">
 + {m.name}
 </button>
 ))}
 </div>
 </motion.div>
 )}

 {/* ── TAB: Ingredients ── */}
 {activeTab === 'ingredients' && (
 <motion.div key="ingredients" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
 className="glass rounded-2xl border border-border p-6 space-y-5">
 <div className="flex items-center justify-between">
 <h2 className="text-foreground font-bold text-base flex items-center gap-2"><List size={16} className="text-green-400" /> Key Highlighted Ingredients</h2>
 <button type="button"
 onClick={() => up({ ingredients: [...form.ingredients, { name: '', quantity: '', unit: 'g', logo: 'default' }] })}
 className="flex items-center gap-1.5 text-xs font-bold bg-green-500/15 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/25 transition cursor-pointer border border-green-500/20">
 <Plus size={13} /> Add Ingredient
 </button>
 </div>

 <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-xs text-blue-300 flex gap-2">
 <Info size={13} className="flex-shrink-0" />
 These are the <strong>spotlight ingredient cards</strong> shown on the product detail page — typically 4–6 key active ingredients with their per-serving amount.
 </div>

 {form.ingredients.length > 0 && (
 <div className="grid grid-cols-12 gap-2 text-xs text-gray-600 font-bold uppercase px-1">
 <div className="col-span-4">Ingredient Name</div>
 <div className="col-span-2">Amount</div>
 <div className="col-span-2">Unit</div>
 <div className="col-span-3">Icon Style</div>
 <div className="col-span-1"></div>
 </div>
 )}

 <div className="space-y-2">
 {form.ingredients.map((ing, idx) => (
 <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white/3 border border-white/8 rounded-xl p-3">
 <div className="col-span-4">
 <input type="text" placeholder="e.g. Whey Isolate" value={ing.name}
 onChange={e => { const n = [...form.ingredients]; n[idx].name = e.target.value; up({ ingredients: n }); }}
 className={inputCls} />
 </div>
 <div className="col-span-2">
 <input type="text" placeholder="25" value={ing.quantity}
 onChange={e => { const n = [...form.ingredients]; n[idx].quantity = e.target.value; up({ ingredients: n }); }}
 className={inputCls} />
 </div>
 <div className="col-span-2">
 <input type="text" placeholder="g" value={ing.unit}
 onChange={e => { const n = [...form.ingredients]; n[idx].unit = e.target.value; up({ ingredients: n }); }}
 className={inputCls} />
 </div>
 <div className="col-span-3">
 <select value={ing.logo || 'default'}
 onChange={e => { const n = [...form.ingredients]; n[idx].logo = e.target.value; up({ ingredients: n }); }}
 className={selectCls}>
 {LOGO_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
 </select>
 </div>
 <div className="col-span-1 flex justify-end">
 <button type="button"
 onClick={() => up({ ingredients: form.ingredients.filter((_, i) => i !== idx) })}
 className="p-2 text-red-400 hover:bg-red-500/15 rounded-lg transition cursor-pointer">
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 ))}
 {form.ingredients.length === 0 && (
 <div className="text-center py-10 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm">
 No key ingredients yet. Click "Add Ingredient" to add spotlight ingredients.
 </div>
 )}
 </div>
 </motion.div>
 )}

 {/* ── TAB: Images ── */}
 {activeTab === 'images' && (
 <motion.div key="images" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
 className="glass rounded-2xl border border-border p-6 space-y-5">
 <h2 className="text-foreground font-bold text-base flex items-center gap-2"><ImageIcon size={16} className="text-green-400" /> Product Images</h2>

 {/* Upload area */}
 <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/15 hover:border-green-500/40 rounded-2xl cursor-pointer bg-background/20 hover:bg-background/30 transition group">
 <Upload size={24} className="text-gray-500 group-hover:text-green-400 transition mb-2" />
 <span className="text-sm font-semibold text-gray-500 group-hover:text-muted-foreground transition">Click to upload images</span>
 <span className="text-xs text-gray-600 mt-1">PNG, JPG, WebP — max 5MB each</span>
 <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
 </label>

 {/* URL paste row */}
 <div>
 <label className="text-sm font-semibold text-muted-foreground block mb-2">Or paste an image URL</label>
 <div className="flex gap-2">
 <input type="url" placeholder="https://…" className={`${inputCls} flex-1`}
 onKeyDown={e => {
 if (e.key === 'Enter') {
 e.preventDefault();
 const val = e.currentTarget.value.trim();
 if (val) { addImageUrl(val); e.currentTarget.value = ''; toast.success('Image URL added'); }
 }
 }}
 />
 <button type="button"
 className="px-4 py-2.5 bg-muted hover:bg-white/15 text-foreground rounded-xl text-sm font-semibold transition cursor-pointer border border-border"
 onClick={e => {
 const input = (e.currentTarget.previousSibling as HTMLInputElement);
 if (input.value.trim()) { addImageUrl(input.value.trim()); input.value = ''; toast.success('Image URL added'); }
 }}>
 Add URL
 </button>
 </div>
 </div>

 {/* Image grid */}
 {(form.images.length > 0 || selectedFiles.length > 0) && (
 <div>
 <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wider">
 {form.images.length + selectedFiles.length} image{form.images.length + selectedFiles.length !== 1 ? 's' : ''}
 {selectedFiles.length > 0 && <span className="text-green-400 ml-2">({selectedFiles.length} new — will upload on save)</span>}
 </p>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
 {form.images.map((img, idx) => (
 <div key={`existing-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border group">
 <img src={img} alt="Product" className="w-full h-full object-contain p-2" />
 {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-green-500/80 text-xs text-center text-black font-bold py-0.5">Main Photo</div>}
 <button type="button"
 onClick={() => up({ images: form.images.filter((_, i) => i !== idx) })}
 className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-foreground rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer shadow">
 <X size={11} />
 </button>
 </div>
 ))}
 {selectedFiles.map((f, idx) => (
 <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-green-500/30 group">
 <img src={f.preview} alt="New" className="w-full h-full object-contain p-2" />
 <div className="absolute inset-0 bg-green-500/10 pointer-events-none" />
 <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-xs text-center text-black font-bold py-0.5">New</div>
 <button type="button"
 onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
 className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-foreground rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer shadow">
 <X size={11} />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>

 {/* Bottom save bar */}
 <div className="glass rounded-2xl border border-border p-4 flex items-center justify-between">
 <div className="flex items-center gap-2 text-xs text-gray-500">
 <AlertCircle size={13} />
 Fields marked with <span className="text-red-400 font-bold mx-1">*</span> are required
 </div>
 <div className="flex gap-3">
 <button type="button" onClick={() => router.push('/admin/products')}
 className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-semibold transition cursor-pointer">
 Cancel
 </button>
 <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} disabled={saving}
 className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg cursor-pointer disabled:opacity-50">
 {saving ? <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
 {saving ? 'Saving…' : (isEditing ? 'Save Changes' : 'Create Product')}
 </motion.button>
 </div>
 </div>
 </div>

 {/* Right: Live Preview */}
 <div className="w-80 flex-shrink-0 hidden xl:block">
 <LivePreview data={form} previewImage={previewFile} />
 </div>
 </div>
 </form>
 </div>
 );
}

export default function ProductEditPage() {
 return (
 <Suspense fallback={
 <div className="flex items-center justify-center h-screen bg-gradient-dark">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
 </div>
 }>
 <ProductEditInner />
 </Suspense>
 );
}
