"use client";

import React from "react";
import { ArrowRight, Star, Zap, Shield, Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const PopLanding = ({ onStart }: { onStart: () => void }) => {
    return (
        <div className="min-h-full bg-[#B8E6E1] relative overflow-hidden flex flex-col">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-[#FFD88D] rounded-full border-2 border-black" />
            <div className="absolute bottom-[100px] left-[-20px] w-24 h-24 bg-[#FFB7B2] rounded-full border-2 border-black" />
            <div className="absolute top-[20%] left-[10%] text-black opacity-20">
                <Star size={48} strokeWidth={3} />
            </div>
            <div className="absolute bottom-[20%] right-[10%] text-black opacity-20">
                <Zap size={48} strokeWidth={3} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 pt-20">

                {/* Logo / Icon */}
                <div className="relative">
                    <div className="w-32 h-32 bg-white border-2 border-black rounded-[30px] flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform -rotate-6">
                        <div className="w-20 h-20 bg-[#D4C5F9] border-2 border-black rounded-full flex items-center justify-center">
                            <Heart size={40} strokeWidth={2.5} className="text-black fill-white" />
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-[#FFD88D] border-2 border-black px-3 py-1 rounded-full text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-12">
                        BETA
                    </div>
                </div>

                {/* Headlines */}
                <div className="space-y-2">
                    <h1 className="text-6xl font-black tracking-tighter leading-[0.9]">
                        NEXUS
                        <span className="block text-4xl text-white text-stroke-black">APP</span>
                    </h1>
                    <p className="text-lg font-bold mt-4 max-w-[200px] mx-auto leading-tight">
                        The neighborhood app that actually pops!
                    </p>
                </div>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                    <div className="pop-badge bg-white">Community</div>
                    <div className="pop-badge bg-[#FFD88D]">Events</div>
                    <div className="pop-badge bg-[#FFB7B2]">Market</div>
                    <div className="pop-badge bg-[#D4C5F9]">Voting</div>
                </div>

            </div>

            {/* Bottom Action Area */}
            <div className="p-8 pb-12 bg-white border-t-2 border-black rounded-t-[40px] shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.1)]">
                <button
                    onClick={onStart}
                    className="w-full bg-black text-white border-2 border-black rounded-full py-4 text-xl font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#FFD88D] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#FFD88D] transition-all active:translate-y-2 active:shadow-none"
                >
                    Get Started <ArrowRight size={24} />
                </button>
                <p className="text-center text-xs font-bold mt-4 text-gray-400 uppercase tracking-widest">
                    Join 5,000+ Neighbors
                </p>
            </div>
        </div>
    );
};
