'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { MotivationSection } from '@/components/motivation-section';
import { FeaturedProductsSection } from '@/components/featured-products';
import { BenefitsSection } from '@/components/benefits-section';
import { TransformationSection } from '@/components/transformation-section';
import { TestimonialsSection } from '@/components/testimonials-section';
import { NewsletterSection } from '@/components/newsletter-section';

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
