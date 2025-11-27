"use client";

import React from "react";
import { Search, Tag, Heart } from "lucide-react";

export const PopMarketplace = () => {
    const items = [
        { id: 1, title: "Vintage Lamp", price: "€45", category: "Furniture", color: "bg-[#FFD88D]" },
        { id: 2, title: "Kids Bike", price: "€80", category: "Sports", color: "bg-[#B8E6E1]" },
        { id: 3, title: "Plant Pot", price: "€15", category: "Garden", color: "bg-[#FFB7B2]" },
        { id: 4, title: "Bookshelf", price: "€30", category: "Furniture", color: "bg-[#D4C5F9]" },
    ];

    return (
        <div className="p-6 pt-12 pb-24 space-y-6 bg-[#FAFAFA] min-h-full">

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black">Marketplace</h1>
                <div className="bg-[#B8E6E1] border-2 border-black px-3 py-1 rounded-full font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    12 New
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} />
                <input
                    className="w-full bg-white border-2 border-black rounded-full py-3 pl-12 pr-4 font-bold placeholder:text-gray-400 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none"
                    placeholder="Search items..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {items.map((item) => (
                    <div key={item.id} className="bg-white border-2 border-black rounded-[20px] p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col">

                        {/* Image Placeholder */}
                        <div className={`w-full aspect-square ${item.color} rounded-xl border-2 border-black mb-3 relative`}>
                            <button className="absolute top-2 right-2 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-50 transition-colors">
                                <Heart size={14} />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 border border-gray-200 rounded px-1">{item.category}</span>
                            </div>
                            <h3 className="font-black text-sm leading-tight mb-2 flex-1">{item.title}</h3>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="font-black text-lg">{item.price}</span>
                                <button className="bg-black text-white p-1.5 rounded-lg">
                                    <Tag size={14} />
                                </button>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
};
