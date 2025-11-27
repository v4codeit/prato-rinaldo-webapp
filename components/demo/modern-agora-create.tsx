"use client";

import React from "react";
import { ArrowLeft, Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ModernAgoraCreate({ onBack }: { onBack: () => void }) {
    return (
        <div className="max-w-2xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-slate-100">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold text-slate-900">Nuova Votazione</h1>
            </div>

            <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm space-y-8">

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Domanda / Titolo</Label>
                        <Input placeholder="Es. Approvazione bilancio 2024" className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                    </div>

                    <div className="space-y-2">
                        <Label>Descrizione</Label>
                        <Textarea
                            placeholder="Spiega i dettagli della proposta..."
                            className="min-h-[120px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all p-4 resize-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Opzioni di Voto</Label>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input value="Favorevole" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
                                <Button size="icon" variant="ghost" className="h-12 w-12 text-slate-400 hover:text-red-500">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Input value="Contrario" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
                                <Button size="icon" variant="ghost" className="h-12 w-12 text-slate-400 hover:text-red-500">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                            <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50">
                                <Plus className="mr-2 h-4 w-4" /> Aggiungi Opzione
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Durata</Label>
                            <Select>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Seleziona" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="24h">24 Ore</SelectItem>
                                    <SelectItem value="48h">48 Ore</SelectItem>
                                    <SelectItem value="1w">1 Settimana</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Scadenza</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input type="date" className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                        <span className="font-bold">Nota:</span> Una volta pubblicata, la votazione non potrà essere modificata.
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-xl border-slate-200">Annulla</Button>
                    <Button className="flex-1 h-12 rounded-xl bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/20">
                        Avvia Votazione
                    </Button>
                </div>

            </div>
        </div>
    );
}
