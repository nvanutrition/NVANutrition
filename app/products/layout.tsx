import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All Products | NVA Nutrition (Vi Nutrition)',
  description: 'Browse our complete range of premium sports nutrition supplements. From Whey Protein and Mass Gainers to Creatine and Pre-workouts. NVA Nutrition / Vi Nutrition offers the best supplements in India.',
  keywords: 'NVA nutrition products, Vi nutrition supplements, buy whey protein online, best mass gainer, creatine monohydrate India, pre-workout supplements, Vi nutrition brand store',
  openGraph: {
    title: 'Shop All Products | NVA Nutrition (Vi Nutrition)',
    description: 'Browse our complete range of premium sports nutrition supplements.',
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
