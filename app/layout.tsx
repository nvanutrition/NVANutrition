import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
 title: 'NVA Nutrition | Premium Sports Nutrition',
 description: 'Built for Hustlers. Powered by NVA Nutrition. Premium Protein & Sports Nutrition for athletes, gym enthusiasts, and corporate warriors. NVA Nutrition brings you the ultimate whey protein, creatine, and pre-workouts in India.',
 keywords: 'nva nutrition, nva, nva protein, nva nutrition whey protein, nva nutrition mass gainer, nva nutrition creatine, nva nutrition bcaa, nva nutrition pre workout, best protein brand in india, premium protein, fitness supplements, whey protein isolate, gym supplements india, buy protein online, sports nutrition, nva nutrition india, nva supplements, nvanutrition, nva pre workout, nva creatine, nvanutrition, nvnutrition, nvanutitrion',
 authors: [{ name: 'NVA Nutrition' }],
 creator: 'NVA Nutrition',
 publisher: 'NVA Nutrition',
 generator: 'Next.js',
 metadataBase: new URL('https://nvanutrition.com'),
 applicationName: 'NVA Nutrition',
 category: 'Sports Nutrition',
 classification: 'Health & Fitness',
 formatDetection: {
 email: false,
 address: false,
 telephone: false,
 },
 icons: {
 icon: '/logo.png',
 },
 openGraph: {
 title: 'NVA Nutrition | Premium Sports Nutrition',
 description: 'Built for Hustlers. Powered by NVA Nutrition. Premium Protein & Sports Nutrition for Champions.',
 siteName: 'NVA Nutrition',
 locale: 'en_IN',
 type: 'website',
 images: [
 {
 url: '/logo.png',
 width: 1200,
 height: 630,
 alt: 'NVA Nutrition Logo',
 },
 ],
 },
 twitter: {
 card: 'summary_large_image',
 title: 'NVA Nutrition | Premium Sports Nutrition',
 description: 'Built for Hustlers. Powered by NVA Nutrition.',
 images: ['/logo.png'],
 },
 robots: {
 index: true,
 follow: true,
 googleBot: {
 index: true,
 follow: true,
 'max-video-preview': -1,
 'max-image-preview': 'large',
 'max-snippet': -1,
 },
 },
}

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode
}>) {
 return (
 <html lang="en" className="scroll-smooth" suppressHydrationWarning>
 <head>
 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 <meta name="theme-color" content="#00C853" />
 <meta name="apple-mobile-web-app-capable" content="yes" />
 </head>
 <body className="font-sans antialiased bg-background text-foreground">
 <AuthProvider>
 {children}
 </AuthProvider>
 <Toaster position="bottom-right" />
 </body>
 </html>
 )
}
