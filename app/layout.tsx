// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SidebarProvider } from '@/context/SidebarContext'
import './globals.css'
import PayPalScript from '@/components/PayPalScript'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CPS-SomaPRO - Learning Management System',
  description: 'Modern LMS for online education by Teevos Solutions',
  authors: [{ name: 'Teevos Solutions' }],
  creator: 'Teevos Solutions',
  publisher: 'Teevos Solutions',
  applicationName: 'CPS-SomaPRO',
  keywords: ['LMS', 'Learning Management System', 'Education', 'Online Learning'],
  openGraph: {
    title: 'CPS-SomaPRO - Learning Management System',
    description: 'Modern LMS for online education by Teevos Solutions',
    type: 'website',
  },
}

// Custom metadata extended properties
export const customMetadata = {
  licensedTo: 'CPS Institute',
  developedBy: 'Teevos Solutions',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider>
          {children}
          <PayPalScript />
        </SidebarProvider>
      </body>
    </html>
  )
}