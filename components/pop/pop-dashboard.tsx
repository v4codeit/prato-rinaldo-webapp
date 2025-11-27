"use client";

import React, { useState } from "react";
import { Bell, Search, Plus, Zap, Home, Wallet, CloudSun, MessageSquare, AlertTriangle, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const PopActionOrb = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-24 right-6 z-50">
            {/* Radial Menu Items */}
            <div className={cn(
                "absolute bottom-0 right-0 transition-all duration-300 pointer-events-none",
                isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}>
                <button className="absolute bottom-20 right-0 w-12 h-12 bg-[#FFD88D] border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-auto hover:scale-110 transition-transform">
                    <MessageSquare size={20} />
                </button>
                <button className="absolute bottom-14 right-14 w-12 h-12 bg-[#FFB7B2] border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-auto hover:scale-110 transition-transform">
                    <AlertTriangle size={20} />
                </button>
                <button className="absolute bottom-0 right-20 w-12 h-12 bg-[#B8E6E1] border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pointer-events-auto hover:scale-110 transition-transform">
                    <ShoppingBag size={20} />
                </button>
            </div>

            {/* Main Orb Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-16 w-16 rounded-full bg-black border-2 border-black flex items-center justify-center text-white transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] relative z-10",
                    isOpen ? "rotate-45 bg-white text-black" : "hover:scale-105"
                )}
            >
                <Plus className="h-8 w-8" />
            </button>
        </div>
    );
};

export const PopDashboard = () => {
    return (
        <div className="p-6 pt-12 pb-24 space-y-6 bg-[#B8E6E1] min-h-full relative">

            <PopActionOrb />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-[#1A1A1A]">Hello, Alex!</h1>
                    <p className="font-bold text-black/60">Prato Rinaldo</p>
                </div>
                <button className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
                    <Bell size={24} />
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} />
                <input
                    className="w-full bg-white border-2 border-black rounded-full py-3 pl-12 pr-4 font-bold placeholder:text-gray-400 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none"
                    placeholder="Search anything..."
                />
            </div>

            {/* Hero Card - Balance/Status */}
            <div className="bg-[#FAFAFA] border-2 border-black rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FFD88D] rounded-full border-2 border-black group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-[#FFB7B2] rounded-full border-2 border-black group-hover:scale-110 transition-transform duration-500 delay-75" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="bg-black text-white p-2 rounded-lg border-2 border-transparent group-hover:border-white transition-colors">
                            <Wallet size={20} />
                        </div>
                        <span className="font-black text-lg">Balance</span>
                    </div>
                    <h2 className="text-4xl font-black mb-1">€ 1,250.00</h2>
                    <p className="font-bold opacity-60">Maintenance Fees Paid</p>

                    <button className="mt-6 bg-black text-white px-6 py-2 rounded-full font-bold text-sm border-2 border-black hover:bg-white hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]">
                        View History
                    </button>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
                <button className="bg-[#FFB7B2] border-2 border-black rounded-[20px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="font-black text-sm">New Request</span>
                </button>
                <button className="bg-[#D4C5F9] border-2 border-black rounded-[20px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center group-hover:-rotate-12 transition-transform">
                        <Zap size={24} />
                    </div>
                    <span className="font-black text-sm">Quick Pay</span>
                </button>
            </div>

            {/* Weather / Info Widget */}
            <div className="bg-[#A0C4FF] border-2 border-black rounded-[24px] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl" />
                <div className="relative z-10">
                    <p className="font-bold text-black/60 text-xs uppercase tracking-wider">Today in Prato</p>
                    <h3 className="text-xl font-black">Sunny, 24°C</h3>
                </div>
                <CloudSun size={40} strokeWidth={2} className="text-[#FFD88D] fill-white relative z-10 drop-shadow-md" />
            </div>

            {/* Recent Activity List */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h3 className="text-xl font-black">Recent Activity</h3>
                    <button className="text-xs font-bold underline decoration-2 decoration-[#FFD88D]">View All</button>
                </div>

                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border-2 border-black rounded-xl p-4 flex items-center gap-4 hover:translate-x-1 transition-transform cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className={`w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-black ${i === 1 ? 'bg-[#B8E6E1]' : i === 2 ? 'bg-[#FFD88D]' : 'bg-[#FFB7B2]'}`}>
                            {i === 1 ? 'JD' : i === 2 ? 'MK' : 'AL'}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">Community Meeting</h4>
                            <p className="text-xs font-bold text-gray-400">2 hours ago</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                            <div className="w-1 h-1 bg-current rounded-full" />
                            <div className="w-1 h-1 bg-current rounded-full mx-0.5" />
                            <div className="w-1 h-1 bg-current rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};
