import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CartItem } from '@/lib/store';

export interface Offer {
  id: string;
  name: string;
  status: 'live' | 'draft';
  offerType: 'free_product' | 'percentage_discount' | 'flat_discount' | 'bxgy';
  minCartValue?: number;
  targetSku?: string;
  minQtyOfTargetSku?: number;
  rewardValue?: number; // percent or flat amount
  rewardSku?: string;
  rewardSkuQty?: number;
  buySku?: string;
  buyQty?: number;
  getSku?: string;
  getQty?: number;
}

export interface AppliedOfferResult {
  offerId: string;
  name: string;
  offerType: string;
  discountAmount: number;
  freeProducts: {
    sku: string;
    quantity: number;
    name: string;
    price: number;
    image: string;
  }[];
}

/**
 * Evaluates active promotions against a user's current shopping cart.
 */
export async function evaluateOffers(
  cartItems: CartItem[],
  cartTotal: number,
  userId?: string
): Promise<AppliedOfferResult[]> {
  try {
    const offersRef = collection(db, 'offers');
    const q = query(offersRef, where('status', '==', 'live'));
    const snap = await getDocs(q);

    const activeOffers: Offer[] = [];
    snap.forEach(doc => {
      activeOffers.push({ id: doc.id, ...doc.data() } as Offer);
    });

    const results: AppliedOfferResult[] = [];

    for (const offer of activeOffers) {
      let isEligible = true;

      // Condition 1: Minimum Cart Value
      if (offer.minCartValue && cartTotal < offer.minCartValue) {
        isEligible = false;
      }

      // Condition 2: Specific product SKU in cart + minimum quantity of that SKU
      if (offer.targetSku) {
        const matchingCartItem = cartItems.find(item => item.sku === offer.targetSku || item.id === offer.targetSku);
        if (!matchingCartItem) {
          isEligible = false;
        } else if (offer.minQtyOfTargetSku && matchingCartItem.quantity < offer.minQtyOfTargetSku) {
          isEligible = false;
        }
      }

      // Condition 3: Buy X Get Y (BXGY) validation
      if (offer.offerType === 'bxgy' && offer.buySku && offer.buyQty) {
        const matchingCartItem = cartItems.find(item => item.sku === offer.buySku || item.id === offer.buySku);
        if (!matchingCartItem || matchingCartItem.quantity < offer.buyQty) {
          isEligible = false;
        }
      }

      if (!isEligible) continue;

      // Offer meets conditions, calculate rewards
      let discountAmount = 0;
      const freeProducts: AppliedOfferResult['freeProducts'] = [];

      if (offer.offerType === 'flat_discount' && offer.rewardValue) {
        discountAmount = offer.rewardValue;
      } else if (offer.offerType === 'percentage_discount' && offer.rewardValue) {
        discountAmount = Math.round(cartTotal * (offer.rewardValue / 100));
      } else if (offer.offerType === 'free_product' && offer.rewardSku) {
        // Fetch details of free product from Firestore to display nicely in cart
        const productQuery = query(collection(db, 'products'), where('sku', '==', offer.rewardSku));
        const prodSnap = await getDocs(productQuery);
        let prodName = 'Free Gift';
        let prodImg = '/products/placeholder.jpg';

        if (!prodSnap.empty) {
          const docData = prodSnap.docs[0].data();
          prodName = docData.name;
          prodImg = docData.images?.[0] || prodImg;
        }

        freeProducts.push({
          sku: offer.rewardSku,
          quantity: offer.rewardSkuQty || 1,
          name: `${prodName} (Free Promo)`,
          price: 0,
          image: prodImg,
        });
      } else if (offer.offerType === 'bxgy' && offer.buySku && offer.buyQty && offer.getSku && offer.getQty) {
        const matchingCartItem = cartItems.find(item => item.sku === offer.buySku || item.id === offer.buySku);
        if (matchingCartItem) {
          // Calculate BXGY multiplier: e.g. Buy 2 get 1. If qty = 5, multiplier is floor(5/2) = 2.
          const multiplier = Math.floor(matchingCartItem.quantity / offer.buyQty);
          if (multiplier > 0) {
            const productQuery = query(collection(db, 'products'), where('sku', '==', offer.getSku));
            const prodSnap = await getDocs(productQuery);
            let prodName = 'Free Promo Item';
            let prodImg = '/products/placeholder.jpg';

            if (!prodSnap.empty) {
              const docData = prodSnap.docs[0].data();
              prodName = docData.name;
              prodImg = docData.images?.[0] || prodImg;
            }

            freeProducts.push({
              sku: offer.getSku,
              quantity: multiplier * offer.getQty,
              name: `${prodName} (BXGY Promo)`,
              price: 0,
              image: prodImg,
            });
          }
        }
      }

      results.push({
        offerId: offer.id,
        name: offer.name,
        offerType: offer.offerType,
        discountAmount,
        freeProducts,
      });
    }

    return results;
  } catch (error) {
    console.error('Error evaluating promotions:', error);
    return [];
  }
}
