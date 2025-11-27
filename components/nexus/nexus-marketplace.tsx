"use client";

import React from "react";
import { Search, Filter, Tag, Heart, ShoppingBag } from "lucide-react";

export function NexusMarketplace({ onNavigate }: { onNavigate?: (view: string) => void }) {
    return (
        <div className="space-y-6 pb-20">

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search items..."
                    className="w-full h-12 pl-12 pr-4 rounded-full bg-white/50 border border-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 text-slate-800 placeholder:text-slate-400 shadow-sm"
                />
            </div>

            {/* Categories */}
            <div className="flex gap-3 overflow-x-auto pb-2 demo-no-scrollbar">
                <CategoryPill label="All" active />
                <CategoryPill label="Furniture" />
                <CategoryPill label="Electronics" />
                <CategoryPill label="Services" />
                <CategoryPill label="Free" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-black text-slate-900">Latest Items</h2>
                <button
                    onClick={() => onNavigate?.('marketplace-create')}
                    className="text-xs font-bold text-[#0ea5e9] uppercase tracking-wider hover:underline"
                >
                    + Sell Item
                </button>
            </div>

            {/* Masonry Grid */}
            <div className="grid grid-cols-2 gap-4">
                <MarketItem
                    title="Vintage Lamp"
                    price="€45"
                    image="https://images.unsplash.com/photo-1507473888900-52e1adad5481?q=80&w=1974&auto=format&fit=crop"
                    tag="Furniture"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
                <MarketItem
                    title="Bike Repair"
                    price="€20/h"
                    image="https://images.unsplash.com/photo-1588611910694-3bc44d825b97?q=80&w=1974&auto=format&fit=crop"
                    tag="Service"
                    height="h-64"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
                <MarketItem
                    title="Plants"
                    price="Free"
                    image="https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=2072&auto=format&fit=crop"
                    tag="Garden"
                    height="h-40"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
                <MarketItem
                    title="Coffee Table"
                    price="€80"
                    image="https://images.unsplash.com/photo-1532372320572-cda25653a26d?q=80&w=1974&auto=format&fit=crop"
                    tag="Furniture"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
            </div>

        </div>
    );
}

function CategoryPill({ label, active }: { label: string, active?: boolean }) {
    return (
        <button className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${active ? 'bg-[#0ea5e9] text-white shadow-lg shadow-sky-200' : 'bg-white/40 text-slate-500 hover:bg-white/60'}`}>
            {label}
        </button>
    );
}

function MarketItem({ title, price, image, tag, height = "h-48", onClick }: any) {
    return (
        <div
            onClick={onClick}
            className="nexus-glass p-2 rounded-2xl bg-white/40 hover:bg-white/60 transition-all group cursor-pointer break-inside-avoid mb-0"
        >
            <div className={`${height} w-full rounded-xl bg-slate-200 relative overflow-hidden mb-3`}>
                <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <button className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-[#ec4899] transition-colors">
                    <Heart className="h-4 w-4" />
                </button>
                <span className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                    {tag}
                </span>
            </div>

            <div className="px-1 pb-1">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{title}</h4>
                    <span className="font-black text-[#0ea5e9] text-sm">{price}</span>
                </div>
            </div>
        </div>
    );
}
