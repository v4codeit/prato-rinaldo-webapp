"use client";

import React from "react";
import { Calendar, MapPin, Users, Clock, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const EVENTS = [
    {
        id: 1,
        title: "Assemblea Condominiale Annuale",
        date: "15 Ottobre",
        time: "18:30 - 20:30",
        location: "Sala Comune, Blocco A",
        attendees: 42,
        category: "Amministrazione",
        color: "bg-blue-500",
        image: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?q=80&w=1973&auto=format&fit=crop"
    },
    {
        id: 2,
        title: "Festa di Fine Estate",
        date: "22 Ottobre",
        time: "16:00 - 22:00",
        location: "Giardino Centrale",
        attendees: 85,
        category: "Sociale",
        color: "bg-orange-500",
        image: "https://images.unsplash.com/photo-1530103862676-de3c9da59af7?q=80&w=2000&auto=format&fit=crop"
    },
    {
        id: 3,
        title: "Corso di Yoga all'Aperto",
        date: "Ogni Sabato",
        time: "09:00 - 10:30",
        location: "Parco Giochi",
        attendees: 12,
        category: "Benessere",
        color: "bg-emerald-500",
        image: "https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=2070&auto=format&fit=crop"
    }
];

interface ModernEventsProps {
    onNavigate?: (view: string) => void;
}

export function ModernEvents({ onNavigate }: ModernEventsProps) {
    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Eventi</h1>
                    <p className="text-slate-500">Scopri cosa succede nel quartiere</p>
                </div>
                <Button
                    onClick={() => onNavigate?.("event-create")}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                >
                    <Plus className="h-4 w-4 mr-2" /> Crea Evento
                </Button>
            </div>

            {/* Featured Event */}
            <div
                className="relative h-64 rounded-3xl overflow-hidden shadow-xl cursor-pointer group"
                onClick={() => onNavigate?.("event-detail")}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <img
                    src={EVENTS[1].image}
                    alt="Featured"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white z-20">
                    <Badge className="bg-orange-500 hover:bg-orange-600 mb-3 border-none">In Evidenza</Badge>
                    <h3 className="text-2xl md:text-4xl font-bold mb-2">{EVENTS[1].title}</h3>
                    <div className="flex items-center gap-4 text-white/80 text-sm md:text-base">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {EVENTS[1].date}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {EVENTS[1].location}</span>
                    </div>
                </div>
            </div>

            {/* Calendar Strip (Mock) */}
            <div className="flex gap-3 overflow-x-auto pb-2 demo-no-scrollbar">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${i === 2 ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white text-slate-500 hover:border-slate-300'}`}>
                        <span className="text-xs font-medium uppercase">{['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][i]}</span>
                        <span className="text-xl font-bold mt-1">{13 + i}</span>
                    </div>
                ))}
            </div>

            {/* Events List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EVENTS.map((event) => (
                    <div
                        key={event.id}
                        className="bg-white border rounded-3xl p-4 flex gap-4 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => onNavigate?.("event-detail")}
                    >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex justify-between items-start">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-600">{event.category}</Badge>
                                <span className="text-xs font-bold text-slate-400">{event.time}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 mt-1 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{event.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-auto">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {event.attendees}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-center w-8 text-slate-300 group-hover:text-slate-900 transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
