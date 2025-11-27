"use client";

import React from "react";
import { ArrowLeft, Clock, CheckCircle2, MessageSquare, ThumbsUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ModernAgoraDetail({ onBack }: { onBack: () => void }) {
    return (
        <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Nav */}
            <div className="mb-6">
                <Button variant="ghost" onClick={onBack} className="pl-0 hover:bg-transparent hover:text-blue-600 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Torna alle votazioni
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">

                    {/* Poll Card */}
                    <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-3 py-1">Attiva</Badge>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                <Clock className="h-4 w-4" /> Termina tra 2 giorni
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Ristrutturazione Facciata Blocco B</h1>
                        <p className="text-slate-600 leading-relaxed mb-8">
                            Si richiede l'approvazione del preventivo per i lavori di rifacimento della facciata esterna del Blocco B,
                            come discusso nell'ultima assemblea. I lavori includono la tinteggiatura e la riparazione dei balconi.
                        </p>

                        <div className="space-y-6">
                            <OptionItem label="Approva Preventivo A (€120k)" percentage={65} selected />
                            <OptionItem label="Approva Preventivo B (€105k)" percentage={25} />
                            <OptionItem label="Rimanda decisione" percentage={10} />
                        </div>

                        <div className="mt-8 pt-6 border-t flex justify-between items-center text-sm text-slate-500">
                            <span>45 Voti totali</span>
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Il tuo voto è stato registrato
                            </span>
                        </div>
                    </div>

                    {/* Discussion */}
                    <div className="bg-slate-50 rounded-3xl p-6 md:p-8">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" /> Discussione (12)
                        </h3>

                        <div className="space-y-6">
                            <Comment
                                user="Mario Rossi"
                                time="2 ore fa"
                                content="Il preventivo A mi sembra più completo, include anche i ponteggi di sicurezza."
                                likes={4}
                            />
                            <Comment
                                user="Giulia Bianchi"
                                time="4 ore fa"
                                content="Sono d'accordo, meglio spendere qualcosa in più ma fare un lavoro definitivo."
                                likes={2}
                            />
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src="/assets/avatars/me.png" />
                                <AvatarFallback>ME</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 relative">
                                <input
                                    className="w-full h-12 rounded-2xl border-slate-200 pl-4 pr-12 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Scrivi un commento..."
                                />
                                <button className="absolute right-2 top-2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                                    <ArrowLeft className="h-4 w-4 rotate-180" />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white border rounded-3xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-4">Documenti Allegati</h3>
                        <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start h-auto py-3 rounded-xl border-slate-200 hover:bg-slate-50">
                                <div className="bg-red-50 text-red-500 p-2 rounded-lg mr-3">
                                    <span className="text-xs font-bold">PDF</span>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-900 text-sm">Preventivo A.pdf</div>
                                    <div className="text-xs text-slate-400">2.4 MB</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-auto py-3 rounded-xl border-slate-200 hover:bg-slate-50">
                                <div className="bg-red-50 text-red-500 p-2 rounded-lg mr-3">
                                    <span className="text-xs font-bold">PDF</span>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-900 text-sm">Preventivo B.pdf</div>
                                    <div className="text-xs text-slate-400">1.8 MB</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}

function OptionItem({ label, percentage, selected }: { label: string, percentage: number, selected?: boolean }) {
    return (
        <div className={`p-4 rounded-2xl border transition-all cursor-pointer ${selected ? 'bg-violet-50 border-violet-200 ring-1 ring-violet-200' : 'bg-white border-slate-200 hover:border-violet-200'}`}>
            <div className="flex justify-between text-sm font-medium mb-2">
                <span className={selected ? 'text-violet-700' : 'text-slate-700'}>{label}</span>
                <span className={selected ? 'text-violet-700' : 'text-slate-500'}>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2 bg-slate-100" />
        </div>
    );
}

function Comment({ user, time, content, likes }: { user: string, time: string, content: string, likes: number }) {
    return (
        <div className="flex gap-3">
            <Avatar className="w-10 h-10 border border-white shadow-sm">
                <AvatarFallback>{user.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-sm text-slate-900">{user}</span>
                        <span className="text-xs text-slate-400">{time}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{content}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 ml-2">
                    <button className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                        <ThumbsUp className="h-3 w-3" /> {likes}
                    </button>
                    <button className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
                        Rispondi
                    </button>
                </div>
            </div>
        </div>
    );
}
