import type { Metadata } from 'next';

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
 return <>{children}</>;
}
