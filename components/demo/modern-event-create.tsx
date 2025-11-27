"use client";

import React from "react";
import { ArrowLeft, Upload, Calendar, Clock, MapPin, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ModernEventCreate({ onBack }: { onBack: () => void }) {
    return (
        <div className="max-w-2xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-slate-100">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold text-slate-900">Nuovo Evento</h1>
            </div>

            <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm space-y-8">

                {/* Image Upload */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-700">Carica immagine copertina</h3>
                    <p className="text-sm text-slate-400 mt-1">PNG, JPG fino a 5MB</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Titolo Evento</Label>
                        <div className="relative">
                            <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input placeholder="Es. Festa di Primavera" className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select>
                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Seleziona categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="social">Sociale</SelectItem>
                                <SelectItem value="meeting">Assemblea</SelectItem>
                                <SelectItem value="maintenance">Manutenzione</SelectItem>
                                <SelectItem value="other">Altro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input type="date" className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Orario</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input type="time" className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Luogo</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input placeholder="Es. Sala Comune" className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrizione</Label>
                        <Textarea
                            placeholder="Descrivi i dettagli dell'evento..."
                            className="min-h-[120px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all p-4 resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-xl border-slate-200">Annulla</Button>
                    <Button className="flex-1 h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                        Pubblica Evento
                    </Button>
                </div>

            </div>
        </div>
    );
}
