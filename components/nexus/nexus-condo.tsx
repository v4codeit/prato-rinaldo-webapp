"use client";

import React from "react";
import { FileText, DollarSign, Wrench, ChevronRight } from "lucide-react";

export function NexusCondo() {
    return (
        <div className="space-y-6 pb-20">

            {/* Balance Card */}
            <div className="nexus-glass rounded-[30px] p-6 relative overflow-hidden bg-[#bae6fd]/20">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <DollarSign className="h-32 w-32 text-[#0ea5e9]" />
                </div>
                <span className="text-xs font-mono text-slate-500 tracking-widest">CURRENT BALANCE</span>
                <h2 className="text-4xl font-black text-slate-900 mt-2">€ 1.250,00</h2>
                <p className="text-sm text-[#0ea5e9] mt-1">Next payment due: 15 Oct</p>

                <button className="mt-6 w-full py-3 rounded-xl bg-[#0ea5e9] text-white font-bold uppercase tracking-wider hover:bg-[#0284c7] transition-colors shadow-lg shadow-sky-200">
                    Pay Now
                </button>
            </div>

            {/* Active Requests */}
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Active Requests</h3>
                <div className="space-y-3">
                    <RequestItem
                        title="Broken Light"
                        id="#REQ-2024-001"
                        status="In Progress"
                        color="text-[#eab308]"
                    />
                    <RequestItem
                        title="Elevator Noise"
                        id="#REQ-2024-002"
                        status="Pending"
                        color="text-slate-400"
                    />
                </div>
            </div>

            {/* Documents */}
            <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Recent Documents</h3>
                <div className="grid grid-cols-2 gap-3">
                    <DocItem title="Meeting Minutes" date="Oct 2023" />
                    <DocItem title="Financial Report" date="Sep 2023" />
                    <DocItem title="Rules & Regs" date="2024" />
                </div>
            </div>

        </div>
    );
}

function RequestItem({ title, id, status, color }: any) {
    return (
        <div className="nexus-glass rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-white/60 transition-colors bg-white/40">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800">{title}</h4>
                    <span className="text-xs font-mono text-slate-400">{id}</span>
                </div>
            </div>
            <div className="text-right">
                <span className={`text-xs font-bold ${color}`}>{status}</span>
            </div>
        </div>
    );
}

function DocItem({ title, date }: any) {
    return (
        <div className="nexus-glass rounded-2xl p-4 flex flex-col gap-3 hover:bg-white/60 transition-colors cursor-pointer bg-white/40">
            <FileText className="h-6 w-6 text-[#ec4899]" />
            <div>
                <h4 className="font-bold text-sm leading-tight text-slate-800">{title}</h4>
                <span className="text-xs text-slate-400">{date}</span>
            </div>
        </div>
    );
}
