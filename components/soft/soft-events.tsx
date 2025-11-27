"use client";

import React from "react";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";

export function SoftEvents({ onNavigate }: { onNavigate?: (view: string) => void }) {
    return (
        <div className="space-y-6 pb-20">

            {/* Create button */}
            <button
                onClick={() => onNavigate?.('event-create')}
                className="w-full h-14 soft-button text-soft-navy font-semibold flex items-center justify-center gap-2"
            >
                <span className="text-xl">+</span>
                Create Event
            </button>

            {/* Featured event */}
            <div
                onClick={() => onNavigate?.('event-detail')}
                className="soft-card gradient-peach p-8 cursor-pointer hover:scale-[1.02] transition-transform duration-200"
            >
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-20 bg-white/90 rounded-[20px] flex flex-col items-center justify-center shadow-button shrink-0">
                        <span className="soft-title text-3xl text-soft-navy">12</span>
                        <span className="text-xs font-semibold text-soft-navy/60">OCT</span>
                    </div>
                    <div className="flex-1">
                        <div className="pill pill-pink inline-flex mb-2">
                            <span className="text-xs">Tomorrow</span>
                        </div>
                        <h2 className="soft-title text-3xl text-soft-navy">Summer BBQ Party</h2>
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    <InfoRow icon={Calendar} text="18:00 - 23:00" />
                    <InfoRow icon={MapPin} text="Rooftop, Block A" />
                    <InfoRow icon={Users} text="45 people going" />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex -space-x-3">
                        {['gradient-mint', 'gradient-lavender', 'gradient-peach'].map((g, i) => (
                            <div key={i} className={`w-10 h-10 ${g} rounded-full border-2 border-white shadow-button`} />
                        ))}
                    </div>
                    <span className="text-sm font-semibold text-soft-navy ml-2">+42 more</span>
                </div>
            </div>

            {/* Event list */}
            <div className="space-y-3">
                <EventCard
                    day="15"
                    month="OCT"
                    title="Community Meeting"
                    time="19:00"
                    location="Main Hall"
                    gradient="gradient-mint"
                    onClick={() => onNavigate?.('event-detail')}
                />
                <EventCard
                    day="22"
                    month="OCT"
                    title="Yoga Workshop"
                    time="09:00"
                    location="Garden"
                    gradient="gradient-lavender"
                    onClick={() => onNavigate?.('event-detail')}
                />
                <EventCard
                    day="31"
                    month="OCT"
                    title="Halloween Night"
                    time="20:00"
                    location="Lobby"
                    gradient="gradient-peach"
                    onClick={() => onNavigate?.('event-detail')}
                />
            </div>

        </div>
    );
}

function InfoRow({ icon: Icon, text }: any) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-soft-navy/60" strokeWidth={2.5} />
            <span className="font-medium text-soft-navy">{text}</span>
        </div>
    );
}

function EventCard({ day, month, title, time, location, gradient, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={`soft-card ${gradient} p-5 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform duration-200`}
        >
            <div className="w-16 h-16 bg-white/90 rounded-[18px] flex flex-col items-center justify-center shadow-button shrink-0">
                <span className="soft-title text-2xl text-soft-navy">{day}</span>
                <span className="text-[10px] font-semibold text-soft-navy/60 uppercase">{month}</span>
            </div>

            <div className="flex-1">
                <h3 className="soft-title text-lg text-soft-navy mb-1">{title}</h3>
                <div className="flex items-center gap-3 text-sm text-soft-navy/60 font-medium">
                    <span>{time}</span>
                    <span>•</span>
                    <span>{location}</span>
                </div>
            </div>

            <ChevronRight className="h-6 w-6 text-soft-navy/30" strokeWidth={2.5} />
        </div>
    );
}
