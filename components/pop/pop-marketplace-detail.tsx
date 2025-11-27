"use client";

import React from "react";
import { ArrowLeft, MessageCircle, Heart, Tag, ShieldCheck } from "lucide-react";

export const PopMarketplaceDetail = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="min-h-full bg-[#D4C5F9] p-6 pb-24 relative">

            <button
                onClick={onBack}
                className="absolute top-6 left-6 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all z-10"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="w-full aspect-square bg-white border-2 border-black rounded-[24px] mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative overflow-hidden mt-12">
                <div className="absolute inset-0 bg-[#FFD88D]/20" />
                <Tag size={64} className="text-black/20" />
                <button className="absolute top-4 right-4 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-90 transition-transform">
                    <Heart size={20} />
                </button>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="inline-block px-2 py-0.5 border-2 border-black rounded-md text-xs font-black uppercase bg-[#B8E6E1] mb-2">Furniture</span>
                        <h1 className="text-3xl font-black leading-tight">Vintage Lamp</h1>
                    </div>
                    <div className="bg-black text-white px-4 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#FFB7B2] transform rotate-3">
                        <span className="font-black text-xl">€45</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-black rounded-[20px] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-lg mb-2">Description</h3>
                    <p className="font-medium text-gray-600 leading-relaxed">
                        Beautiful vintage lamp from the 70s. Works perfectly. Pick up only.
                    </p>
                </div>

                {/* Seller Card */}
                <div className="bg-[#A0C4FF] border-2 border-black rounded-[20px] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center font-black">
                        JD
                    </div>
                    <div className="flex-1">
                        <h3 className="font-black">John Doe</h3>
                        <div className="flex items-center gap-1 text-xs font-bold text-black/60">
                            <ShieldCheck size={12} /> Verified Neighbor
                        </div>
                    </div>
                    <button className="bg-white border-2 border-black p-2 rounded-lg hover:bg-black hover:text-white transition-colors">
                        <MessageCircle size={20} />
                    </button>
                </div>

            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t-2 border-black z-20">
                <button className="w-full bg-black text-white border-2 border-black rounded-xl py-3 font-bold text-lg shadow-[4px_4px_0px_0px_#B8E6E1] active:translate-y-1 active:shadow-none transition-all">
                    Buy Now
                </button>
            </div>

        </div>
    );
};
