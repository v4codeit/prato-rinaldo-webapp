"use client";

import React from "react";
import { Search, Tag } from "lucide-react";

export function BrutalMarketplace({ onNavigate }: { onNavigate?: (view: string) => void }) {
    return (
        <div className="space-y-6 pb-20">

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6" strokeWidth={3} />
                <input
                    placeholder="SEARCH ITEMS..."
                    className="w-full h-16 pl-14 pr-4 border-[4px] border-black shadow-[6px_6px_0_black] font-bold uppercase placeholder:text-black/40 focus:outline-none focus:border-cyan focus:shadow-[0_0_0_4px_#00FFFF]"
                />
            </div>

            {/* Categories */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                <CategoryPill label="ALL" active />
                <CategoryPill label="FURNITURE" />
                <CategoryPill label="ELECTRONICS" />
                <CategoryPill label="GARDEN" />
            </div>

            {/* Create button */}
            <button
                onClick={() => onNavigate?.('marketplace-create')}
                className="w-full h-16 bg-green border-[4px] border-black shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-100 font-bold uppercase text-lg"
            >
                + SELL ITEM
            </button>

            {/* Items grid */}
            <div className="grid grid-cols-2 gap-4">
                <MarketItem
                    title="VINTAGE LAMP"
                    price="€45"
                    tag="FURNITURE"
                    color="bg-yellow"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
                <MarketItem
                    title="BIKE REPAIR"
                    price="€20/H"
                    tag="SERVICE"
                    color="bg-cyan"
                    tall
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
                <MarketItem
                    title="PLANTS"
                    price="FREE"
                    tag="GARDEN"
                    color="bg-green"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
                <MarketItem
                    title="COFFEE TABLE"
                    price="€80"
                    tag="FURNITURE"
                    color="bg-magenta"
                    onClick={() => onNavigate?.('marketplace-detail')}
                />
            </div>

        </div>
    );
}

function CategoryPill({ label, active }: any) {
    return (
        <button className={`px-6 py-3 border-[3px] border-black font-bold uppercase text-sm whitespace-nowrap transition-all duration-100 ${active ? 'bg-black text-white shadow-[4px_4px_0_black]' : 'bg-white shadow-[2px_2px_0_black] hover:shadow-[4px_4px_0_black]'}`}>
            {label}
        </button>
    );
}

function MarketItem({ title, price, tag, color, tall, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`bg-white border-[4px] border-black shadow-[6px_6px_0_black] overflow-hidden cursor-pointer hover:shadow-[8px_8px_0_black] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-100 ${tall ? 'row-span-2' : ''}`}
        >
            <div className={`${tall ? 'h-64' : 'h-32'} ${color} border-b-[4px] border-black relative`}>
                <div className="absolute top-3 right-3 bg-black text-white px-3 py-1 border-[2px] border-white">
                    <Tag className="h-4 w-4" />
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-bold uppercase mb-2 leading-tight">{title}</h3>
                <p className="brutal-title text-2xl">{price}</p>
                <p className="brutal-mono text-[10px] uppercase mt-2 opacity-60">{tag}</p>
            </div>
        </div>
    );
}
