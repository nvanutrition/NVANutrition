import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact NVA Nutrition | Get in Touch',
  description: 'Get in touch with NVA Nutrition. We are here to help you with your premium sports nutrition and protein needs. Contact us via phone, email, or WhatsApp.',
  keywords: 'contact nva nutrition, nva nutrition customer support, nva nutrition phone number, nva nutrition email, nva nutrition address, nva nutrition, nva, nva protein, nva nutrition whey protein, nva nutrition mass gainer, nva nutrition creatine, nva nutrition bcaa, nva nutrition pre workout, best protein brand in india, premium protein, fitness supplements, whey protein isolate, gym supplements india, buy protein online, sports nutrition, nva nutrition india, nva supplements, nvanutrition, nva pre workout, nva creatine',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
