import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policies | NVA Nutrition',
  description: 'Read the privacy policy, terms of service, and refund policies for NVA Nutrition. We prioritize your data security and satisfaction.',
  robots: {
    index: false,
    follow: true,
  }
};

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
