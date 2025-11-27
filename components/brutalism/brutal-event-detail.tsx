"use client";

import React, { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Users, Share2 } from "lucide-react";

export function BrutalEventDetail({ onBack }: { onBack: () => void }) {
    const [isRSVPd, setIsRSVPd] = useState(false);

    return (
        <div className="space-y-6 pb-20">

            <button
                onClick={onBack}
                className="flex items-center gap-2 font-bold uppercase hover:translate-x-[-4px] transition-all duration-100"
            >
                <ArrowLeft className="h-6 w-6" strokeWidth={3} />
                BACK
            </button>

            {/* Hero */}
            <div className="h-64 bg-gradient-to-br from-yellow to-magenta border-[6px] border-black shadow-[12px_12px_0_black] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <h1 className="brutal-title text-6xl uppercase relative z-10 text-center px-4">
                    SUMMER<br />BBQ PARTY
                </h1>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
                <InfoBox icon={Calendar} label="DATE" value="OCT 12" bg="bg-cyan" />
                <InfoBox icon={Calendar} label="TIME" value="18:00" bg="bg-yellow" />
                <InfoBox icon={MapPin} label="LOCATION" value="ROOFTOP" bg="bg-magenta" />
                <InfoBox icon={Users} label="GOING" value="45" bg="bg-green" />
            </div>

            {/* Description */}
            <div className="bg-white border-[4px] border-black shadow-[6px_6px_0_black] p-6">
                <h3 className="brutal-mono text-xs uppercase tracking-wider font-bold mb-4">ABOUT</h3>
                <p className="font-medium leading-relaxed mb-4">
                    Join us for an unforgettable evening under the stars! We're hosting a summer celebration on the rooftop with music, food, and great company.
                </p>
                <div className="space-y-1 font-bold">
                    <p>🎵 LIVE DJ FROM 19:00</p>
                    <p>🍕 FREE PIZZA & DRINKS</p>
                    <p>🎉 GAMES & ACTIVITIES</p>
                </div>
            </div>

            {/* Attendees */}
            <div className="bg-white border-[4px] border-black shadow-[6px_6px_0_black] p-6">
                <h3 className="brutal-mono text-xs uppercase tracking-wider font-bold mb-4">ATTENDEES</h3>
                <div className="grid grid-cols-8 gap-2">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-square bg-yellow border-[2px] border-black" />
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    onClick={() => setIsRSVPd(!isRSVPd)}
                    className={`flex-1 h-20 ${isRSVPd ? 'bg-green' : 'bg-black text-white'} border-[4px] border-black shadow-[8px_8px_0_black] hover:shadow-[4px_4px_0_black] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-100 brutal-title text-2xl uppercase`}
                >
                    {isRSVPd ? '✓ GOING' : 'RSVP NOW'}
                </button>
                <button className="h-20 w-20 bg-cyan border-[4px] border-black shadow-[8px_8px_0_black] hover:shadow-[4px_4px_0_black] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-100 flex items-center justify-center shrink-0">
                    <Share2 className="h-8 w-8" strokeWidth={3} />
                </button>
            </div>

        </div>
    );
}

function InfoBox({ icon: Icon, label, value, bg }: any) {
    return (
        <div className={`${bg} border-[4px] border-black shadow-[4px_4px_0_black] p-4`}>
            <Icon className="h-6 w-6 mb-2" strokeWidth={3} />
            <p className="brutal-mono text-[10px] uppercase tracking-wider font-bold mb-1">{label}</p>
            <p className="brutal-title text-2xl uppercase">{value}</p>
        </div>
    );
}
