"use client";

import { useState } from "react";
import { Github, LogOut, ChevronDown } from "lucide-react";

interface GitHubButtonProps {
    user: any;
    onLogin: () => void;
    onLogout: () => void;
}

export default function GitHubButton({ user, onLogin, onLogout }: GitHubButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!user) {
        return (
            <button
                onClick={onLogin}
                className="flex items-center gap-2 bg-[#0a0a0a] text-white border border-neutral-700 font-medium px-[22px] py-[10px] rounded-full hover:bg-neutral-800 transition-all focus:outline-none focus:ring-2 focus:ring-neutral-500 shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
            >
                <Github size={18} />
                <span className="text-sm tracking-wide">Connect GitHub</span>
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-[#111111] border border-neutral-800 rounded-full pl-1.5 pr-4 py-1.5 hover:bg-neutral-800 transition-all shadow-lg focus:outline-none focus:ring-1 focus:ring-neutral-600"
            >
                <img
                    src={user.user_metadata?.avatar_url || "https://github.com/github.png"}
                    alt="avatar"
                    className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700"
                />
                <span className="text-sm font-semibold text-white tracking-wide whitespace-nowrap">
                    @{user.user_metadata?.user_name || user.user_metadata?.preferred_username || user.user_metadata?.name || "developer"}
                </span>
                <ChevronDown size={14} className={`text-neutral-500 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#0a0a0a] border border-neutral-800 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden outline outline-1 outline-neutral-900">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onLogout();
                        }}
                        className="w-full flex items-center justify-between gap-3 px-5 py-3 text-sm font-medium text-red-500 hover:bg-neutral-900 transition-all group"
                    >
                        <span>Disconnect</span>
                        <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
}
