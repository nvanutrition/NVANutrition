import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact NVA Nutrition | Get in Touch',
  description: 'Get in touch with NVA Nutrition. We are here to help you with your premium sports nutrition and protein needs. Contact us via phone, email, or WhatsApp.',
  keywords: 'Contact NVA Nutrition, NVA Nutrition customer support, NVA Nutrition phone number, NVA Nutrition email, NVA Nutrition address',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
