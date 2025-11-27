"use client";

import React, { useState } from "react";
import { ArrowLeft, Heart, Share2, MessageCircle, MapPin, Tag, ChevronRight } from "lucide-react";

interface NexusMarketplaceDetailProps {
    onBack: () => void;
}

export function NexusMarketplaceDetail({ onBack }: NexusMarketplaceDetailProps) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [currentImage, setCurrentImage] = useState(0);

    const images = [
        "https://images.unsplash.com/photo-1507473888900-52e1adad5481?q=80&w=1974&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop",
    ];

    return (
        <div className="space-y-6 pb-32">

            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-[#0ea5e9] transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-bold text-sm">Back to Market</span>
            </button>

            {/* Image Carousel */}
            <div className="relative">
                <div className="h-80 rounded-[30px] overflow-hidden relative group">
                    <img
                        src={images[currentImage]}
                        alt="Item"
                        className="h-full w-full object-cover"
                    />
                    <button
                        onClick={() => setIsFavorited(!isFavorited)}
                        className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                        <Heart className={`h-6 w-6 ${isFavorited ? 'fill-[#ec4899] text-[#ec4899]' : 'text-slate-400'}`} />
                    </button>

                    {/* Image Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentImage(i)}
                                className={`h-2 w-2 rounded-full transition-all ${i === currentImage ? 'bg-white w-6' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Price & Title */}
            <div className="nexus-glass rounded-[30px] p-6 bg-white/40">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Vintage Lamp</h1>
                        <div className="flex items-center gap-2 mb-3">
                            <Tag className="h-4 w-4 text-[#0ea5e9]" />
                            <span className="text-sm font-medium text-slate-500">Furniture</span>
                            <span className="px-2 py-1 rounded-full bg-[#bbf7d0] text-[#16a34a] text-xs font-bold uppercase">Like New</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-black text-[#0ea5e9]">€45</p>
                    </div>
                </div>

                <p className="text-slate-700 leading-relaxed">
                    Beautiful vintage table lamp in excellent condition. Perfect for adding a retro touch to your living room or bedroom. Works perfectly, bulb included.
                </p>
            </div>

            {/* Seller Info */}
            <div className="nexus-glass rounded-[30px] p-6 bg-white/40">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Seller</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                        <div>
                            <h4 className="font-bold text-slate-900">Marco Verdi</h4>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="h-3 w-3" />
                                <span>Block B, Unit 305</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400">Member since 2023</p>
                        <p className="text-xs font-bold text-[#16a34a]">15 items sold</p>
                    </div>
                </div>
            </div>

            {/* Similar Items */}
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Similar Items</h3>
                <div className="grid grid-cols-2 gap-3">
                    <SimilarItem
                        image="https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=1974&auto=format&fit=crop"
                        title="Floor Lamp"
                        price="€60"
                    />
                    <SimilarItem
                        image="https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=1974&auto=format&fit=crop"
                        title="Desk Lamp"
                        price="€35"
                    />
                </div>
            </div>

            {/* Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7] to-transparent md:relative md:bg-none md:p-0">
                <button className="w-full max-w-md mx-auto h-14 rounded-2xl bg-[#0ea5e9] text-white font-bold uppercase tracking-wider shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Contact Seller
                </button>
            </div>

        </div>
    );
}

function SimilarItem({ image, title, price }: any) {
    return (
        <div className="nexus-glass p-2 rounded-2xl bg-white/40 hover:bg-white/60 transition-all cursor-pointer">
            <div className="h-32 w-full rounded-xl bg-slate-200 relative overflow-hidden mb-2">
                <img src={image} alt={title} className="h-full w-full object-cover" />
            </div>
            <div className="px-1 pb-1 flex justify-between items-center">
                <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                <span className="font-black text-[#0ea5e9] text-sm">{price}</span>
            </div>
        </div>
    );
}
