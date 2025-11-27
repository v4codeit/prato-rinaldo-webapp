"use client";

import React from "react";
import { Vote, CheckCircle2, Clock, Users, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const POLLS = [
    {
        id: 1,
        question: "Ristrutturazione Facciata Blocco B",
        description: "Approvazione del preventivo per i lavori di rifacimento della facciata esterna del Blocco B.",
        votes: 45,
        timeLeft: "2 giorni",
        status: "active",
        options: [
            { label: "Approva Preventivo A (€120k)", percentage: 65 },
            { label: "Approva Preventivo B (€105k)", percentage: 25 },
            { label: "Rimanda decisione", percentage: 10 }
        ]
    },
    {
        id: 2,
        question: "Nuovi orari apertura piscina",
        description: "Proposta per estendere l'orario di apertura della piscina condominiale fino alle 22:00 nel weekend.",
        votes: 82,
        timeLeft: "5 ore",
        status: "active",
        options: [
            { label: "Favorevole", percentage: 80 },
            { label: "Contrario", percentage: 20 }
        ]
    },
    {
        id: 3,
        question: "Installazione colonnine elettriche",
        description: "Votazione per l'installazione di 4 colonnine di ricarica nel parcheggio ospiti.",
        votes: 120,
        timeLeft: "Terminato",
        status: "closed",
        options: [
            { label: "Favorevole", percentage: 92 },
            { label: "Contrario", percentage: 8 }
        ]
    }
];

interface ModernAgoraProps {
    onNavigate?: (view: string) => void;
}

export function ModernAgora({ onNavigate }: ModernAgoraProps) {
    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Agorà</h1>
                    <p className="text-slate-500">Partecipa alle decisioni della comunità</p>
                </div>
                <Button
                    onClick={() => onNavigate?.("agora-create")}
                    className="rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20"
                >
                    <Plus className="h-4 w-4 mr-2" /> Nuova Proposta
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-violet-500/20">
                    <Vote className="h-8 w-8 mb-4 opacity-80" />
                    <div className="text-3xl font-bold">12</div>
                    <div className="text-sm opacity-80">Votazioni Attive</div>
                </div>
                <div className="bg-white border rounded-3xl p-6 shadow-sm">
                    <CheckCircle2 className="h-8 w-8 mb-4 text-emerald-500" />
                    <div className="text-3xl font-bold text-slate-900">85%</div>
                    <div className="text-sm text-slate-500">Partecipazione Media</div>
                </div>
            </div>

            {/* Polls List */}
            <div className="space-y-4">
                {POLLS.map((poll) => (
                    <div
                        key={poll.id}
                        className="bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => onNavigate?.("agora-detail")}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {poll.status === "active" ? (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">Aperta</Badge>
                                ) : (
                                    <Badge variant="secondary">Terminata</Badge>
                                )}
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {poll.timeLeft}
                                </span>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-900">{poll.votes}</div>
                                <div className="text-xs text-slate-500">Voti</div>
                            </div>
                        </div>

                        <h4 className="text-xl font-bold text-slate-900 mb-2">{poll.question}</h4>
                        <p className="text-slate-600 mb-6 text-sm leading-relaxed">{poll.description}</p>

                        <div className="space-y-4">
                            {poll.options.map((option, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>{option.label}</span>
                                        <span>{option.percentage}%</span>
                                    </div>
                                    <Progress value={option.percentage} className="h-2 bg-slate-100" />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                        U{i}
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                    +42
                                </div>
                            </div>
                            <Button variant="outline" className="rounded-full border-slate-200 hover:bg-slate-50">
                                <MessageSquare className="mr-2 h-4 w-4" /> Discussione
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
