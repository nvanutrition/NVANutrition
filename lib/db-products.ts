import { collection, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { products as localProducts } from './products';

export interface DbProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  images: string[];
  benefits: string[];
  flavors: string[];
  servings: number;
  nutritionFacts: {
    protein: string;
    carbs: string;
    fats: string;
    calories: string;
  };
  ingredients: any[];
  usage: string;
  originalMrp?: number;
  discountPercent?: number;
  stock: number;
  sku?: string;
  isFeatured?: boolean;
  priority?: number;
}

// Fetch all products from Firestore, seed if database is empty
export async function fetchDbProducts(): Promise<DbProduct[]> {
  try {
    const productsCol = collection(db, 'products');
    const snapshot = await getDocs(productsCol);
    
    if (snapshot.empty) {
      console.log('Firestore products collection is empty. Seeding defaults...');
      const seededList: DbProduct[] = [];
      
      for (const local of localProducts) {
        const originalMrp = Math.round(local.price * 1.3); // default ~30% markup
        const discountPercent = 23; // default ~23% discount
        const calculatedPrice = Math.round(originalMrp * (1 - discountPercent / 100));
        
        const defaultProduct = {
          name: local.name,
          category: local.category,
          price: calculatedPrice,
          rating: local.rating,
          reviews: local.reviews,
          description: local.description,
          images: [local.image],
          benefits: local.benefits,
          flavors: local.flavors,
          servings: local.servings,
          nutritionFacts: local.nutritionFacts,
          ingredients: local.ingredients,
          usage: local.usage,
          originalMrp,
          discountPercent,
          stock: 50,
          sku: `SKU-${local.name.replace(/\s+/g, '-').toUpperCase()}`,
          isFeatured: true,
          priority: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const docRef = await addDoc(productsCol, defaultProduct);
        seededList.push({
          id: docRef.id,
          ...defaultProduct,
        } as DbProduct);
      }
      
      console.log(`Successfully seeded ${seededList.length} products to Firestore.`);
      return seededList;
    }
    
    const productsList: DbProduct[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      productsList.push({
        id: docSnap.id,
        ...data,
      } as DbProduct);
    });
    
    return productsList;
  } catch (error) {
    console.error('Error fetching/seeding Firestore products:', error);
    return localProducts.map(local => ({
      id: local.id,
      name: local.name,
      category: local.category,
      price: local.price,
      rating: local.rating,
      reviews: local.reviews,
      description: local.description,
      images: [local.image],
      benefits: local.benefits,
      flavors: local.flavors,
      servings: local.servings,
      nutritionFacts: local.nutritionFacts,
      ingredients: local.ingredients,
      usage: local.usage,
      originalMrp: Math.round(local.price * 1.3),
      discountPercent: 23,
      stock: 50,
      sku: `SKU-${local.name.replace(/\s+/g, '-').toUpperCase()}`,
      isFeatured: true,
      priority: 5,
    } as DbProduct));
  }
}

// Fetch featured products from Firestore, sorted by priority (1 is highest priority)
export async function fetchFeaturedProducts(): Promise<DbProduct[]> {
  try {
    const products = await fetchDbProducts();
    return products
      .filter(p => p.isFeatured === true)
      .sort((a, b) => {
        const priorityA = typeof a.priority === 'number' ? a.priority : (parseInt(a.priority as any) || 5);
        const priorityB = typeof b.priority === 'number' ? b.priority : (parseInt(b.priority as any) || 5);
        return priorityA - priorityB;
      });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// Fetch a single product from Firestore by ID
export async function fetchDbProductById(id: string): Promise<DbProduct | null> {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as DbProduct;
    }
    
    const productsCol = collection(db, 'products');
    const snapshot = await getDocs(productsCol);
    let matchedProduct: DbProduct | null = null;
    
    const localFallback = localProducts.find(p => p.id === id);
    if (localFallback) {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name === localFallback.name) {
          matchedProduct = {
            id: docSnap.id,
            ...data,
          } as DbProduct;
        }
      });
    }
    
    return matchedProduct;
  } catch (error) {
    console.error(`Error fetching Firestore product by ID (${id}):`, error);
    return null;
  }
}
