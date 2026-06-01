import { NextResponse } from 'next/server';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function generateSKU(productName: string) {
  const nums = '0123456789';
  
  // E.g. First 2 chars of name + 5 Numbers (WH82736)
  const namePrefix = (productName.replace(/[^a-zA-Z]/g, '').substring(0, 2) || 'PR').toUpperCase();
  
  let result = namePrefix;
  for (let i = 0; i < 5; i++) {
    result += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return result;
}

export async function GET() {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    let updatedCount = 0;

    const updates = snapshot.docs.map(async (productDoc) => {
      const data = productDoc.data();
      // Always generate SKU if it doesn't exist, or force update for this run?
      // I will just force update all SKUs this time so the user gets the new format
      const sku = generateSKU(data.name || 'Product');
      await updateDoc(doc(db, 'products', productDoc.id), { sku });
      updatedCount++;
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true, updatedCount, message: `Successfully updated ${updatedCount} products with SKUs.` });
  } catch (error: any) {
    console.error('Error generating SKUs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
