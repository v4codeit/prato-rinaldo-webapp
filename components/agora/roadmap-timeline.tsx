'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ROADMAP_STEPS = [
    {
        id: 1,
        title: 'Raccolta Idee',
        description: 'Proposte aperte',
        status: 'completed',
        date: 'Gennaio'
    },
    {
        id: 2,
        title: 'Valutazione',
        description: 'Analisi tecnica',
        status: 'current',
        date: 'Febbraio'
    },
    {
        id: 3,
        title: 'Votazione',
        description: 'Scelta finale',
        status: 'upcoming',
        date: 'Marzo'
    },
    {
        id: 4,
        title: 'Esecuzione',
        description: 'Realizzazione',
        status: 'upcoming',
        date: 'Q2 2024'
    }
];

export function RoadmapTimeline() {
    return (
        <div className="w-full bg-white/50 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-white/20 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 px-2">Roadmap Trimestrale</h3>
            <div className="relative flex justify-between items-center px-4">
                {/* Progress Line Background */}
                <div className="absolute left-4 right-4 top-4 h-1 bg-slate-200 rounded-full -z-10" />

                {/* Progress Line Active (Mocked for now) */}
                <div className="absolute left-4 w-1/3 top-4 h-1 bg-teal-500 rounded-full -z-10" />

                {ROADMAP_STEPS.map((step) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-3">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                                    isCompleted ? "bg-teal-500 border-teal-500 text-white" :
                                        isCurrent ? "bg-white border-teal-500 text-teal-600 shadow-lg scale-110" :
                                            "bg-white border-slate-200 text-slate-300"
                                )}
                            >
                                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> :
                                    isCurrent ? <Clock className="h-4 w-4 animate-pulse" /> :
                                        <Circle className="h-4 w-4" />}
                            </div>
                            <div className="text-center">
                                <p className={cn("text-sm font-bold", isCurrent ? "text-teal-700" : "text-slate-700")}>
                                    {step.title}
                                </p>
                                <p className="text-xs text-slate-500 hidden sm:block">{step.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
