"use client";

import React from "react";

interface BrutalLandingProps {
    onEnter: () => void;
}

export function BrutalLanding({ onEnter }: BrutalLandingProps) {
    return (
        <div className="min-h-[600px] flex flex-col items-center justify-center relative">

            {/* Background geometric elements */}
            <div className="absolute top-10 left-0 h-32 w-32 bg-cyan border-[4px] border-black transform -rotate-12 -z-10" />
            <div className="absolute bottom-20 right-0 h-40 w-40 bg-magenta border-[4px] border-black transform rotate-6 -z-10" />

            {/* Main content */}
            <div className="text-center space-y-8 relative">

                {/* Title */}
                <div className="space-y-4">
                    <div className="inline-block bg-yellow border-[6px] border-black shadow-[16px_16px_0_black] p-6">
                        <h1 className="brutal-title text-6xl md:text-7xl uppercase">
                            NEXUS
                        </h1>
                    </div>
                    <p className="brutal-mono text-sm uppercase tracking-widest">
                        BRUTALISM EDITION
                    </p>
                </div>

                {/* Tagline */}
                <div className="max-w-md mx-auto">
                    <p className="font-bold text-xl leading-tight">
                        YOUR COMMUNITY.<br />
                        NO COMPROMISES.<br />
                        PURE FUNCTION.
                    </p>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onEnter}
                    className="group relative h-20 w-full max-w-sm bg-black text-white border-[4px] border-black shadow-[12px_12px_0_black] hover:shadow-[6px_6px_0_black] hover:translate-x-[6px] hover:translate-y-[6px] transition-all duration-100"
                >
                    <span className="brutal-title text-2xl uppercase tracking-tight flex items-center justify-center gap-3">
                        ENTER SYSTEM
                        <span className="text-yellow">→</span>
                    </span>
                </button>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-3 justify-center pt-8">
                    <FeatureTag label="24/7" bg="bg-red" />
                    <FeatureTag label="SECURE" bg="bg-green" />
                    <FeatureTag label="FAST" bg="bg-cyan" />
                </div>

            </div>

        </div>
    );
}

function FeatureTag({ label, bg }: { label: string; bg: string }) {
    return (
        <div className={`${bg} border-[3px] border-black px-4 py-2 shadow-[4px_4px_0_black]`}>
            <span className="brutal-mono text-xs font-bold uppercase">{label}</span>
        </div>
    );
}
