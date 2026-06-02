import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | NVA Nutrition',
  description: 'Login or register to your NVA Nutrition account to track orders, manage your profile, and discover premium sports nutrition offers.',
  robots: {
    index: false,
    follow: true,
  }
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
