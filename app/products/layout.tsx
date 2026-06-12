import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Shop All Products | NVA Nutrition',
 description: 'Browse our complete range of premium sports nutrition supplements. From NVA Nutrition Whey Protein and Mass Gainers to NVA Nutrition Creatine and Pre-workouts. NVA Nutrition offers the best supplements in India.',
 keywords: 'nva nutrition products, nva nutrition supplements, nva nutrition whey protein, nva nutrition mass gainer, nva nutrition creatine, nva nutrition pre-workout, nva nutrition brand store, nutrition, nva nutrition protein powder, nva nutrition, nva, nva protein, nva nutrition whey protein, nva nutrition mass gainer, nva nutrition creatine, nva nutrition bcaa, nva nutrition pre workout, best protein brand in india, premium protein, fitness supplements, whey protein isolate, gym supplements india, buy protein online, sports nutrition, nva nutrition india, nva supplements, nvanutrition, nva pre workout, nva creatine, nvanutrition, nvnutrition, nvanutitrion',
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
