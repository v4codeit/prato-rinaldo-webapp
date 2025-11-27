"use client";

import React from "react";
import { X, Home, MessageSquare, Building2, Calendar, Settings, LogOut, ShoppingBag, Vote, Key } from "lucide-react";
import { cn } from "@/lib/utils";

interface NexusMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string) => void;
    activeView: string;
}

export function NexusMenu({ isOpen, onClose, onNavigate, activeView }: NexusMenuProps) {
    return (
        <div className={cn(
            "fixed inset-0 z-[100] transition-all duration-500 flex flex-col items-center justify-center",
            isOpen ? "backdrop-blur-3xl bg-white/80 pointer-events-auto" : "backdrop-blur-0 bg-transparent pointer-events-none opacity-0"
        )}>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 h-12 w-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
                <X className="h-6 w-6" />
            </button>

            {/* Menu Items */}
            <div className="flex flex-col gap-4 w-full max-w-xs text-center h-[80vh] overflow-y-auto demo-no-scrollbar py-10">

                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Main</div>

                <MenuItem
                    icon={Key}
                    label="GATEWAY (LANDING)"
                    isActive={activeView === 'landing'}
                    onClick={() => { onNavigate('landing'); onClose(); }}
                    delay={50}
                />
                <MenuItem
                    icon={Key}
                    label="AUTH / LOGIN"
                    isActive={activeView === 'auth'}
                    onClick={() => { onNavigate('auth'); onClose(); }}
                    delay={75}
                />
                <MenuItem
                    icon={Home}
                    label="DASHBOARD"
                    isActive={activeView === 'dashboard'}
                    onClick={() => { onNavigate('dashboard'); onClose(); }}
                    delay={100}
                />

                <div className="h-px w-full bg-slate-200 my-2" />
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Community</div>

                <MenuItem
                    icon={MessageSquare}
                    label="STREAM"
                    isActive={activeView === 'feed'}
                    onClick={() => { onNavigate('feed'); onClose(); }}
                    delay={150}
                />
                <MenuItem
                    icon={Calendar}
                    label="EVENTS"
                    isActive={activeView === 'events'}
                    onClick={() => { onNavigate('events'); onClose(); }}
                    delay={200}
                />
                <MenuItem
                    icon={Vote}
                    label="AGORA"
                    isActive={activeView === 'agora'}
                    onClick={() => { onNavigate('agora'); onClose(); }}
                    delay={250}
                />
                <MenuItem
                    icon={ShoppingBag}
                    label="MARKET"
                    isActive={activeView === 'marketplace'}
                    onClick={() => { onNavigate('marketplace'); onClose(); }}
                    delay={300}
                />

                <div className="h-px w-full bg-slate-200 my-2" />
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Personal</div>

                <MenuItem
                    icon={Building2}
                    label="MY CONDO"
                    isActive={activeView === 'condo'}
                    onClick={() => { onNavigate('condo'); onClose(); }}
                    delay={350}
                />
                <MenuItem
                    icon={Settings}
                    label="SETTINGS"
                    isActive={activeView === 'settings'}
                    onClick={() => { onNavigate('settings'); onClose(); }}
                    delay={400}
                />
            </div>

        </div>
    );
}

function MenuItem({ icon: Icon, label, isActive, onClick, delay, secondary }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group flex items-center justify-center gap-4 text-xl font-black tracking-tighter transition-all duration-300 hover:scale-105",
                isActive ? "text-[#0ea5e9] nexus-text-glow" : secondary ? "text-slate-400 text-lg" : "text-slate-800 hover:text-[#0ea5e9]"
            )}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]")} />
            {label}
        </button>
    );
}
