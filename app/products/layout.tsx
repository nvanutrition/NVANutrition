import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All Products | NVA Nutrition',
  description: 'Browse our complete range of premium sports nutrition supplements. From NVA Nutrition Whey Protein and Mass Gainers to NVA Nutrition Creatine and Pre-workouts. NVA Nutrition offers the best supplements in India.',
  keywords: 'NVA nutrition products, NVA nutrition supplements, NVA nutrition whey protein, NVA nutrition mass gainer, NVA nutrition creatine, NVA nutrition pre-workout, NVA nutrition brand store, nutrition, NVA nutrition protein powder',
  openGraph: {
    title: 'Shop All Products | NVA Nutrition',
    description: 'Browse our complete range of premium NVA Nutrition sports supplements.',
    url: 'https://nvanutrition.com/products',
    siteName: 'NVA Nutrition',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'NVA Nutrition Products',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
