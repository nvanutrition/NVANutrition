import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About NVA Nutrition | Our Story',
  description: 'Learn about NVA Nutrition. Built for Hustlers. Powered by NVA Nutrition. We bring premium protein and sports nutrition to athletes and corporate warriors across India.',
  keywords: 'About NVA Nutrition, NVA Nutrition story, NVA Nutrition protein brand, NVA Nutrition India, premium sports nutrition',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
