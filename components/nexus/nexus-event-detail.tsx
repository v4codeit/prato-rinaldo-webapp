"use client";

import React, { useState } from "react";
import { Calendar, MapPin, Clock, Users, Share2, Download, ArrowLeft, Heart } from "lucide-react";

interface NexusEventDetailProps {
    onBack: () => void;
}

export function NexusEventDetail({ onBack }: NexusEventDetailProps) {
    const [isRSVPd, setIsRSVPd] = useState(false);

    return (
        <div className="space-y-6 pb-20">

            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-[#0ea5e9] transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-bold text-sm">Back to Events</span>
            </button>

            {/* Hero Image */}
            <div className="h-64 rounded-[30px] overflow-hidden relative group">
                <img
                    src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
                    alt="Event"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase">Tomorrow</span>
                        <span className="px-3 py-1 rounded-full bg-[#ec4899] text-white text-xs font-bold uppercase">Social</span>
                    </div>
                    <h1 className="text-3xl font-black text-white leading-tight">Summer Rooftop Party</h1>
                </div>
            </div>

            {/* Event Details */}
            <div className="nexus-glass rounded-[30px] p-6 bg-white/40 space-y-4">
                <DetailRow icon={Calendar} label="Date" value="Tomorrow, Oct 12" />
                <DetailRow icon={Clock} label="Time" value="18:00 - 23:00" />
                <DetailRow icon={MapPin} label="Location" value="Sky Lounge, Block A" />
                <DetailRow icon={Users} label="Attendees" value="45 going" />
            </div>

            {/* Description */}
            <div className="nexus-glass rounded-[30px] p-6 bg-white/40">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">About</h3>
                <p className="text-slate-700 leading-relaxed">
                    Join us for an unforgettable evening under the stars! We're hosting a summer celebration on the rooftop with music, food, and great company. Bring your friends and family for a night of fun.
                </p>
                <p className="text-slate-700 leading-relaxed mt-3">
                    🎵 Live DJ from 19:00<br />
                    🍕 Free pizza and drinks<br />
                    🎉 Games and activities
                </p>
            </div>

            {/* Attendees */}
            <div className="nexus-glass rounded-[30px] p-6 bg-white/40">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Going (45)</h3>
                <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-12 w-12 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                    ))}
                    <div className="h-12 w-12 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                        +37
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7] to-transparent md:relative md:bg-none md:p-0">
                <div className="flex gap-3 max-w-md mx-auto">
                    <button className="flex-1 h-14 rounded-2xl bg-[#0ea5e9] text-white font-bold uppercase tracking-wider shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        onClick={() => setIsRSVPd(!isRSVPd)}
                    >
                        {isRSVPd ? (
                            <>
                                <Heart className="h-5 w-5 fill-current" />
                                GOING
                            </>
                        ) : (
                            <>
                                <Calendar className="h-5 w-5" />
                                RSVP
                            </>
                        )}
                    </button>
                    <button className="h-14 w-14 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center text-slate-500 hover:text-[#0ea5e9] transition-colors">
                        <Share2 className="h-5 w-5" />
                    </button>
                    <button className="h-14 w-14 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center text-slate-500 hover:text-[#0ea5e9] transition-colors">
                        <Download className="h-5 w-5" />
                    </button>
                </div>
            </div>

        </div>
    );
}

function DetailRow({ icon: Icon, label, value }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-[#0ea5e9]" />
            </div>
            <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
}
