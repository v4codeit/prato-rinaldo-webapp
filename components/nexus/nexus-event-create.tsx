"use client";

import React, { useState } from "react";
import { ArrowLeft, Upload, X, Calendar, MapPin, Clock, Type, AlignLeft } from "lucide-react";

interface NexusEventCreateProps {
    onBack: () => void;
}

export function NexusEventCreate({ onBack }: NexusEventCreateProps) {
    const [hasImage, setHasImage] = useState(false);

    return (
        <div className="space-y-6 pb-32">

            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#0ea5e9] transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-bold text-sm">Cancel</span>
                </button>
                <h2 className="text-xl font-black text-slate-900">Create Event</h2>
                <div className="w-20" />
            </div>

            {/* Image Upload */}
            <div className="nexus-glass rounded-[30px] overflow-hidden bg-white/40">
                {hasImage ? (
                    <div className="relative h-48">
                        <img
                            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
                            alt="Preview"
                            className="h-full w-full object-cover"
                        />
                        <button
                            onClick={() => setHasImage(false)}
                            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setHasImage(true)}
                        className="h-48 w-full flex flex-col items-center justify-center gap-3 hover:bg-white/60 transition-colors"
                    >
                        <Upload className="h-12 w-12 text-slate-300" />
                        <span className="text-sm font-bold text-slate-400">Upload Event Image</span>
                    </button>
                )}
            </div>

            {/* Form */}
            <div className="space-y-4">

                <FormField
                    icon={Type}
                    label="Event Title"
                    placeholder="Summer Rooftop Party"
                />

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        icon={Calendar}
                        label="Date"
                        placeholder="Oct 12, 2024"
                        type="date"
                    />
                    <FormField
                        icon={Clock}
                        label="Time"
                        placeholder="18:00"
                        type="time"
                    />
                </div>

                <FormField
                    icon={MapPin}
                    label="Location"
                    placeholder="Sky Lounge, Block A"
                />

                <div className="nexus-glass rounded-[24px] p-4 bg-white/40">
                    <div className="flex items-center gap-2 mb-3">
                        <AlignLeft className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                    </div>
                    <textarea
                        placeholder="Tell everyone about your event..."
                        className="w-full h-32 bg-white/50 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 resize-none"
                    />
                </div>

                <div className="nexus-glass rounded-[24px] p-4 bg-white/40">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-3">Category</span>
                    <div className="flex flex-wrap gap-2">
                        <CategoryPill label="Social" active />
                        <CategoryPill label="Meeting" />
                        <CategoryPill label="Workshop" />
                        <CategoryPill label="Sports" />
                    </div>
                </div>

            </div>

            {/* Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7] to-transparent md:relative md:bg-none md:p-0">
                <button className="w-full max-w-md mx-auto h-14 rounded-2xl bg-[#0ea5e9] text-white font-bold uppercase tracking-wider shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    Create Event
                </button>
            </div>

        </div>
    );
}

function FormField({ icon: Icon, label, placeholder, type = "text" }: any) {
    return (
        <div className="nexus-glass rounded-[24px] p-4 bg-white/40">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
            </div>
            <input
                type={type}
                placeholder={placeholder}
                className="w-full h-12 bg-white/50 rounded-xl px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50"
            />
        </div>
    );
}

function CategoryPill({ label, active }: any) {
    return (
        <button className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${active ? 'bg-[#0ea5e9] text-white shadow-lg shadow-sky-200' : 'bg-white/50 text-slate-500 hover:bg-white/70'}`}>
            {label}
        </button>
    );
}
