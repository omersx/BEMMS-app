import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import AuthProvider from '@/components/providers/session-provider'
import { ServiceWorkerRegister } from '@/components/pwa/sw-register'
import { InstallPrompt } from '@/components/pwa/install-prompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BEMMS',
  description: 'Biomedical Equipment Management and Maintenance System',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BEMMS',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
          <ServiceWorkerRegister />
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  )
}