import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Shopping Cart | NVA Nutrition (Vi Nutrition)',
  description: 'Review the items in your shopping cart before proceeding to secure checkout. NVA Nutrition / Vi Nutrition offers the best premium sports supplements in India.',
  robots: {
    index: false,
    follow: true,
  }
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
