"use client";

import React, { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Users, Share2 } from "lucide-react";

export function SoftEventDetail({ onBack }: { onBack: () => void }) {
    const [isRSVPd, setIsRSVPd] = useState(false);

    return (
        <div className="space-y-6 pb-20">

            <button
                onClick={onBack}
                className="flex items-center gap-2 text-soft-navy/60 hover:text-soft-navy font-semibold transition-colors"
            >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                Back
            </button>

            {/* Hero */}
            <div className="h-64 gradient-multi rounded-[40px] shadow-float flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                <h1 className="soft-title text-5xl text-soft-navy relative z-10 text-center px-4">
                    Summer BBQ<br />Party
                </h1>
            </div>

            {/* Info pills */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                <InfoPill icon={Calendar} label="Oct 12" gradient="gradient-mint" />
                <InfoPill icon={Calendar} label="18:00" gradient="gradient-lavender" />
                <InfoPill icon={MapPin} label="Rooftop" gradient="gradient-peach" />
                <InfoPill icon={Users} label="45 Going" gradient="gradient-mint" />
            </div>

            {/* Description */}
            <div className="soft-card p-6">
                <h3 className="soft-title text-lg text-soft-navy mb-3">About</h3>
                <p className="text-soft-navy/70 leading-relaxed font-medium mb-4">
                    Join us for an unforgettable evening under the stars! We're hosting a summer celebration on the rooftop with music, food, and great company.
                </p>
                <div className="space-y-2">
                    <FeatureLine emoji="🎵" text="Live DJ from 19:00" />
                    <FeatureLine emoji="🍕" text="Free pizza & drinks" />
                    <FeatureLine emoji="🎉" text="Games & activities" />
                </div>
            </div>

            {/* Attendees */}
            <div className="soft-card p-6">
                <h3 className="soft-title text-lg text-soft-navy mb-4">Who's Coming</h3>
                <div className="grid grid-cols-8 gap-2">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className={`aspect-square rounded-[14px] ${['gradient-mint', 'gradient-lavender', 'gradient-peach'][i % 3]} shadow-button`}
                        />
                    ))}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => setIsRSVPd(!isRSVPd)}
                    className={`flex-1 h-16 rounded-[999px] font-bold text-lg transition-all duration-200 shadow-float ${isRSVPd
                            ? 'bg-soft-green text-soft-navy'
                            : 'gradient-mint text-soft-navy'
                        } hover:scale-105 active:scale-95`}
                >
                    {isRSVPd ? '✓ Going' : 'RSVP Now'}
                </button>
                <button className="h-16 w-16 rounded-full gradient-lavender shadow-float hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center shrink-0">
                    <Share2 className="h-6 w-6 text-soft-navy" strokeWidth={2.5} />
                </button>
            </div>

        </div>
    );
}

function InfoPill({ icon: Icon, label, gradient }: any) {
    return (
        <div className={`${gradient} rounded-[999px] px-5 py-3 shadow-button flex items-center gap-2 shrink-0`}>
            <Icon className="h-5 w-5 text-soft-navy" strokeWidth={2.5} />
            <span className="font-semibold text-soft-navy whitespace-nowrap">{label}</span>
        </div>
    );
}

function FeatureLine({ emoji, text }: any) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xl">{emoji}</span>
            <span className="font-medium text-soft-navy">{text}</span>
        </div>
    );
}
