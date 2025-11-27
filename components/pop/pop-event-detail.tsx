"use client";

import React from "react";
import { ArrowLeft, Calendar, Clock, MapPin, Share2, Users } from "lucide-react";

export const PopEventDetail = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="min-h-full bg-[#FFB7B2] p-6 pb-24 relative">

            {/* Back Button */}
            <button
                onClick={onBack}
                className="absolute top-6 left-6 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all z-10"
            >
                <ArrowLeft size={20} />
            </button>

            {/* Hero Image Placeholder */}
            <div className="w-full aspect-video bg-white border-2 border-black rounded-[24px] mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative overflow-hidden mt-12">
                <div className="absolute inset-0 bg-black/10" />
                <Calendar size={48} className="text-black/20" />
                <div className="absolute bottom-4 right-4 bg-[#FFD88D] border-2 border-black px-3 py-1 rounded-full font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    COMMUNITY
                </div>
            </div>

            {/* Title & Info */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black leading-tight">Summer BBQ Party</h1>

                <div className="flex gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Calendar size={16} />
                        <span className="font-bold text-sm">Aug 15</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Clock size={16} />
                        <span className="font-bold text-sm">18:00</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <MapPin size={16} />
                        <span className="font-bold text-sm">Central Park</span>
                    </div>
                </div>

                <div className="bg-white border-2 border-black rounded-[20px] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-lg mb-2">About Event</h3>
                    <p className="font-medium text-gray-600 leading-relaxed">
                        Join us for the annual summer BBQ! There will be food, drinks, and games for everyone. Bring your family and friends! 🍔🌭
                    </p>
                </div>

                {/* Attendees */}
                <div className="bg-[#B8E6E1] border-2 border-black rounded-[20px] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-lg">Who's Going?</h3>
                        <span className="bg-black text-white px-2 py-0.5 rounded-full text-xs font-bold">42</span>
                    </div>
                    <div className="flex -space-x-3 overflow-hidden py-2">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center font-black text-xs">
                                U{i}
                            </div>
                        ))}
                        <div className="w-10 h-10 rounded-full border-2 border-black bg-[#FFD88D] flex items-center justify-center font-black text-xs">
                            +36
                        </div>
                    </div>
                </div>

            </div>

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t-2 border-black flex gap-4 z-20">
                <button className="flex-1 bg-black text-white border-2 border-black rounded-xl py-3 font-bold text-lg shadow-[4px_4px_0px_0px_#FFD88D] active:translate-y-1 active:shadow-none transition-all">
                    Join Event
                </button>
                <button className="w-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
                    <Share2 size={24} />
                </button>
            </div>

        </div>
    );
};
