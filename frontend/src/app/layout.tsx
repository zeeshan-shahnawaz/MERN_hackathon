import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HealthMate - Sehat ka Smart Dost',
  description: 'AI-powered personal health companion for storing and understanding medical reports in English and Roman Urdu',
  keywords: ['health', 'medical', 'AI', 'reports', 'urdu', 'english', 'healthcare'],
  authors: [{ name: 'HealthMate Team' }],
  openGraph: {
    title: 'HealthMate - Sehat ka Smart Dost',
    description: 'AI-powered personal health companion for storing and understanding medical reports',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HealthMate - Sehat ka Smart Dost',
    description: 'AI-powered personal health companion for storing and understanding medical reports',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
