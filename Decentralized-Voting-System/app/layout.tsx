import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import CosmicBackground from '../components/CosmicBackground';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Decentralized Voting System | 0xInnovation',
  description: 'A secure, transparent, and blockchain-powered decentralized voting system for Union Council Elections.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className={`${inter.className} min-h-screen relative overflow-x-hidden`} style={{ color: 'var(--text-primary)' }}>
        {/* Full-screen cosmic background */}
        <CosmicBackground />

        {/* Main content */}
        <div className="relative z-10 w-full min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
