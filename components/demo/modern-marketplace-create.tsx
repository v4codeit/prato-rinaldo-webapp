"use client";

import React from "react";
import { ArrowLeft, Upload, Tag, Euro, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ModernMarketplaceCreate({ onBack }: { onBack: () => void }) {
    return (
        <div className="max-w-2xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-slate-100">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold text-slate-900">Vendi Oggetto</h1>
            </div>

            <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm space-y-8">

                {/* Image Upload */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-2 aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group bg-slate-50/50">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="font-bold text-sm text-slate-600">Aggiungi Foto</span>
                    </div>
                    {[1, 2].map((i) => (
                        <div key={i} className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                            <ImageIcon className="h-6 w-6 text-slate-300" />
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Titolo Annuncio</Label>
                        <Input placeholder="Es. Divano 3 posti IKEA" className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Prezzo (€)</Label>
                            <div className="relative">
                                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input type="number" placeholder="0.00" className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Seleziona" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="furniture">Arredamento</SelectItem>
                                    <SelectItem value="electronics">Elettronica</SelectItem>
                                    <SelectItem value="sports">Sport</SelectItem>
                                    <SelectItem value="clothing">Abbigliamento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrizione</Label>
                        <Textarea
                            placeholder="Descrivi le condizioni, le dimensioni e altri dettagli..."
                            className="min-h-[120px] rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all p-4 resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-xl border-slate-200">Annulla</Button>
                    <Button className="flex-1 h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                        Pubblica Annuncio
                    </Button>
                </div>

            </div>
        </div>
    );
}
