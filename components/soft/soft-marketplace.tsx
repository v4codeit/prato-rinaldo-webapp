"use client";

import React from "react";
import { Search, Heart } from "lucide-react";

export function SoftMarketplace({ onNavigate }: { onNavigate?: (view: string) => void }) {
    return (
        <div className="space-y-6 pb-20">

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-soft-navy/40" strokeWidth={2.5} />
                <input
                    placeholder="Search items..."
                    className="w-full h-14 pl-14 pr-4 rounded-[999px] bg-white/90 backdrop-blur-sm border-2 border-transparent focus:border-soft-mint focus:bg-white transition-all outline-none font-medium text-soft-navy placeholder:text-soft-navy/40 shadow-button"
                />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <CategoryPill label="All" active />
                <CategoryPill label="Furniture" />
                <CategoryPill label="Electronics" />
                <CategoryPill label="Garden" />
            </div>

            {/* Create button */}
            <button
                onClick={() => onNavigate?.('marketplace-create')}
                className="w-full h-14 soft-button text-soft-navy font-semibold flex items-center justify-center gap-2"
            >
                <span className="text-xl">+</span>
                Sell Item
            </button>

            {/* Items grid */}
            <div className="grid grid-cols-2 gap-4">
                <MarketItem
                    title="Vintage Lamp"
                    price="€45"
                    tag="Furniture"
                    gradient="gradient-peach"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
                <MarketItem
                    title="Bike Repair"
                    price="€20/h"
                    tag="Service"
                    gradient="gradient-lavender"
                    tall
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
                <MarketItem
                    title="Plants"
                    price="FREE"
                    tag="Garden"
                    gradient="gradient-mint"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
                <MarketItem
                    title="Coffee Table"
                    price="€80"
                    tag="Furniture"
                    gradient="gradient-peach"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
            </div>

        </div>
    );
}

function CategoryPill({ label, active }: any) {
    return (
        <button className={`px-5 py-2 rounded-[999px] font-semibold text-sm whitespace-nowrap transition-all duration-200 ${active ? 'bg-soft-navy text-white shadow-button' : 'bg-white/80 text-soft-navy/60 hover:bg-white hover:text-soft-navy shadow-button'}`}>
            {label}
        </button>
    );
}

function MarketItem({ title, price, tag, gradient, tall, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`soft-card overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 ${tall ? 'row-span-2' : ''}`}
        >
            <div className={`${tall ? 'h-64' : 'h-32'} ${gradient} relative`}>
                <button className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-button hover:scale-110 transition-transform flex items-center justify-center">
                    <Heart className="h-5 w-5 text-soft-navy/40" strokeWidth={2.5} />
                </button>
            </div>

            <div className="p-4">
                <div className="pill pill-mint inline-flex mb-2">
                    <span className="text-xs">{tag}</span>
                </div>
                <h3 className="soft-title text-lg text-soft-navy mb-1">{title}</h3>
                <p className="soft-title text-2xl text-soft-navy">{price}</p>
            </div>
        </div>
    );
}
