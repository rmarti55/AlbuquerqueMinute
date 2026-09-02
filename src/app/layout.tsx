import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Albuquerque Minute',
  description: 'Admin — Albuquerque civic meetings pipeline',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
