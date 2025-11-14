import { Noto_Naskh_Arabic, Vazirmatn } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import Footer from '@/components/ui/footer'
import type { Metadata } from 'next'
import './globals.css'

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
})

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-noto-naskh',
  display: 'swap',
})

const uthmanic = localFont({
  src: [
    {
      path: '../public/fonts/QuranTaha.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-quran-uthmanic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ختم قرآن - کمپین های قرآنی',
  description: 'پلتفرم ختم قرآن با کمپین های جمعی',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${vazirmatn.variable} ${notoNaskh.variable} ${uthmanic.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <div className="flex-1">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
