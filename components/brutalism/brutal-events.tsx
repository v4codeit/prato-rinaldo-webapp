"use client";

import React from "react";
import { Calendar, MapPin, Users } from "lucide-react";

export function BrutalEvents({ onNavigate }: { onNavigate?: (view: string) => void }) {
    return (
        <div className="space-y-6 pb-20">

            {/* Create button */}
            <button
                onClick={() => onNavigate?.('event-create')}
                className="w-full h-16 bg-magenta border-[4px] border-black shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-100 font-bold uppercase text-lg"
            >
                + CREATE EVENT
            </button>

            {/* Featured event */}
            <div
                onClick={() => onNavigate?.('event-detail')}
                className="bg-yellow border-[6px] border-black shadow-[12px_12px_0_black] p-8 cursor-pointer hover:shadow-[16px_16px_0_black] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all duration-100"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="h-20 w-20 bg-black text-yellow border-[4px] border-black flex flex-col items-center justify-center shrink-0">
                        <span className="brutal-title text-3xl">12</span>
                        <span className="brutal-mono text-xs">OCT</span>
                    </div>
                    <div className="bg-red text-white px-4 py-2 border-[3px] border-black">
                        <span className="brutal-mono text-xs font-bold">TOMORROW</span>
                    </div>
                </div>

                <h2 className="brutal-title text-4xl uppercase mb-4">SUMMER BBQ PARTY</h2>

                <div className="space-y-2 mb-6">
                    <InfoRow icon={Calendar} text="18:00 - 23:00" />
                    <InfoRow icon={MapPin} text="ROOFTOP, BLOCK A" />
                    <InfoRow icon={Users} text="45 GOING" />
                </div>

                <div className="flex gap-3">
                    <div className="h-12 w-12 bg-cyan border-[3px] border-black" />
                    <div className="h-12 w-12 bg-magenta border-[3px] border-black" />
                    <div className="h-12 w-12 bg-green border-[3px] border-black" />
                    <div className="h-12 w-12 bg-white border-[3px] border-black flex items-center justify-center brutal-mono text-xs font-bold">
                        +42
                    </div>
                </div>
            </div>

            {/* Event list */}
            <div className="space-y-4">
                <EventCard
                    day="15"
                    month="OCT"
                    title="COMMUNITY MEETING"
                    time="19:00"
                    location="MAIN HALL"
                    color="bg-cyan"
                    onClick={() => onNavigate?.('event-detail')}
                />
                <EventCard
                    day="22"
                    month="OCT"
                    title="YOGA WORKSHOP"
                    time="09:00"
                    location="GARDEN"
                    color="bg-green"
                    onClick={() => onNavigate?.('event-detail')}
                />
                <EventCard
                    day="31"
                    month="OCT"
                    title="HALLOWEEN NIGHT"
                    time="20:00"
                    location="LOBBY"
                    color="bg-magenta"
                    onClick={() => onNavigate?.('event-detail')}
                />
            </div>

        </div>
    );
}

function InfoRow({ icon: Icon, text }: any) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" strokeWidth={3} />
            <span className="font-bold uppercase text-sm">{text}</span>
        </div>
    );
}

function EventCard({ day, month, title, time, location, color, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`${color} border-[4px] border-black shadow-[6px_6px_0_black] p-6 flex gap-4 cursor-pointer hover:shadow-[8px_8px_0_black] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-100`}
        >
            <div className="h-16 w-16 bg-white border-[3px] border-black flex flex-col items-center justify-center shrink-0">
                <span className="brutal-title text-2xl">{day}</span>
                <span className="brutal-mono text-[10px]">{month}</span>
            </div>

            <div className="flex-1">
                <h3 className="brutal-title text-xl uppercase mb-2">{title}</h3>
                <div className="flex gap-4 text-sm font-bold">
                    <span>{time}</span>
                    <span>•</span>
                    <span>{location}</span>
                </div>
            </div>

            <div className="text-3xl self-center">→</div>
        </div>
    );
}
