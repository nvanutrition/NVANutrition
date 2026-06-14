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
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && (
          <span className="ml-auto text-[9px] text-indigo-400 font-bold flex items-center gap-1 normal-case tracking-normal">
            <Info size={10} /> {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-400 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition text-sm font-semibold";
const selectCls = "w-full px-4 py-3 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-300 transition text-sm font-semibold cursor-pointer";
const textareaCls = "w-full px-4 py-3 bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-400 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 transition text-sm font-semibold resize-none";

// ─── Live Preview Card ───────────────────────────────────────────────────────
function LivePreview({ data, previewImage }: { data: FormData; previewImage?: string }) {
  const discount = parseFloat(data.discountPercent) || 0;
  const price = parseFloat(data.price) || 0;
  const mrp = parseFloat(data.originalMrp) || 0;

  return (
    <div className="sticky top-28 space-y-4">
      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        <Eye size={12} className="text-indigo-400" /> Live Preview — Customer View
      </div>

      {/* Product Card Preview */}
      <div className="rounded-3xl overflow-hidden border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition duration-300">
        {/* Image */}
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-56 flex items-center justify-center overflow-hidden border-b border-gray-100">
          {previewImage || data.images[0] ? (
            <img src={previewImage || data.images[0]} alt={data.name || 'Product'} className="h-full object-contain p-4 mix-blend-multiply drop-shadow-md" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <ImageIcon size={36} />
              <span className="text-[10px] font-bold uppercase tracking-wider">No image</span>
            </div>
          )}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm tracking-wider">
              {discount}% OFF
            </div>
          )}
          {data.isFeatured && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm tracking-wider">
              <Star size={10} className="fill-white" /> FEATURED
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 space-y-3">
          {data.category && (
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md">{data.category}</span>
          )}
          <h3 className="text-gray-900 font-bold text-base leading-snug">
            {data.name || <span className="text-gray-400 italic">Product Name</span>}
          </h3>
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
            {data.shortDescription || <span className="text-gray-400 italic">Short description will appear here on the product card…</span>}
          </p>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-emerald-600 font-black text-xl">
              {price > 0 ? `₹${price.toLocaleString()}` : <span className="text-gray-300">₹ —</span>}
            </span>
            {mrp > price && mrp > 0 && (
              <span className="text-gray-400 text-xs line-through font-semibold">₹{mrp.toLocaleString()}</span>
            )}
          </div>

          {/* Flavors chips */}
          {data.flavors && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {data.flavors.split(',').map(f => f.trim()).filter(Boolean).slice(0, 4).map(f => (
                <span key={f} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold uppercase tracking-wider">{f}</span>
              ))}
            </div>
          )}

          {/* Nutrition preview */}
          {data.nutritionOptions.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {data.nutritionOptions.slice(0, 4).map((n, i) => (
                <div key={i} className="bg-gray-50 rounded-xl px-2.5 py-2 text-center border border-gray-100 hover:border-emerald-200 transition">
                  <p className="text-gray-900 text-xs font-black">{n.quantity}<span className="text-[9px] text-gray-500 ml-0.5">{n.unit}</span></p>
                  <p className="text-emerald-600 text-[9px] font-bold uppercase tracking-wider mt-0.5">{n.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Field mapping legend */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 space-y-3 shadow-sm">
        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">Field → Storefront Mapping</p>
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
            <ChevronRight size={12} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-900 font-bold">{field}</span>
              <span className="text-gray-600 font-medium"> → {where}</span>
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
        const prefix = (form.name.trim().split(/\s+/).map(w => w[0]).join('').replace(/[^a-zA-Z]/g, '') || 'PRD').toUpperCase();
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
      <div className="flex items-center justify-center min-h-screen bg-[#fcfcfc]">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const previewFile = selectedFiles[0]?.preview;

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans pb-20">
      <form onSubmit={handleSave}>
        
        {/* ─── Sticky Top Bar ─── */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition cursor-pointer shadow-sm bg-white"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-gray-900 font-bold text-lg leading-tight">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-indigo-500 text-xs font-medium">
                {isEditing ? `Editing: ${form.name}` : 'Fill in the details below'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition text-sm font-bold cursor-pointer bg-white"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 cursor-pointer transition"
            >
              {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : (isEditing ? 'Save Changes' : 'Create Product')}
            </motion.button>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="p-4 sm:p-8 flex flex-col lg:flex-row gap-8 items-start max-w-[1400px] mx-auto">
          
          {/* Left: Tabs + Form */}
          <div className="flex-1 min-w-0 space-y-6 w-full">

            {/* Tab strip */}
            <div className="flex overflow-x-auto gap-2 p-1.5 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl border border-gray-100 no-scrollbar w-fit">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0 cursor-pointer focus:outline-none ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={16} className={activeTab === tab.id ? 'text-emerald-500' : ''} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab hint */}
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 shadow-sm rounded-xl px-5 py-3">
              <Info size={14} className="text-emerald-500 flex-shrink-0" />
              <span><strong className="text-emerald-900">{TABS.find(t => t.id === activeTab)?.label}:</strong> {TABS.find(t => t.id === activeTab)?.hint}</span>
            </div>

            {/* ── TAB: Basic Info ── */}
            <AnimatePresence mode="wait">
              {activeTab === 'basic' && (
                <motion.div key="basic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2 pb-4 border-b border-gray-50">
                    <div className="bg-indigo-50 p-1.5 rounded-lg border border-indigo-100"><Tag size={16} className="text-indigo-500" /></div> Basic Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Field label="Product Name" required>
                        <input className={inputCls} value={form.name} onChange={e => up({ name: e.target.value })} placeholder="e.g., NVA Whey Protein Pro" />
                      </Field>
                    </div>

                    <Field label="Category" required>
                      <select className={selectCls} value={form.category} onChange={e => up({ category: e.target.value })}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>

                    <Field label="SKU / Product Code" hint={isEditing ? "Fixed" : "Auto-generated based on name & weight"}>
                      <input className={`${inputCls} bg-gray-100 text-gray-500 cursor-not-allowed`} disabled value={form.sku}
                        placeholder={isEditing ? form.sku || '—' : 'Will be auto-generated'} />
                    </Field>

                    {/* Weight row */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Product Weight / Size</label>
                      <div className="flex gap-3">
                        <input type="number" step="any" className={`${inputCls} flex-1 min-w-0`} value={form.weight} onChange={e => up({ weight: e.target.value })} placeholder="e.g., 2" />
                        <select className="w-24 px-4 py-3 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-300 transition text-sm font-semibold flex-shrink-0 cursor-pointer" value={form.weightUnit} onChange={e => up({ weightUnit: e.target.value })}>
                          {WEIGHT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    <Field label="Total Servings per Pack">
                      <input type="number" className={inputCls} value={form.servings} onChange={e => up({ servings: e.target.value })} placeholder="30" />
                    </Field>

                    <div className="md:col-span-2">
                      <Field label="Available Flavors" hint="Shown as selectable chips on product page">
                        <input className={inputCls} value={form.flavors} onChange={e => up({ flavors: e.target.value })}
                          placeholder="Double Rich Chocolate, Vanilla Ice Cream… (comma separated)" />
                      </Field>
                    </div>

                    {/* Display / Featured */}
                    <Field label="Display Priority" hint="1 = highest priority on homepage (lower number = shown first)">
                      <input type="number" min={1} max={10} className={inputCls} value={form.priority} onChange={e => up({ priority: e.target.value })} placeholder="5" />
                    </Field>

                    <div className="flex items-end">
                      <label className="flex items-center gap-4 cursor-pointer select-none bg-amber-50/50 hover:bg-amber-50 px-4 py-3 rounded-xl border border-amber-100 w-full transition">
                        <div
                          onClick={() => up({ isFeatured: !form.isFeatured })}
                          className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.isFeatured ? 'bg-amber-500' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.isFeatured ? 'translate-x-6' : ''}`} />
                        </div>
                        <div>
                          <p className="text-amber-900 font-bold text-sm">Mark as Featured</p>
                          <p className="text-amber-700/70 text-xs font-medium">Shown on the homepage featured section</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── TAB: Pricing ── */}
              {activeTab === 'pricing' && (
                <motion.div key="pricing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2 pb-4 border-b border-gray-50">
                    <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100"><DollarSign size={16} className="text-emerald-500" /></div> Pricing & Stock
                  </h2>

                  {/* Price calculator */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 space-y-5 shadow-inner">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5"><Zap size={14} className="text-emerald-500" /> Auto Price Calculator</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                      <Field label="Original MRP (₹)" hint="Manufacturer's printed price">
                        <input type="number" className={`${inputCls} focus:border-emerald-300 focus:ring-emerald-50`} value={form.originalMrp} onChange={e => up({ originalMrp: e.target.value })} placeholder="3299" />
                      </Field>
                      <Field label="Discount %" hint="Your discount from MRP">
                        <input type="number" className={`${inputCls} focus:border-emerald-300 focus:ring-emerald-50`} value={form.discountPercent} onChange={e => up({ discountPercent: e.target.value })} placeholder="23" />
                      </Field>
                      <Field label="Final Selling Price (₹)" required hint="Price customer pays">
                        <input type="number"
                          className="w-full px-4 py-3 bg-white border border-emerald-200 text-emerald-700 font-black text-xl placeholder:text-gray-300 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition shadow-sm"
                          value={form.price} onChange={e => up({ price: e.target.value })} placeholder="2540" required />
                      </Field>
                    </div>
                    {form.originalMrp && form.price && parseFloat(form.originalMrp) > 0 && (
                      <div className="flex items-center gap-2 pt-2 text-xs font-bold text-emerald-700">
                        <CheckCircle size={14} className="text-emerald-500" />
                        Customer saves <strong className="text-emerald-800 mx-1 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">₹{(parseFloat(form.originalMrp) - parseFloat(form.price)).toLocaleString()}</strong> ({form.discountPercent}% off MRP)
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <Field label="Stock Quantity" required hint="Current units available">
                      <input type="number" className={inputCls} value={form.stock} onChange={e => up({ stock: e.target.value })} placeholder="100" required />
                    </Field>
                    <div className="flex items-end">
                      {form.stock && (
                        <div className={`w-full px-5 py-3 rounded-xl text-sm font-bold border ${
                          parseInt(form.stock) === 0 ? 'bg-red-50 border-red-200 text-red-700'
                            : parseInt(form.stock) <= 10 ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-green-50 border-green-200 text-green-700'
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
                <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2 pb-4 border-b border-gray-50">
                    <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100"><FileText size={16} className="text-blue-500" /></div> Content & Descriptions
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-xs text-blue-700 font-semibold shadow-sm">
                      <Info size={16} className="flex-shrink-0 text-blue-500 mt-0.5" />
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
                <motion.div key="nutrition" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                    <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                      <div className="bg-rose-50 p-1.5 rounded-lg border border-rose-100"><Zap size={16} className="text-rose-500" /></div> Nutrition Macros
                    </h2>
                    <button type="button"
                      onClick={() => up({ nutritionOptions: [...form.nutritionOptions, { name: '', quantity: '', unit: 'g', basis: 'per_serving' }] })}
                      className="flex items-center gap-2 text-xs font-bold bg-white text-rose-600 px-4 py-2 rounded-xl hover:bg-rose-50 transition cursor-pointer border border-rose-100 shadow-sm">
                      <Plus size={14} /> Add Row
                    </button>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs font-semibold text-rose-700 flex gap-3 shadow-sm">
                    <Info size={16} className="flex-shrink-0 text-rose-500" />
                    <div>These values are displayed in the <strong>Nutrition Facts</strong> grid on the product detail page (per serving).</div>
                  </div>

                  {/* Header row */}
                  {form.nutritionOptions.length > 0 && (
                    <div className="grid grid-cols-12 gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2">
                      <div className="col-span-4">Nutrient Name</div>
                      <div className="col-span-3">Amount / Serving</div>
                      <div className="col-span-3">Unit</div>
                      <div className="col-span-2 text-right">Remove</div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {form.nutritionOptions.map((opt, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-gray-50 border border-gray-100 rounded-2xl p-4 transition hover:border-rose-200">
                        <div className="col-span-4">
                          <input type="text" placeholder="e.g. Protein" value={opt.name}
                            onChange={e => { const n = [...form.nutritionOptions]; n[idx].name = e.target.value; up({ nutritionOptions: n }); }}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-rose-400 font-semibold text-sm transition" />
                        </div>
                        <div className="col-span-3">
                          <input type="text" placeholder="25" value={opt.quantity}
                            onChange={e => { const n = [...form.nutritionOptions]; n[idx].quantity = e.target.value; up({ nutritionOptions: n }); }}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-rose-400 font-semibold text-sm transition" />
                        </div>
                        <div className="col-span-3">
                          <input type="text" placeholder="g" value={opt.unit}
                            onChange={e => { const n = [...form.nutritionOptions]; n[idx].unit = e.target.value; up({ nutritionOptions: n }); }}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-rose-400 font-semibold text-sm transition" />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button type="button"
                            onClick={() => up({ nutritionOptions: form.nutritionOptions.filter((_, i) => i !== idx) })}
                            className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl border border-transparent hover:border-red-100 transition cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {form.nutritionOptions.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-rose-200 bg-rose-50/50 rounded-2xl text-rose-500 font-semibold">
                        <Activity size={32} className="mx-auto mb-3 text-rose-300" />
                        No nutrition rows yet. Click "Add Row" to add macros.
                      </div>
                    )}
                  </div>

                  {/* Quick-add common macros */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                    <p className="w-full text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Quick add common macros:</p>
                    {[
                      { name: 'Protein', unit: 'g' }, { name: 'Carbohydrates', unit: 'g' },
                      { name: 'Fats', unit: 'g' }, { name: 'Calories', unit: 'kcal' },
                      { name: 'Sugar', unit: 'g' }, { name: 'Fiber', unit: 'g' },
                      { name: 'Sodium', unit: 'mg' }, { name: 'Creatine', unit: 'g' },
                    ].map(m => (
                      <button key={m.name} type="button"
                        onClick={() => up({ nutritionOptions: [...form.nutritionOptions, { name: m.name, quantity: '', unit: m.unit, basis: 'per_serving' }] })}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer shadow-sm">
                        + {m.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── TAB: Ingredients ── */}
              {activeTab === 'ingredients' && (
                <motion.div key="ingredients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                    <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                      <div className="bg-cyan-50 p-1.5 rounded-lg border border-cyan-100"><List size={16} className="text-cyan-500" /></div> Key Highlighted Ingredients
                    </h2>
                    <button type="button"
                      onClick={() => up({ ingredients: [...form.ingredients, { name: '', quantity: '', unit: 'g', logo: 'default' }] })}
                      className="flex items-center gap-2 text-xs font-bold bg-white text-cyan-700 px-4 py-2 rounded-xl hover:bg-cyan-50 transition cursor-pointer border border-cyan-100 shadow-sm">
                      <Plus size={14} /> Add Ingredient
                    </button>
                  </div>

                  <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 text-xs font-semibold text-cyan-700 flex gap-3 shadow-sm">
                    <Info size={16} className="flex-shrink-0 text-cyan-500" />
                    <div>These are the <strong>spotlight ingredient cards</strong> shown on the product detail page — typically 4–6 key active ingredients with their per-serving amount.</div>
                  </div>

                  {form.ingredients.length > 0 && (
                    <div className="grid grid-cols-12 gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2">
                      <div className="col-span-4">Ingredient Name</div>
                      <div className="col-span-2">Amount</div>
                      <div className="col-span-2">Unit</div>
                      <div className="col-span-3">Icon Style</div>
                      <div className="col-span-1"></div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {form.ingredients.map((ing, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-gray-50 border border-gray-100 rounded-2xl p-4 transition hover:border-cyan-200">
                        <div className="col-span-4">
                          <input type="text" placeholder="e.g. Whey Isolate" value={ing.name}
                            onChange={e => { const n = [...form.ingredients]; n[idx].name = e.target.value; up({ ingredients: n }); }}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-cyan-400 font-semibold text-sm transition" />
                        </div>
                        <div className="col-span-2">
                          <input type="text" placeholder="25" value={ing.quantity}
                            onChange={e => { const n = [...form.ingredients]; n[idx].quantity = e.target.value; up({ ingredients: n }); }}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-cyan-400 font-semibold text-sm transition" />
                        </div>
                        <div className="col-span-2">
                          <input type="text" placeholder="g" value={ing.unit}
                            onChange={e => { const n = [...form.ingredients]; n[idx].unit = e.target.value; up({ ingredients: n }); }}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-cyan-400 font-semibold text-sm transition" />
                        </div>
                        <div className="col-span-3">
                          <select value={ing.logo || 'default'}
                            onChange={e => { const n = [...form.ingredients]; n[idx].logo = e.target.value; up({ ingredients: n }); }}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-cyan-400 font-semibold text-sm transition cursor-pointer">
                            {LOGO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button"
                            onClick={() => up({ ingredients: form.ingredients.filter((_, i) => i !== idx) })}
                            className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl border border-transparent hover:border-red-100 transition cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {form.ingredients.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-cyan-200 bg-cyan-50/50 rounded-2xl text-cyan-600 font-semibold">
                        <Leaf size={32} className="mx-auto mb-3 text-cyan-300" />
                        No key ingredients yet. Click "Add Ingredient" to add spotlight ingredients.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── TAB: Images ── */}
              {activeTab === 'images' && (
                <motion.div key="images" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-gray-900 font-bold text-lg flex items-center gap-2 pb-4 border-b border-gray-50">
                    <div className="bg-purple-50 p-1.5 rounded-lg border border-purple-100"><ImageIcon size={16} className="text-purple-500" /></div> Product Images
                  </h2>

                  {/* Upload area */}
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-3xl cursor-pointer bg-purple-50/30 hover:bg-purple-50 transition group">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 border border-purple-100 group-hover:scale-110 transition-transform">
                      <Upload size={20} className="text-purple-500" />
                    </div>
                    <span className="text-sm font-bold text-purple-900 transition">Click to upload images</span>
                    <span className="text-xs text-purple-500 font-medium mt-1">PNG, JPG, WebP — max 5MB each</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                  </label>

                  {/* URL paste row */}
                  <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Or paste an image URL</label>
                    <div className="flex gap-3">
                      <input type="url" placeholder="https://…" className={`${inputCls} flex-1 bg-white focus:border-purple-300 focus:ring-purple-50`}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) { addImageUrl(val); e.currentTarget.value = ''; toast.success('Image URL added'); }
                          }
                        }}
                      />
                      <button type="button"
                        className="px-6 py-3 bg-white hover:bg-purple-50 text-purple-700 hover:border-purple-200 rounded-xl text-sm font-bold transition cursor-pointer border border-gray-200 shadow-sm"
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
                    <div className="pt-4 border-t border-gray-50">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
                        {form.images.length + selectedFiles.length} image{form.images.length + selectedFiles.length !== 1 ? 's' : ''}
                        {selectedFiles.length > 0 && <span className="text-purple-600 ml-2 normal-case tracking-normal font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">({selectedFiles.length} new — will upload on save)</span>}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {form.images.map((img, idx) => (
                          <div key={`existing-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
                            <img src={img} alt="Product" className="w-full h-full object-contain p-4" />
                            {idx === 0 && <div className="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] text-white font-black px-2 py-1 rounded-md shadow-sm tracking-wider uppercase">Main Photo</div>}
                            <button type="button"
                              onClick={() => up({ images: form.images.filter((_, i) => i !== idx) })}
                              className="absolute top-2 right-2 p-2 bg-white text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-md hover:bg-red-50 border border-gray-100">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {selectedFiles.map((f, idx) => (
                          <div key={`new-${idx}`} className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-purple-200 shadow-md group ring-2 ring-purple-500/20">
                            <img src={f.preview} alt="New upload preview" className="w-full h-full object-contain p-4" />
                            <div className="absolute top-2 left-2 bg-purple-600 text-[10px] text-white font-black px-2 py-1 rounded-md shadow-sm tracking-wider uppercase">New Upload</div>
                            <button type="button"
                              onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-2 right-2 p-2 bg-white text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-md hover:bg-red-50 border border-gray-100">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Live Preview Sticky Panel */}
          <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24 hidden md:block">
            <LivePreview data={form} previewImage={previewFile} />
          </div>
        </div>
      </form>
    </div>
  );
}

export default function AdminProductEdit() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#fcfcfc]">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <ProductEditInner />
    </Suspense>
  );
}
