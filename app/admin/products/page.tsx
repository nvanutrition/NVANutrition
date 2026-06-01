'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Edit2, Trash2, Plus, X, Upload, Image as ImageIcon, Percent, Star, Tag } from 'lucide-react';

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  benefits: string[];
  flavors: string[];
  servings: number;
  images: string[];
  originalMrp?: number;
  discountPercent?: number;
  sku?: string;
  isFeatured?: boolean;
  priority?: number;
  nutritionFacts?: {
    protein: string;
    carbs: string;
    fats: string;
    calories: string;
  };
  ingredients?: Ingredient[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Whey Protein',
    price: '',
    stock: '',
    description: '',
    benefits: '',
    flavors: '',
    servings: '',
    images: [] as string[],
    originalMrp: '',
    discountPercent: '',
    sku: '',
    isFeatured: false,
    priority: '5',
    nutritionFacts: {
      protein: '',
      carbs: '',
      fats: '',
      calories: '',
    },
    ingredients: [] as Ingredient[],
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-calculate selling price when originalMrp or discountPercent changes
  useEffect(() => {
    const mrp = parseFloat(formData.originalMrp);
    const discount = parseFloat(formData.discountPercent);
    if (!isNaN(mrp) && !isNaN(discount)) {
      const calculated = Math.round(mrp * (1 - discount / 100));
      setFormData(prev => ({
        ...prev,
        price: calculated.toString()
      }));
    }
  }, [formData.originalMrp, formData.discountPercent]);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsList: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsList.push({
          id: doc.id,
          ...doc.data(),
        } as Product);
      });
      setProducts(productsList);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = Date.now();
        const fileName = `products/${editingId || timestamp}/${i}-${file.name}`;
        const fileRef = ref(storage, fileName);

        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        uploadedUrls.push(downloadURL);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      toast.success(`${uploadedUrls.length} images uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload images');
      console.error(error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      const fileRef = ref(storage, imageUrl);
      await deleteObject(fileRef);
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== imageUrl)
      }));
      toast.success('Image removed');
    } catch (error) {
      // In case image was already deleted or storage rules blocked it, still remove from form state
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== imageUrl)
      }));
      toast.success('Image removed from listing');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const originalMrpVal = parseFloat(formData.originalMrp);
      const discountPercentVal = parseFloat(formData.discountPercent);
      const priceVal = parseFloat(formData.price);

      const productData = {
        name: formData.name,
        category: formData.category,
        price: priceVal,
        stock: parseInt(formData.stock),
        description: formData.description,
        benefits: formData.benefits.split(',').map(b => b.trim()).filter(b => b),
        flavors: formData.flavors.split(',').map(f => f.trim()).filter(f => f),
        servings: parseInt(formData.servings) || 30,
        images: formData.images,
        originalMrp: isNaN(originalMrpVal) ? priceVal : originalMrpVal,
        discountPercent: isNaN(discountPercentVal) ? 0 : discountPercentVal,
        sku: formData.sku.trim().toUpperCase(),
      isFeatured: formData.isFeatured,
      priority: parseInt(formData.priority) || 5,
      nutritionFacts: formData.nutritionFacts,
      ingredients: formData.ingredients,
      updatedAt: new Date(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        toast.success('Product updated successfully');
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success('Product added successfully');
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string, images: string[]) => {
    if (!window.confirm('Are you sure? This will also delete all product images.')) return;

    try {
      // Delete images from storage
      for (const imageUrl of images) {
        try {
          const fileRef = ref(storage, imageUrl);
          await deleteObject(fileRef);
        } catch (err) {
          console.error('Failed to delete image:', err);
        }
      }

      // Delete product from database
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || '',
      benefits: product.benefits?.join(', ') || '',
      flavors: product.flavors?.join(', ') || '',
      servings: product.servings?.toString() || '30',
      images: product.images || [],
      originalMrp: product.originalMrp?.toString() || product.price.toString(),
      discountPercent: product.discountPercent?.toString() || '0',
      sku: product.sku || '',
      isFeatured: product.isFeatured || false,
      priority: product.priority?.toString() || '5',
      nutritionFacts: product.nutritionFacts || { protein: '', carbs: '', fats: '', calories: '' },
      ingredients: product.ingredients || [],
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Whey Protein',
      price: '',
      stock: '',
      description: '',
      benefits: '',
      flavors: '',
      servings: '',
      images: [],
      originalMrp: '',
      discountPercent: '',
      sku: '',
      isFeatured: false,
      priority: '5',
      nutritionFacts: { protein: '', carbs: '', fats: '', calories: '' },
      ingredients: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-dark">
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white">Product Management</h1>
            <p className="text-gray-400 mt-2">Manage products, images, and inventory</p>
          </div>
          <div className="flex gap-4 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                try {
                  const querySnapshot = await getDocs(collection(db, 'products'));
                  let count = 0;
                  for (const productDoc of querySnapshot.docs) {
                    const data = productDoc.data();
                    const namePrefix = (data.name?.replace(/[^a-zA-Z]/g, '').substring(0, 2) || 'PR').toUpperCase();
                    const nums = '0123456789';
                    let sku = namePrefix;
                    for (let i = 0; i < 5; i++) {
                      sku += nums.charAt(Math.floor(Math.random() * nums.length));
                    }
                    await updateDoc(doc(db, 'products', productDoc.id), { sku });
                    count++;
                  }
                  toast.success(`Successfully migrated ${count} products with new SKUs!`);
                  fetchProducts();
                } catch (e: any) {
                  toast.error('Failed to migrate SKUs: ' + e.message);
                }
              }}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-bold transition cursor-pointer"
            >
              Update All SKUs
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 cursor-pointer"
            >
              <Plus size={20} />
              Add Product
            </motion.button>
          </div>
        </motion.div>

        {/* Form Modal */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X size={28} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-6">
                {/* Product Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-white mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                      placeholder="e.g., Premium Whey Protein"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                    >
                      <option className="bg-gray-900">Whey Protein</option>
                      <option className="bg-gray-900">Mass Gainer</option>
                      <option className="bg-gray-900">Creatine</option>
                      <option className="bg-gray-900">BCAA</option>
                      <option className="bg-gray-900">Pre Workout</option>
                      <option className="bg-gray-900">Fat Burner</option>
                      <option className="bg-gray-900">Multivitamin</option>
                      <option className="bg-gray-900">Supplements</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Stock *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                      placeholder="100"
                      required
                    />
                  </div>

                  {/* Pricing and discount options */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl col-span-2 grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Original MRP (₹)</label>
                      <input
                        type="number"
                        value={formData.originalMrp}
                        onChange={(e) => setFormData({ ...formData, originalMrp: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                        placeholder="3299"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Discount %</label>
                      <input
                        type="number"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                        placeholder="23"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Final Selling Price (₹) *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 font-mono placeholder:text-green-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                        placeholder="2499"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Servings</label>
                    <input
                      type="number"
                      value={formData.servings}
                      onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                      placeholder="30"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-white mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                      placeholder="Detailed product description..."
                      rows={3}
                    />
                  </div>

                  {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Benefits (comma separated)</label>
                  <input
                    type="text"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Flavors (comma separated)</label>
                  <input
                    type="text"
                    value={formData.flavors}
                    onChange={(e) => setFormData({ ...formData, flavors: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 text-white"
                  />
                </div>
              </div>

              {/* Nutrition Facts */}
              <div className="glass p-4 rounded-xl border border-white/10 space-y-4 col-span-2">
                <h3 className="font-semibold text-white">Nutrition Facts (per serving)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Protein (g)</label>
                    <input
                      type="text"
                      value={formData.nutritionFacts.protein}
                      onChange={(e) => setFormData({ ...formData, nutritionFacts: { ...formData.nutritionFacts, protein: e.target.value } })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Carbs (g)</label>
                    <input
                      type="text"
                      value={formData.nutritionFacts.carbs}
                      onChange={(e) => setFormData({ ...formData, nutritionFacts: { ...formData.nutritionFacts, carbs: e.target.value } })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Fats (g)</label>
                    <input
                      type="text"
                      value={formData.nutritionFacts.fats}
                      onChange={(e) => setFormData({ ...formData, nutritionFacts: { ...formData.nutritionFacts, fats: e.target.value } })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Calories</label>
                    <input
                      type="text"
                      value={formData.nutritionFacts.calories}
                      onChange={(e) => setFormData({ ...formData, nutritionFacts: { ...formData.nutritionFacts, calories: e.target.value } })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Ingredients Array */}
              <div className="glass p-4 rounded-xl border border-white/10 space-y-4 col-span-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-white">Active Ingredients</h3>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ingredients: [...formData.ingredients, { name: '', quantity: '', unit: 'g' }] })}
                    className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full hover:bg-green-500/30 transition flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Ingredient
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Ingredient Name"
                          value={ing.name}
                          onChange={(e) => {
                            const newIngs = [...formData.ingredients];
                            newIngs[idx].name = e.target.value;
                            setFormData({ ...formData, ingredients: newIngs });
                          }}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="text"
                          placeholder="Qty"
                          value={ing.quantity}
                          onChange={(e) => {
                            const newIngs = [...formData.ingredients];
                            newIngs[idx].quantity = e.target.value;
                            setFormData({ ...formData, ingredients: newIngs });
                          }}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                      <div className="w-24">
                        <select
                          value={ing.unit}
                          onChange={(e) => {
                            const newIngs = [...formData.ingredients];
                            newIngs[idx].unit = e.target.value;
                            setFormData({ ...formData, ingredients: newIngs });
                          }}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        >
                          <option value="g" className="bg-gray-900">g</option>
                          <option value="mg" className="bg-gray-900">mg</option>
                          <option value="kg" className="bg-gray-900">kg</option>
                          <option value="mcg" className="bg-gray-900">mcg</option>
                          <option value="IU" className="bg-gray-900">IU</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newIngs = formData.ingredients.filter((_, i) => i !== idx);
                          setFormData({ ...formData, ingredients: newIngs });
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formData.ingredients.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No specific ingredients added.</p>
                  )}
                </div>
              </div>

                  {/* SKU + Featured + Priority row */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-1"><Tag size={14} className="text-green-400" /> SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono uppercase"
                      placeholder="NVA-WP-001"
                    />
                    <p className="text-xs text-gray-500 mt-1">Unique product identifier (assigned manually)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">Display Priority (1=highest, 10=lowest)</label>
                    <input
                      type="number"
                      min={1} max={10}
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold"
                      placeholder="5"
                    />
                  </div>

                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 font-bold transition cursor-pointer w-full ${
                        formData.isFeatured
                          ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <Star size={20} className={formData.isFeatured ? 'fill-yellow-400 text-yellow-400' : ''} />
                      {formData.isFeatured ? '★ Featured Product — Will appear on homepage' : '☆ Mark as Featured Product'}
                    </button>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="border-2 border-dashed border-green-500/30 rounded-xl p-6 bg-green-500/5">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload size={32} className="text-green-400 mb-2" />
                    <p className="text-white font-semibold">Click to upload product images</p>
                    <p className="text-gray-400 text-sm">PNG, JPG up to 5MB (Upload multiple images)</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                  </label>
                  {uploadingImages && <p className="text-center text-green-400 mt-2">Uploading...</p>}
                </div>

                {/* Image Gallery */}
                {formData.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-3">Product Images</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Product ${idx}`}
                            className="w-full h-24 object-cover rounded-lg border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black py-3 rounded-lg font-bold transition cursor-pointer"
                  >
                    {editingId ? 'Update Product' : 'Create Product'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 border-2 border-white/10 hover:bg-white/5 text-white py-3 rounded-lg font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 glass rounded-xl border-2 border-dashed border-white/10"
          >
            <ImageIcon size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg">No products yet. Create your first product!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition border border-white/10 flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-white/5 overflow-hidden group flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full object-contain p-4 group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={40} className="text-gray-600" />
                    </div>
                  )}
                  {product.isFeatured && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-black flex items-center gap-1 shadow-md">
                      <Star size={10} className="fill-black" /> FEATURED
                    </div>
                  )}
                  {!product.isFeatured && product.images && product.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-black px-2 py-1 rounded text-xs font-bold shadow-md">
                      +{product.images.length - 1} images
                    </div>
                  )}
                  {product.discountPercent && product.discountPercent > 0 ? (
                    <div className="absolute top-2 left-2 bg-green-600 border border-green-500 text-white px-2 py-1 rounded text-xs font-bold shadow-md flex items-center gap-1">
                      <Percent size={12} />
                      {product.discountPercent}% OFF
                    </div>
                  ) : null}
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white leading-tight line-clamp-1">{product.name}</h3>
                      <div className="text-right">
                        <span className="text-green-400 font-bold text-lg block">₹{product.price.toLocaleString()}</span>
                        {product.originalMrp && product.originalMrp > product.price && (
                          <span className="text-xs text-gray-500 line-through">₹{product.originalMrp.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>

                    {/* Meta Info */}
                    <div className="space-y-2 mb-4 text-sm text-gray-400">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="font-semibold text-white">{product.category}</span>
                      </div>
                      {product.sku && (
                        <div className="flex justify-between">
                          <span>SKU:</span>
                          <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded text-green-300">{product.sku}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Stock:</span>
                        <span className={`font-semibold ${product.stock > 20 ? 'text-green-400' : product.stock > 0 ? 'text-orange-400' : 'text-red-400'}`}>
                          {product.stock === 0 ? 'Out of Stock' : product.stock}
                        </span>
                      </div>
                      {product.flavors && product.flavors.length > 0 && (
                        <div className="flex justify-between">
                          <span>Flavors:</span>
                          <span className="font-semibold text-white truncate max-w-44">{product.flavors.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg font-semibold text-sm transition border border-blue-500/20 cursor-pointer"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.images || [])}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg font-semibold text-sm transition border border-red-500/20 cursor-pointer"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
