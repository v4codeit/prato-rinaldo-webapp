"use client";

import React from "react";

interface SoftLandingProps {
    onEnter: () => void;
}

export function SoftLanding({ onEnter }: SoftLandingProps) {
    return (
        <div className="min-h-[600px] flex flex-col items-center justify-center relative py-12">

            {/* Floating decorative elements */}
            <div className="absolute top-20 left-8 w-20 h-20 rounded-full gradient-peach opacity-40 soft-float" style={{ animationDelay: '0s' }} />
            <div className="absolute top-40 right-12 w-16 h-16 rounded-full gradient-lavender opacity-40 soft-float" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-32 left-16 w-12 h-12 rounded-full gradient-mint opacity-40 soft-float" style={{ animationDelay: '2s' }} />

            {/* Main content */}
            <div className="text-center space-y-8 relative z-10">

                {/* Logo/Icon */}
                <div className="mb-6">
                    <div className="w-32 h-32 mx-auto rounded-[40px] gradient-multi shadow-float flex items-center justify-center text-6xl">
                        🏡
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="soft-title text-6xl text-soft-navy">
                        Nexus
                    </h1>
                    <p className="text-xl text-soft-navy/70 font-medium">
                        Your Modern Community
                    </p>
                </div>

                {/* Description */}
                <div className="max-w-sm mx-auto">
                    <p className="text-soft-navy/60 leading-relaxed font-medium">
                        Connect with neighbors, discover events, and make your community feel like home.
                    </p>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onEnter}
                    className="group w-full max-w-xs h-16 soft-button text-lg font-semibold text-soft-navy flex items-center justify-center gap-3 mx-auto"
                >
                    Get Started
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                </button>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-3 justify-center pt-6">
                    <div className="pill pill-mint">⚡ Real-time</div>
                    <div className="pill pill-lavender">🔒 Secure</div>
                    <div className="pill pill-peach">🎉 Fun</div>
                </div>

            </div>

        </div>
    );
}
