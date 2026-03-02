"use client";

import { useState } from "react";
import NetworkCard from "@/features/faucet/components/NetworkCard";
import ClaimPanel from "@/features/faucet/components/ClaimPanel";
import { networks, NetworkConfig } from "@/features/faucet/config/networks";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import BackButton from "@/components/ui/BackButton";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } as any }
};

export default function Home() {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-12 mt-12 mb-20">
      <BackButton />
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center space-y-6 max-w-3xl mx-auto mb-4"
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 pb-2 drop-shadow-sm">
          Testnet Token Distributor
        </h1>
        <p className="text-neutral-400 text-lg sm:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
          Securely claim developer testnet tokens across multiple EVM networks.
        </p>
      </motion.div>

      {/* Network Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl px-4"
      >
        {networks.map((net) => (
          <motion.div key={net.id} variants={itemVariants} className="h-full">
            <NetworkCard network={net} onClick={setSelectedNetwork} />
          </motion.div>
        ))}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {selectedNetwork && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNetwork(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              className="relative z-10 w-full max-w-lg"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <button
                onClick={() => setSelectedNetwork(null)}
                className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"
              >
                <X size={20} />
              </button>
              <ClaimPanel network={selectedNetwork} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
