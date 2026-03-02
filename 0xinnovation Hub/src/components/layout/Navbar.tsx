"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import GitHubButton from "@/components/ui/GitHubButton";
import Link from "next/link";
import { Menu, X, Home, Droplet, LayoutDashboard, Coins, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const { user, handleLogin, handleLogout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navLinks = [
        { name: "Home Hub", href: "/", icon: <Home className="w-5 h-5" /> },
        { name: "Nexus Faucet", href: "https://faucet-0xinnovation.vercel.app", icon: <Droplet className="w-5 h-5" /> },
        { name: "DeFi Dashboard", href: "https://defi-0xinnovation.vercel.app", icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: "Token Exchange", href: "https://exchange-0xinnovation.vercel.app", icon: <Coins className="w-5 h-5" /> },
        { name: "Smart Contracts", href: "https://contracts-0xinnovation.vercel.app", icon: <Code className="w-5 h-5" /> },
    ];

    return (
        <>
            <nav className="w-full border-b border-cyan-900/30 bg-[#0B0F19]/60 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(6,182,212,0.15)] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-[72px]">

                        {/* Left side with Hamburger and Logo */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="text-neutral-300 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-lg"
                            >
                                <Menu size={24} />
                            </button>

                            <Link href="/" className="flex-shrink-0 flex items-center gap-2.5 group hidden sm:flex">
                                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-shadow">
                                    <span className="text-black font-black text-xl leading-none tracking-tighter">0x</span>
                                </div>
                                <span className="text-white font-bold text-lg tracking-tight hover:text-neutral-300 transition-colors">0xInnovations</span>
                            </Link>
                        </div>

                        {/* Right side with Auth Section */}
                        <div className="flex items-center gap-4">
                            <GitHubButton user={user} onLogin={handleLogin} onLogout={handleLogout} />
                        </div>

                    </div>
                </div>
            </nav>

            {/* Sidebar Overlay and Drawer */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0f1523] border-r border-white/10 z-[9999] shadow-[10px_0_50px_rgba(0,0,0,0.8)] flex flex-col pt-[20px]"
                        >
                            <div className="flex items-center justify-between px-6 pb-6 border-b border-white/5">
                                <span className="text-white font-bold text-lg tracking-tight">Navigation</span>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="text-neutral-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex flex-col p-4 gap-2 overflow-y-auto">
                                {navLinks.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={"flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-all group font-medium" + (link.href === "#" ? " cursor-not-allowed opacity-60" : "")}
                                    >
                                        <div className="text-cyan-500/70 group-hover:text-cyan-400 transition-colors">
                                            {link.icon}
                                        </div>
                                        {link.name}
                                        {link.href === "#" && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500 ml-auto border border-neutral-700">
                                                Soon
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-auto p-6 border-t border-white/5">
                                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                                    <p className="text-xs text-cyan-200/70 font-medium text-center">
                                        More projects being added regularly. Stay tuned for updates!
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
