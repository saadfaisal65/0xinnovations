"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Droplet, LayoutDashboard, Coins, Code, Vote } from "lucide-react";

export default function PortalPage() {
  const projects = [
    {
      title: "Nexus Faucet Hub",
      description: "A premium multi-chain testnet token distributor for verified developers. Request tokens across various testnets easily.",
      icon: <Droplet className="w-8 h-8 text-cyan-400" />,
      href: "https://faucet-0xinnovation.vercel.app",
      color: "from-cyan-500/20 to-blue-500/20",
      border: "hover:border-cyan-500/50",
      ready: true,
    },
    {
      title: "Decentralized Voting",
      description: "A secure, transparent, and immutable voting system powered by smart contracts on the blockchain.",
      icon: <Vote className="w-8 h-8 text-purple-400" />,
      href: "https://voting-0xinnovation.vercel.app",
      color: "from-purple-500/20 to-indigo-500/20",
      border: "hover:border-purple-500/50",
      ready: true,
    },
    {
      title: "DeFi Dashboard",
      description: "Track your yields, monitor liquidity pools, and manage your decentralized portfolio securely.",
      icon: <LayoutDashboard className="w-8 h-8 text-pink-400" />,
      href: "https://defi-0xinnovation.vercel.app",
      color: "from-pink-500/20 to-rose-500/20",
      border: "hover:border-pink-500/50",
      ready: false,
    },
    {
      title: "Token Exchange",
      description: "Swap testnet tokens seamlessly with our high-speed, low-slippage decentralized exchange protocol.",
      icon: <Coins className="w-8 h-8 text-emerald-400" />,
      href: "https://exchange-0xinnovation.vercel.app",
      color: "from-emerald-500/20 to-teal-500/20",
      border: "hover:border-emerald-500/50",
      ready: false,
    },
    {
      title: "Smart Contracts",
      description: "A secure playground to deploy, verify, and interact with smart contracts on various EVM networks.",
      icon: <Code className="w-8 h-8 text-orange-400" />,
      href: "https://contracts-0xinnovation.vercel.app",
      color: "from-orange-500/20 to-red-500/20",
      border: "hover:border-orange-500/50",
      ready: false,
    }
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center gap-12 mt-12 mb-20">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center space-y-6 max-w-3xl mx-auto mb-4"
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 pb-2 drop-shadow-sm">
          0xInnovations
        </h1>
        <p className="text-neutral-400 text-lg sm:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
          Your gateway to advanced decentralized applications, combining seamless Web3 experiences with powerful functionality.        </p>
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4"
      >
        {projects.map((project, index) => (
          <Link href={project.href} key={index} prefetch={true} className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative h-full flex flex-col p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md transition-all duration-300 ${project.ready ? project.border : "opacity-80 " + project.border
                }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none`}
              />
              <div className="relative z-10 flex items-start justify-between mb-6">
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.1] shadow-xl">
                  {project.icon}
                </div>
                {!project.ready && (
                  <span className="px-3 py-1 rounded-full bg-neutral-800/80 text-neutral-400 text-xs font-semibold tracking-wide border border-neutral-700">
                    Coming Soon
                  </span>
                )}
                {project.ready && (
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold tracking-wide border border-cyan-500/20">
                    Active
                  </span>
                )}
              </div>

              <h3 className="relative z-10 text-2xl font-bold text-white mb-3 tracking-tight">
                {project.title}
              </h3>
              <p className="relative z-10 text-neutral-400 text-sm leading-relaxed flex-grow">
                {project.description}
              </p>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
