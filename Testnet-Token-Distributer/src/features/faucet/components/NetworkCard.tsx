"use client";

import { motion } from "framer-motion";
import { NetworkConfig } from "@/features/faucet/config/networks";

interface NetworkCardProps {
    network: NetworkConfig;
    onClick?: (network: NetworkConfig) => void;
}

export default function NetworkCard({ network, onClick }: NetworkCardProps) {
    return (
        <div onClick={() => onClick?.(network)} className="block w-full h-full group outline-none cursor-pointer">
            <motion.div
                whileHover={{ scale: 1.03, y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
                whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-[#2a1130]/40 backdrop-blur-2xl rounded-2xl p-[1px] cursor-pointer flex flex-col h-full transition-all duration-500 overflow-visible"
                style={{
                    boxShadow: `0 8px 32px ${network.shadowColor?.replace('0.5', '0.15') || 'rgba(0,0,0,0.5)'}`
                }}
            >
                {/* Glowing Gradient Border layer */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${network.glowColor} opacity-30 group-hover:opacity-100 transition-opacity duration-500 blur-sm`} />
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${network.glowColor} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Card Inner Content */}
                <div className="relative bg-gradient-to-br from-[#1e0a24]/95 to-[#110515]/95 rounded-2xl p-8 flex flex-col items-center text-center h-full z-10 w-full overflow-hidden transition-colors duration-500 group-hover:from-[#250d2c]/95 group-hover:to-[#17061d]/95">

                    {/* Inner highlight */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {/* Logo */}
                    {network.iconUrl && (
                        <div className="w-16 h-16 mb-5 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <img src={network.iconUrl} alt={`${network.name} logo`} className="w-8 h-8 drop-shadow-lg" />
                        </div>
                    )}

                    <h3 className="text-xl font-bold text-white mb-6 relative z-10 tracking-tight">{network.name}</h3>

                    <div className="flex flex-col items-center gap-1 mb-8">
                        <span className="text-sm text-neutral-400 font-medium tracking-wide uppercase">Network</span>
                        <span className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${network.glowColor} drop-shadow-sm`}>
                            {network.symbol}
                        </span>
                    </div>

                    <div className="mt-auto w-full relative z-10">
                        <div className="w-full bg-white/5 border border-white/10 group-hover:bg-white/15 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 backdrop-blur-md group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:border-white/20">
                            Get {network.symbol}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
