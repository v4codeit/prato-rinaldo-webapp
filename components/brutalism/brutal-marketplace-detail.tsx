"use client";

import React, { useState } from "react";
import { ArrowLeft, Heart, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

export function BrutalMarketplaceDetail({ onBack }: { onBack: () => void }) {
    const [currentImage, setCurrentImage] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);

    const images = ['bg-yellow', 'bg-cyan', 'bg-magenta'];

    return (
        <div className="space-y-6 pb-20">

            <button
                onClick={onBack}
                className="flex items-center gap-2 font-bold uppercase hover:translate-x-[-4px] transition-all duration-100"
            >
                <ArrowLeft className="h-6 w-6" strokeWidth={3} />
                BACK
            </button>

            {/* Image carousel */}
            <div className="relative">
                <div className={`h-80 ${images[currentImage]} border-[6px] border-black shadow-[12px_12px_0_black]`} />

                <button
                    onClick={() => setCurrentImage((currentImage - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-16 w-16 bg-white border-[4px] border-black shadow-[4px_4px_0_black] hover:shadow-[6px_6px_0_black] transition-all duration-100 flex items-center justify-center"
                >
                    <ChevronLeft className="h-8 w-8" strokeWidth={4} />
                </button>

                <button
                    onClick={() => setCurrentImage((currentImage + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-16 w-16 bg-white border-[4px] border-black shadow-[4px_4px_0_black] hover:shadow-[6px_6px_0_black] transition-all duration-100 flex items-center justify-center"
                >
                    <ChevronRight className="h-8 w-8" strokeWidth={4} />
                </button>

                <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`absolute top-4 right-4 h-16 w-16 ${isFavorited ? 'bg-red' : 'bg-white'} border-[4px] border-black shadow-[4px_4px_0_black] hover:shadow-[6px_6px_0_black] transition-all duration-100 flex items-center justify-center`}
                >
                    <Heart className={`h-8 w-8 ${isFavorited ? 'fill-white text-white' : ''}`} strokeWidth={3} />
                </button>
            </div>

            {/* Price & Title */}
            <div className="bg-white border-[4px] border-black shadow-[6px_6px_0_black] p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="brutal-title text-4xl uppercase mb-2">VINTAGE LAMP</h1>
                        <div className="flex gap-2">
                            <span className="bg-yellow px-3 py-1 border-[2px] border-black brutal-mono text-xs font-bold">FURNITURE</span>
                            <span className="bg-green px-3 py-1 border-[2px] border-black brutal-mono text-xs font-bold">LIKE NEW</span>
                        </div>
                    </div>
                    <p className="brutal-title text-5xl">€45</p>
                </div>
                <p className="font-medium leading-relaxed">
                    Beautiful vintage table lamp in excellent condition. Perfect for adding a retro touch to your living room or bedroom. Works perfectly, bulb included.
                </p>
            </div>

            {/* Seller */}
            <div className="bg-cyan border-[4px] border-black shadow-[6px_6px_0_black] p-6">
                <h3 className="brutal-mono text-xs uppercase tracking-wider font-bold mb-4">SELLER</h3>
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-black text-white border-[3px] border-black flex items-center justify-center brutal-title text-2xl shrink-0">
                        M
                    </div>
                    <div>
                        <p className="font-bold uppercase">MARCO VERDI</p>
                        <p className="brutal-mono text-xs">BLOCK B, UNIT 305</p>
                    </div>
                </div>
            </div>

            {/* Contact button */}
            <button className="w-full h-20 bg-black text-white border-[4px] border-black shadow-[8px_8px_0_black] hover:shadow-[4px_4px_0_black] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-100 brutal-title text-2xl uppercase flex items-center justify-center gap-3">
                <MessageCircle className="h-8 w-8" strokeWidth={3} />
                CONTACT SELLER
            </button>

        </div>
    );
}
