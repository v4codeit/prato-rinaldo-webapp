"use client";

import React, { useState } from "react";
import { Plus, X, MessageSquare, AlertTriangle, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActionOrb() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">

            {/* Radial Menu Items */}
            <div className={cn(
                "absolute inset-0 transition-all duration-300 pointer-events-none",
                isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}>
                <OrbItem icon={MessageSquare} angle={-45} delay={0} label="Post" color="bg-[#bae6fd] text-[#0ea5e9]" />
                <OrbItem icon={AlertTriangle} angle={0} delay={50} label="Alert" color="bg-[#fbcfe8] text-[#ec4899]" />
                <OrbItem icon={ShoppingBag} angle={45} delay={100} label="Sell" color="bg-[#bbf7d0] text-[#16a34a]" />
            </div>

            {/* Main Orb Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-16 w-16 rounded-full bg-white border border-[#bae6fd] flex items-center justify-center text-[#0ea5e9] transition-all duration-300 nexus-orb-shadow relative z-10",
                    isOpen ? "rotate-45 scale-90" : "hover:scale-110"
                )}
            >
                <div className="absolute inset-0 rounded-full bg-[#bae6fd] opacity-30 blur-md animate-pulse" />
                <Plus className="h-8 w-8 relative z-10" />
            </button>

        </div>
    );
}

function OrbItem({ icon: Icon, angle, delay, label, color }: { icon: any, angle: number, delay: number, label: string, color: string }) {
    // Calculate position based on angle (simplified for demo: fixed offsets)
    // -45deg = top-left, 0deg = top, 45deg = top-right
    const translateY = -80;
    const translateX = angle === -45 ? -60 : angle === 45 ? 60 : 0;

    return (
        <div
            className="absolute top-0 left-0 h-16 w-16 flex flex-col items-center justify-center transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
            style={{
                transform: `translate(${translateX}px, ${translateY}px)`,
                transitionDelay: `${delay}ms`
            }}
        >
            <button className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg pointer-events-auto hover:scale-110 transition-transform",
                color
            )}>
                <Icon className="h-5 w-5" />
            </button>
            <span className="text-[10px] font-bold mt-1 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm text-white">{label}</span>
        </div>
    );
}
