"use client";

import React from "react";
import { Calendar, MapPin, Clock, Users, ChevronRight } from "lucide-react";

export function NexusEvents({ onNavigate }: { onNavigate?: (view: string) => void }) {
    return (
        <div className="space-y-6 pb-20">

            {/* Header */}
            <div className="flex justify-between items-end px-2">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Upcoming</h2>
                    <p className="text-sm text-slate-500">Don't miss out on community fun</p>
                </div>
                <button
                    onClick={() => onNavigate?.('event-create')}
                    className="text-xs font-bold text-[#0ea5e9] uppercase tracking-wider hover:underline"
                >
                    + New Event
                </button>
            </div>

            {/* Featured Event (Large) */}
            <div
                onClick={() => onNavigate?.('event-detail')}
                className="nexus-glass rounded-[30px] overflow-hidden group cursor-pointer bg-white/40 hover:bg-white/60 transition-colors"
            >
                <div className="h-48 bg-slate-200 relative overflow-hidden">
                    <img
                        src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
                        alt="Event"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                        TOMORROW
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-black text-slate-900 leading-tight">Summer Rooftop Party</h3>
                        <div className="h-8 w-8 rounded-full bg-[#ec4899] flex items-center justify-center text-white shadow-lg shadow-pink-200">
                            <ChevronRight className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="h-4 w-4 text-[#0ea5e9]" />
                            <span>18:00 - 23:00</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 text-[#0ea5e9]" />
                            <span>Sky Lounge, Block A</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white" />
                            ))}
                            <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                                +42
                            </div>
                        </div>
                        <button className="px-4 py-2 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] text-xs font-bold uppercase tracking-wider hover:bg-[#0ea5e9] hover:text-white transition-colors">
                            RSVP
                        </button>
                    </div>
                </div>
            </div>

            {/* Event List */}
            <div className="space-y-3">
                <EventRow
                    day="15"
                    month="OCT"
                    title="Community Meeting"
                    time="19:00"
                    location="Main Hall"
                    onClick={() => onNavigate?.('event-detail')}
                />
                <EventRow
                    day="22"
                    month="OCT"
                    title="Yoga Workshop"
                    time="09:00"
                    location="Garden"
                    onClick={() => onNavigate?.('event-detail')}
                />
                <EventRow
                    day="31"
                    month="OCT"
                    title="Halloween Night"
                    time="20:00"
                    location="Lobby"
                    onClick={() => onNavigate?.('event-detail')}
                />
            </div>

        </div>
    );
}

function EventRow({ day, month, title, time, location, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className="nexus-glass p-4 rounded-2xl flex items-center gap-4 hover:bg-white/60 transition-colors cursor-pointer bg-white/40"
        >
            <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-white shadow-sm border border-slate-100">
                <span className="text-xl font-black text-slate-900 leading-none">{day}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{month}</span>
            </div>

            <div className="flex-1">
                <h4 className="font-bold text-slate-900">{title}</h4>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {time}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {location}
                    </span>
                </div>
            </div>

            <ChevronRight className="h-5 w-5 text-slate-300" />
        </div>
    );
}
