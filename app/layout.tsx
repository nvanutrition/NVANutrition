import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'NVA Nutrition | Premium Sports Nutrition for Hustlers',
  description: 'Built for Hustlers. Powered by Nutrition. Premium Protein & Sports Nutrition for athletes, gym enthusiasts, and corporate warriors. Welcome to the future of strength, stamina, and performance.',
  keywords: 'protein powder, sports nutrition, whey protein, mass gainer, creatine, BCAA, pre-workout, India',
  generator: 'v0.app',
  openGraph: {
    title: 'NVA Nutrition | Premium Sports Nutrition for Hustlers',
    description: 'Built for Hustlers. Powered by Nutrition. Premium Protein & Sports Nutrition for Champions.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'NVA Nutrition',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-gradient-dark scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#00C853" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased bg-gradient-dark text-foreground">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}

