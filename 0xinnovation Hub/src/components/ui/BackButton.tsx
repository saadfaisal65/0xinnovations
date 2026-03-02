"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function BackButton() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-6xl mx-auto flex justify-start px-4 sm:px-8 mb-2 sm:-mb-6 z-40 relative"
        >
            <Link 
                href="/" 
                className="group flex items-center gap-2.5 px-3 py-2 bg-[#0B0F19]/80 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-xl text-neutral-400 hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                prefetch={true}
            >
                <div className="bg-white/5 p-1 rounded-lg group-hover:bg-white/10 group-hover:scale-105 transition-all">
                    <ArrowLeft size={16} />
                </div>
                <span className="text-sm font-semibold tracking-wide pr-1">Back to Hub</span>
            </Link>
        </motion.div>
    );
}
