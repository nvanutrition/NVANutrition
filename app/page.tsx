'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { FeaturedProductsSection } from '@/components/featured-products';
import { MarqueeSection } from '@/components/marquee-section';
import { UsageSection } from '@/components/usage-section';
import { VerificationSection } from '@/components/verification-section';
import { CommunitySection } from '@/components/community-section';
import dynamic from 'next/dynamic';

const MotivationSection = dynamic(() => import('@/components/motivation-section').then(mod => mod.MotivationSection));
const BenefitsSection = dynamic(() => import('@/components/benefits-section').then(mod => mod.BenefitsSection));
const TransformationSection = dynamic(() => import('@/components/transformation-section').then(mod => mod.TransformationSection));

export default function Page() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <FeaturedProductsSection />
      <UsageSection />
      <VerificationSection />
      <CommunitySection />
      <Footer />
    </main>
  );
}
