"use client";

import React from "react";
import {
    Sun,
    CloudRain,
    Calendar,
    AlertTriangle,
    Zap,
    MessageSquare,
    ShoppingBag,
    ArrowRight,
    MapPin,
    Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Mock Data
const WEATHER = { temp: 24, condition: "Soleggiato", icon: Sun };
const NEXT_EVENT = { title: "Assemblea Condominiale", time: "Domani, 18:30", location: "Sala Comune" };
const ALERTS = [
    { id: 1, type: "critical", message: "Acqua chiusa in Via Roma per lavori (09:00 - 13:00)" },
];
const RECENT_ACTIVITY = [
    { id: 1, user: "Mario Rossi", action: "ha pubblicato un annuncio", target: "Vendo Bici", time: "2m fa", type: "market" },
    { id: 2, user: "Giulia Bianchi", action: "ha commentato su", target: "Festa d'Estate", time: "15m fa", type: "social" },
    { id: 3, user: "Ammin. Condominio", action: "nuovo avviso", target: "Pulizia Scale", time: "1h fa", type: "admin" },
];

export function SmartDashboard() {
    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto pb-24">

            {/* 1. Header Section with Greeting */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Buongiorno, Francesca! <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Ecco cosa succede a Prato Rinaldo oggi.
                    </p>
                </div>
                <Button variant="outline" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-background" />
                </Button>
            </header>

            {/* 2. Smart Widget Area (Glassmorphism) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Weather & Status Card */}
                <div className="bg-gradient-to-br from-slate-500/10 to-slate-500/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <WEATHER.icon className="h-24 w-24" />
                    </div>
                    <div>
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Meteo</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-4xl font-bold">{WEATHER.temp}°</span>
                            <span className="text-lg text-muted-foreground">{WEATHER.condition}</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" /> Prato Rinaldo
                        </div>
                    </div>
                </div>

                {/* Next Event Card */}
                <div className="bg-card/50 backdrop-blur-sm border rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div>
                        <span className="text-sm font-medium text-primary uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Prossimo Evento
                        </span>
                        <h3 className="text-xl font-semibold mt-2 group-hover:text-primary transition-colors">
                            {NEXT_EVENT.title}
                        </h3>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                        <div>
                            <p className="text-sm font-medium">{NEXT_EVENT.time}</p>
                            <p className="text-xs text-muted-foreground">{NEXT_EVENT.location}</p>
                        </div>
                        <Button size="sm" variant="secondary" className="rounded-full">Dettagli</Button>
                    </div>
                </div>

                {/* Alerts Card (Conditional) */}
                {ALERTS.length > 0 && (
                    <div className="bg-rose-500/5 border-rose-500/20 border rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 bg-rose-500/10 h-24 w-24 rounded-full blur-2xl" />
                        <div>
                            <span className="text-sm font-medium text-rose-600 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Avvisi Urgenti
                            </span>
                            <p className="mt-2 text-sm font-medium text-foreground/90 leading-relaxed">
                                {ALERTS[0].message}
                            </p>
                        </div>
                        <Button size="sm" variant="ghost" className="mt-4 w-fit text-rose-600 hover:text-rose-700 hover:bg-rose-100 p-0 h-auto font-semibold">
                            Vedi tutti <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>

            {/* 3. Quick Actions (The "Smart" Part) */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-slate-700" /> Azioni Rapide
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <QuickActionButton icon={MessageSquare} label="Nuovo Post" color="bg-blue-600" />
                    <QuickActionButton icon={AlertTriangle} label="Segnala Guasto" color="bg-rose-600" />
                    <QuickActionButton icon={ShoppingBag} label="Vendi Oggetto" color="bg-emerald-600" />
                    <QuickActionButton icon={Calendar} label="Prenota Spazio" color="bg-violet-600" />
                </div>
            </div>

            {/* 4. Recent Activity Feed Preview */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Attività Recente</h2>
                    <Button variant="ghost" size="sm" className="text-primary">Vedi tutto</Button>
                </div>

                <div className="space-y-3">
                    {RECENT_ACTIVITY.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4 p-4 rounded-2xl bg-card border hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                                activity.type === 'market' ? 'bg-emerald-500' :
                                    activity.type === 'admin' ? 'bg-rose-500' : 'bg-blue-500'
                            )}>
                                {activity.user.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    <span className="font-bold">{activity.user}</span> {activity.action} <span className="text-primary">{activity.target}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

function QuickActionButton({ icon: Icon, label, color }: { icon: any, label: string, color: string }) {
    return (
        <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-card border hover:border-primary/50 hover:shadow-md transition-all group">
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform", color)}>
                <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
        </button>
    );
}
