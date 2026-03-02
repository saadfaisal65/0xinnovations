"use client";

import { NetworkConfig } from '@/features/faucet/config/networks';
import { motion } from 'framer-motion';

import { useAuth } from '@/lib/hooks/useAuth';

interface ClaimPanelProps {
    network: NetworkConfig;
}

export default function ClaimPanel({ network }: ClaimPanelProps) {
    const { user, handleLogin } = useAuth();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`relative bg-[#2a1130]/40 backdrop-blur-2xl rounded-3xl p-[1px] w-full max-w-sm mx-auto overflow-visible shadow-2xl`}
            style={{
                boxShadow: `0 8px 40px ${network.shadowColor?.replace('0.5', '0.2') || 'rgba(0,0,0,0.5)'}`
            }}
        >
            {/* Glowing Gradient Border layer */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${network.glowColor} opacity-50 blur-sm`} />
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${network.glowColor} opacity-70`} />

            <div className="relative bg-gradient-to-br from-[#1e0a24]/95 to-[#110515]/95 rounded-3xl p-8 sm:p-10 flex flex-col items-center h-full z-10 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Header & Icon */}
                <div className="mb-8 text-center relative z-10 w-full flex flex-col items-center">
                    {network.iconUrl && (
                        <div className="w-24 h-24 mb-6 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shadow-inner mt-2">
                            <img src={network.iconUrl} alt={`${network.name} logo`} className="w-12 h-12 drop-shadow-xl" />
                        </div>
                    )}
                    <h2 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${network.glowColor} drop-shadow-sm mb-4 tracking-tight`}>
                        {network.name}
                    </h2>
                </div>

                {/* Action Button */}
                {!user ? (
                    <button
                        onClick={handleLogin}
                        className="w-full py-4 px-6 rounded-2xl font-bold text-[15px] transition-all flex justify-center items-center gap-2 relative z-10 h-14 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-transparent"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                        Connect GitHub
                    </button>
                ) : (
                    <a
                        href={network.faucetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 px-6 rounded-2xl font-bold text-[15px] transition-all flex justify-center items-center relative z-10 h-14 bg-white text-black hover:bg-neutral-200 active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] border border-transparent"
                    >
                        Go to Faucet
                    </a>
                )}
            </div>
        </motion.div>
    );
}
