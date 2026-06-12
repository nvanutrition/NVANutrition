import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'About NVA Nutrition | Our Story',
 description: 'Learn about NVA Nutrition. Built for Hustlers. Powered by NVA Nutrition. We bring premium protein and sports nutrition to athletes and corporate warriors across India.',
 keywords: 'about nva nutrition, nva nutrition story, nva nutrition protein brand, nva nutrition india, premium sports nutrition, nva nutrition, nva, nva protein, nva nutrition whey protein, nva nutrition mass gainer, nva nutrition creatine, nva nutrition bcaa, nva nutrition pre workout, best protein brand in india, premium protein, fitness supplements, whey protein isolate, gym supplements india, buy protein online, sports nutrition, nva nutrition india, nva supplements, nvanutrition, nva pre workout, nva creatine, nvanutrition, nvnutrition, nvanutitrion',
};

export default function AboutLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <>{children}</>;
}
