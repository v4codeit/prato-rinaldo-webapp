"use client";

import React from "react";
import { Vote, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";

export function NexusAgora({ onNavigate }: { onNavigate?: (view: string) => void }) {
    return (
        <div className="space-y-6 pb-20">

            {/* Header */}
            <div className="flex justify-between items-end px-2">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Active Polls</h2>
                    <p className="text-sm text-slate-500">Your voice matters</p>
                </div>
                <button
                    onClick={() => onNavigate?.('agora-create')}
                    className="text-xs font-bold text-[#0ea5e9] uppercase tracking-wider hover:underline"
                >
                    + New Poll
                </button>
            </div>

            {/* Active Poll */}
            <div
                onClick={() => onNavigate?.('agora-detail')}
                className="nexus-glass rounded-[30px] p-6 bg-gradient-to-br from-[#8b5cf6]/20 to-[#d946ef]/20 border-none relative overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Vote className="h-5 w-5 text-[#8b5cf6]" />
                        <span className="text-xs font-bold text-[#8b5cf6] uppercase tracking-widest">Active Poll</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-4 leading-tight">New Parking Regulations</h2>
                    <p className="text-sm text-slate-600 mb-6">Should we allocate 5 guest spots for electric vehicle charging only?</p>

                    <div className="space-y-3">
                        <VoteOption label="Yes, approve it" percent={65} color="bg-[#8b5cf6]" />
                        <VoteOption label="No, keep as is" percent={35} color="bg-slate-300" />
                    </div>

                    <div className="mt-6 flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span>Ends in 2 days</span>
                        <span>142 Votes</span>
                    </div>
                </div>
            </div>

            {/* Past Decisions */}
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Recent Decisions</h3>
                <div className="space-y-3">
                    <DecisionItem
                        title="Roof Renovation Budget"
                        status="Approved"
                        date="Oct 10"
                        icon={CheckCircle2}
                        color="text-[#16a34a]"
                    />
                    <DecisionItem
                        title="Night Security Shift"
                        status="Rejected"
                        date="Sep 28"
                        icon={AlertCircle}
                        color="text-[#ef4444]"
                    />
                </div>
            </div>

        </div>
    );
}

function VoteOption({ label, percent, color }: any) {
    return (
        <div className="relative h-12 w-full bg-white/40 rounded-xl overflow-hidden cursor-pointer group hover:bg-white/60 transition-colors border border-white/50">
            <div
                className={`absolute top-0 left-0 h-full ${color} opacity-20 transition-all duration-1000`}
                style={{ width: `${percent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-4">
                <span className="font-bold text-slate-800 text-sm">{label}</span>
                <span className="font-mono text-xs font-bold text-slate-500">{percent}%</span>
            </div>
        </div>
    );
}

function DecisionItem({ title, status, date, icon: Icon, color }: any) {
    return (
        <div className="nexus-glass p-4 rounded-2xl flex items-center justify-between bg-white/40">
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full ${color === 'text-[#16a34a]' ? 'bg-[#dcfce7]' : 'bg-[#fee2e2]'} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                    <span className="text-xs text-slate-400">{date}</span>
                </div>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{status}</span>
        </div>
    );
}
