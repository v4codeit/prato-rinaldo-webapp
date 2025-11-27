"use client";

import React from "react";
import { ArrowLeft, Calendar, MapPin, Users, Share2, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ModernEventDetail({ onBack }: { onBack: () => void }) {
    return (
        <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Nav */}
            <div className="mb-6">
                <Button variant="ghost" onClick={onBack} className="pl-0 hover:bg-transparent hover:text-blue-600 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna agli eventi
                </Button>
            </div>

            {/* Hero Image */}
            <div className="relative aspect-video w-full rounded-3xl overflow-hidden mb-8 shadow-lg group">
                <img
                    src="https://images.unsplash.com/photo-1530103862676-de3c9da59af7?q=80&w=2000&auto=format&fit=crop"
                    alt="Event Cover"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                    <Button size="icon" variant="secondary" className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-slate-900">
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-rose-500">
                        <Heart className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <Badge className="bg-orange-500 hover:bg-orange-600 border-none mb-3">Sociale</Badge>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Festa di Fine Estate</h1>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Unisciti a noi per celebrare la fine dell'estate con una grande festa in giardino!
                            Ci sarà musica dal vivo, buffet condiviso e giochi per i più piccoli.
                            È un'ottima occasione per conoscere i nuovi vicini e passare del tempo insieme.
                        </p>
                    </div>

                    <div className="bg-white border rounded-3xl p-6 space-y-4">
                        <h3 className="font-bold text-lg">Dettagli</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Data</p>
                                    <p className="font-semibold">22 Ottobre 2024</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Orario</p>
                                    <p className="font-semibold">16:00 - 22:00</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl sm:col-span-2">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Luogo</p>
                                    <p className="font-semibold">Giardino Centrale, Prato Rinaldo</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Partecipanti (85)</h3>
                            <Button variant="link" className="text-blue-600">Vedi tutti</Button>
                        </div>
                        <div className="flex -space-x-3 overflow-hidden py-2">
                            {[...Array(8)].map((_, i) => (
                                <Avatar key={i} className="w-12 h-12 border-4 border-white ring-1 ring-slate-100">
                                    <AvatarImage src={`/assets/avatars/${(i % 5) + 1}.png`} />
                                    <AvatarFallback>U{i}</AvatarFallback>
                                </Avatar>
                            ))}
                            <div className="w-12 h-12 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-xs font-bold text-slate-500 ring-1 ring-slate-100">
                                +77
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Actions */}
                <div className="space-y-6">
                    <div className="bg-white border rounded-3xl p-6 shadow-lg shadow-slate-200/50 sticky top-24">
                        <h3 className="font-bold text-lg mb-2">Partecipa all'evento</h3>
                        <p className="text-slate-500 text-sm mb-6">Conferma la tua presenza per aiutarci ad organizzare al meglio.</p>

                        <Button className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 mb-3 shadow-lg shadow-slate-900/20">
                            Parteciperò
                        </Button>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200">
                            Forse
                        </Button>

                        <div className="mt-6 pt-6 border-t text-center">
                            <p className="text-xs text-slate-400 mb-2">Organizzato da</p>
                            <div className="flex items-center justify-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src="/assets/avatars/2.png" />
                                    <AvatarFallback>MV</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm">Marco Verdi</span>
                                <Badge variant="secondary" className="text-[10px]">Admin</Badge>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
