"use client";

import React, { useState } from "react";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";

export function SoftMarketplaceDetail({ onBack }: { onBack: () => void }) {
    const [currentImage, setCurrentImage] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);

    const gradients = ['gradient-peach', 'gradient-mint', 'gradient-lavender'];

    return (
        <div className="space-y-6 pb-20">

            <button
                onClick={onBack}
                className="flex items-center gap-2 text-soft-navy/60 hover:text-soft-navy font-semibold transition-colors"
            >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                Back
            </button>

            {/* Image carousel */}
            <div className="relative">
                <div className={`h-80 ${gradients[currentImage]} rounded-[40px] shadow-float relative overflow-hidden`}>
                    <button
                        onClick={() => setIsFavorited(!isFavorited)}
                        className={`absolute top-4 right-4 w-14 h-14 rounded-full backdrop-blur-sm shadow-button hover:scale-110 transition-all duration-200 flex items-center justify-center ${isFavorited ? 'bg-soft-pink' : 'bg-white/90'}`}
                    >
                        <Heart className={`h-7 w-7 ${isFavorited ? 'fill-white text-white' : 'text-soft-navy/40'}`} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Image dots */}
                <div className="flex justify-center gap-2 mt-4">
                    {gradients.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentImage(i)}
                            className={`h-2 rounded-full transition-all duration-200 ${i === currentImage ? 'w-8 bg-soft-navy' : 'w-2 bg-soft-navy/20'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Price & Title */}
            <div className="soft-card p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h1 className="soft-title text-3xl text-soft-navy mb-3">Vintage Lamp</h1>
                        <div className="flex gap-2">
                            <span className="pill pill-peach">Furniture</span>
                            <span className="pill pill-green">Like New</span>
                        </div>
                    </div>
                    <p className="soft-title text-4xl text-soft-navy ml-4">€45</p>
                </div>
                <p className="text-soft-navy/70 leading-relaxed font-medium">
                    Beautiful vintage table lamp in excellent condition. Perfect for adding a retro touch to your living room or bedroom.
                </p>
            </div>

            {/* Seller */}
            <div className="soft-card gradient-mint p-6">
                <h3 className="soft-title text-sm text-soft-navy/60 mb-3 uppercase tracking-wide">Seller</h3>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm shadow-button flex items-center justify-center shrink-0">
                        <span className="text-2xl">👤</span>
                    </div>
                    <div>
                        <p className="font-bold text-soft-navy text-lg">Marco Verdi</p>
                        <p className="text-sm text-soft-navy/60 font-medium">Block B, Unit 305</p>
                    </div>
                </div>
            </div>

            {/* Contact button */}
            <button className="w-full h-16 soft-button text-soft-navy font-bold text-lg flex items-center justify-center gap-3">
                <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
                Contact Seller
            </button>

        </div>
    );
}
