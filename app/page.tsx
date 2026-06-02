'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { FeaturedProductsSection } from '@/components/featured-products';
import dynamic from 'next/dynamic';

const MotivationSection = dynamic(() => import('@/components/motivation-section').then(mod => mod.MotivationSection));
const BenefitsSection = dynamic(() => import('@/components/benefits-section').then(mod => mod.BenefitsSection));
const TransformationSection = dynamic(() => import('@/components/transformation-section').then(mod => mod.TransformationSection));
const TestimonialsSection = dynamic(() => import('@/components/testimonials-section').then(mod => mod.TestimonialsSection));
const NewsletterSection = dynamic(() => import('@/components/newsletter-section').then(mod => mod.NewsletterSection));

export default function Page() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <MotivationSection />
      <FeaturedProductsSection />
      <BenefitsSection />
      <TransformationSection />
      <TestimonialsSection />
      <NewsletterSection />
      <Footer />
    </main>
  );
}
