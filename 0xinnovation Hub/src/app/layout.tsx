import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '@/components/layout/Navbar';
import CosmicBackground from '@/components/layout/CosmicBackground';
import ClientLockdown from '@/components/layout/ClientLockdown';
import ToastProvider from '@/components/layout/ToastProvider';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap', // Prevent FOIT (Flash of Invisible Text)
});

export const metadata: Metadata = {
    title: '0xInnovations',
    description: 'Multi-chain testnet token distributor for verified developers.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                {/* Preconnect to external services for faster loading */}
                <link rel="preconnect" href="https://yfhuunutzomuecqwfxil.supabase.co" />
                <link rel="dns-prefetch" href="https://yfhuunutzomuecqwfxil.supabase.co" />
            </head>
            <body className={`${inter.className} bg-background text-foreground min-h-screen flex flex-col relative select-none`}>
                <ClientLockdown />
                <CosmicBackground />
                <Navbar />

                <main className="flex-grow flex flex-col items-center p-4 sm:p-8 lg:p-12 max-w-6xl mx-auto w-full relative z-10">
                    {children}
                </main>

                {/* Footer */}
                <footer className="w-full border-t border-neutral-900 mt-20 py-8 text-center text-sm text-neutral-500 flex flex-col gap-2">
                    <p>0xInnovations &copy; 2026</p>
                </footer>

                {/* Global Toast Notifications — Lazy Loaded */}
                <ToastProvider />
            </body>
        </html>
    );
}
