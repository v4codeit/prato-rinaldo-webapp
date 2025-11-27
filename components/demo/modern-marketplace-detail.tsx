"use client";

import React from "react";
import { ArrowLeft, Heart, Share2, MessageCircle, Shield, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ModernMarketplaceDetail({ onBack }: { onBack: () => void }) {
    return (
        <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Nav */}
            <div className="mb-6">
                <Button variant="ghost" onClick={onBack} className="pl-0 hover:bg-transparent hover:text-blue-600 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna al mercatino
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 relative group">
                        <img
                            src="https://images.unsplash.com/photo-1485965120184-e224f723d621?q=80&w=2070&auto=format&fit=crop"
                            alt="Product"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4">
                            <Button size="icon" variant="secondary" className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-slate-900 shadow-sm">
                                <Heart className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 cursor-pointer hover:ring-2 ring-blue-500 transition-all">
                                <img
                                    src="https://images.unsplash.com/photo-1485965120184-e224f723d621?q=80&w=2070&auto=format&fit=crop"
                                    alt={`Thumbnail ${i}`}
                                    className="w-full h-full object-cover opacity-70 hover:opacity-100"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 mb-2">Sport</Badge>
                                <h1 className="text-3xl font-bold text-slate-900">Bicicletta Vintage</h1>
                            </div>
                            <div className="text-3xl font-bold text-emerald-600">€120</div>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Vendo bellissima bicicletta stile vintage, restaurata di recente.
                            Cambio Shimano 6 marce, freni nuovi, copertoni appena sostituiti.
                            Ideale per passeggiate in città. Ritiro a mano presso Blocco A.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                        <h3 className="font-bold text-slate-900">Caratteristiche</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Tag className="h-4 w-4" /> Condizioni: <span className="font-semibold text-slate-900">Ottime</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="h-4 w-4" /> Ritiro: <span className="font-semibold text-slate-900">Blocco A</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Shield className="h-4 w-4" /> Garanzia: <span className="font-semibold text-slate-900">Nessuna</span>
                            </div>
                        </div>
                    </div>

                    {/* Seller Card */}
                    <div className="bg-white border rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <Avatar className="w-14 h-14 border-2 border-slate-100">
                                <AvatarImage src="/assets/avatars/1.png" />
                                <AvatarFallback>MR</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold text-slate-900">Mario Rossi</h3>
                                <p className="text-sm text-slate-500">Iscritto da Maggio 2023</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-3 h-3 bg-yellow-400 rounded-full" />
                                    ))}
                                    <span className="text-xs font-bold ml-2 text-slate-600">5.0</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button className="flex-1 h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20">
                                <MessageCircle className="mr-2 h-5 w-5" /> Contatta
                            </Button>
                            <Button variant="outline" className="h-12 w-12 rounded-xl p-0 border-slate-200">
                                <Share2 className="h-5 w-5 text-slate-600" />
                            </Button>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
