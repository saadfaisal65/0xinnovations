'use client';
import { useWallet } from '../hooks/useWallet';
import { ShieldCheck, Activity, LogOut } from 'lucide-react';

export default function Navbar() {
    const { account, formatAddress, connectWallet, isConnecting, isAdmin, network, disconnectWallet } = useWallet();

    return (
        <nav className="app-navbar select-none">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between relative">

                {/* Left: Logo */}
                <div className="flex-shrink-0 flex items-center">
                    <a
                        href="https://0xinnovations.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold tracking-tight hover:opacity-80 transition-all duration-300"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        0xInnovation
                    </a>
                </div>

                {/* Center: Title (absolutely centered) */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <h1
                        className="text-lg font-bold tracking-tight whitespace-nowrap"
                        style={{
                            background: 'var(--hero-gradient)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Decentralized Voting System
                    </h1>
                </div>

                {/* Right: Wallet & Badges */}
                <div className="flex items-center gap-3">

                    {account ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 py-1.5 px-3 rounded-full"
                                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                                {isAdmin && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                                         style={{
                                             background: 'var(--admin-badge-bg)',
                                             color: 'var(--admin-badge-text)',
                                             border: '1px solid var(--admin-badge-border)',
                                         }}>
                                        <ShieldCheck size={14} />
                                        Admin Mode
                                    </div>
                                )}

                                <div className="text-sm font-mono font-semibold px-2"
                                     style={{ color: 'var(--text-secondary)' }}>
                                    {formatAddress(account)}
                                </div>
                            </div>
                            <button
                                onClick={disconnectWallet}
                                title="Disconnect Wallet"
                                className="p-2 rounded-full transition-all duration-300 hover:scale-110"
                                style={{
                                    background: 'rgba(244,63,94,0.08)',
                                    color: '#fb7185',
                                    border: '1px solid rgba(244,63,94,0.15)',
                                }}
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={connectWallet}
                            disabled={isConnecting}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm tracking-wide outline-none transition-all duration-300 hover:scale-105 disabled:opacity-50"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.10)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <Activity size={18} />
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
