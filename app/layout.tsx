import { Vazirmatn } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Footer from '@/components/ui/footer'
import type { Metadata } from 'next'
import './globals.css'

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
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
        className={`${vazirmatn.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <div className="flex-1">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
