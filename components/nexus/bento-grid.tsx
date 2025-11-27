"use client";
"use client";

import React from "react";
import { CloudRain, ArrowUpRight, Zap, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BentoGrid() {
    return (
        <div className="grid grid-cols-4 grid-rows-6 gap-3 h-[600px]">

            {/* 1. Hero Cell (2x2) - Critical Alert or Main Event */}
            <div className="col-span-4 row-span-2 nexus-glass rounded-[30px] p-6 relative overflow-hidden group nexus-grid-item bg-[#fbcfe8]/20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#fbcfe8]/40 to-transparent opacity-50" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="bg-[#ec4899] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">
                            Urgent
                        </span>
                        <ArrowUpRight className="text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold leading-tight mb-1 text-slate-900">Acqua Chiusa</h3>
                        <p className="text-sm text-slate-600">Via Roma, 09:00 - 13:00</p>
                    </div>
                </div>
            </div>

            {/* 2. Weather Pill (2x2) */}
            <div className="col-span-2 row-span-2 nexus-glass rounded-[30px] p-5 flex flex-col items-center justify-center relative nexus-grid-item bg-[#bae6fd]/20">
                <CloudRain className="h-12 w-12 text-[#0ea5e9] mb-2 drop-shadow-sm" />
                <span className="text-3xl font-bold text-slate-900">18°</span>
                <span className="text-xs text-slate-500 font-mono">PIOGGIA</span>
            </div>

            {/* 3. Community Stats (2x1) */}
            <div className="col-span-2 row-span-1 nexus-glass rounded-[30px] p-4 flex items-center justify-between nexus-grid-item bg-white/40">
                <div className="flex -space-x-2">
                    <div className="h-8 w-8 rounded-full bg-slate-200 border border-white" />
                    <div className="h-8 w-8 rounded-full bg-slate-300 border border-white" />
                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[10px] font-bold text-slate-600">+5</div>
                </div>
                <Users className="h-5 w-5 text-[#0ea5e9]" />
            </div>

            {/* 4. Quick Pay (2x1) */}
            <div className="col-span-2 row-span-1 nexus-glass rounded-[30px] p-4 flex items-center justify-between nexus-grid-item bg-[#bbf7d0]/30">
                <span className="font-bold text-sm text-slate-900">Paga Rata</span>
                <Zap className="h-5 w-5 text-[#16a34a]" />
            </div>

            {/* 5. Live Feed Ticker (4x2) */}
            <div className="col-span-4 row-span-2 nexus-glass rounded-[30px] p-5 nexus-grid-item bg-white/40">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-[#ec4899] animate-ping" />
                    <span className="text-xs font-mono text-[#ec4899] tracking-widest">LIVE FEED</span>
                </div>
                <div className="space-y-3">
                    <FeedItem title="Mario ha venduto Bici" time="2m ago" />
                    <FeedItem title="Nuova assemblea indetta" time="1h ago" />
                </div>
            </div>

        </div>
    );
}

function FeedItem({ title, time }: { title: string, time: string }) {
    return (
        <div className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
            <span className="text-sm font-medium truncate max-w-[70%] text-slate-800">{title}</span>
            <span className="text-xs text-slate-400 font-mono">{time}</span>
        </div>
    );
}
