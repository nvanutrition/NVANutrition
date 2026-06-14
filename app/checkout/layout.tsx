import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Secure Checkout | NVA Nutrition',
  description: 'Complete your purchase securely. Fast shipping and premium supplements guaranteed by NVA Nutrition.',
  robots: {
    index: false,
    follow: true,
  }
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
