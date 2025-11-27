"use client";

import React from "react";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";

export const PopEvents = () => {
    const events = [
        {
            id: 1,
            title: "Summer BBQ Party",
            date: "15",
            month: "AUG",
            time: "18:00",
            location: "Central Park Area",
            attendees: 42,
            color: "bg-[#FFB7B2]"
        },
        {
            id: 2,
            title: "HOA Monthly Meeting",
            date: "22",
            month: "AUG",
            time: "19:30",
            location: "Community Hall",
            attendees: 15,
            color: "bg-[#A0C4FF]"
        },
        {
            id: 3,
            title: "Yoga in the Park",
            date: "25",
            month: "AUG",
            time: "08:00",
            location: "Green Zone",
            attendees: 12,
            color: "bg-[#B8E6E1]"
        }
    ];

    return (
        <div className="p-6 pt-12 pb-24 space-y-6 bg-[#FAFAFA] min-h-full">

            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-3xl font-black">Upcoming Events</h1>
                    <p className="font-bold text-gray-400">Don't miss out!</p>
                </div>
                <button className="bg-black text-white px-4 py-2 rounded-full font-bold text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    + Create
                </button>
            </div>

            <div className="space-y-4">
                {events.map((event) => (
                    <div key={event.id} className="bg-white border-2 border-black rounded-[20px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-4 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group">

                        {/* Date Badge */}
                        <div className={`flex flex-col items-center justify-center w-16 h-20 ${event.color} border-2 border-black rounded-xl flex-shrink-0`}>
                            <span className="text-xs font-black uppercase">{event.month}</span>
                            <span className="text-2xl font-black">{event.date}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="font-black text-lg leading-tight mb-1">{event.title}</h3>
                            <div className="flex items-center gap-1 text-gray-500 text-xs font-bold mb-2">
                                <MapPin size={12} />
                                {event.location}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
                                    <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
                                    <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white" />
                                </div>
                                <span className="text-xs font-bold text-gray-400">+{event.attendees} going</span>
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center text-gray-300 group-hover:text-black transition-colors">
                            <ChevronRight size={24} />
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
};
