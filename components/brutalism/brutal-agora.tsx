"use client";

import React from "react";
import { Vote, CheckCircle, X } from "lucide-react";

export function BrutalAgora({ onNavigate }: { onNavigate?: (view: string) => void }) {
    return (
        <div className="space-y-6 pb-20">

            {/* Create button */}
            <button
                onClick={() => onNavigate?.('agora-create')}
                className="w-full h-16 bg-yellow border-[4px] border-black shadow-[6px_6px_0_black] hover:shadow-[8px_8px_0_black] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-100 font-bold uppercase text-lg"
            >
                + CREATE POLL
            </button>

            {/* Active poll */}
            <div
                onClick={() => onNavigate?.('agora-detail')}
                className="bg-magenta border-[6px] border-black shadow-[12px_12px_0_black] p-8 cursor-pointer hover:shadow-[16px_16px_0_black] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all duration-100"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Vote className="h-6 w-6" strokeWidth={3} />
                    <span className="brutal-mono text-xs uppercase tracking-wider font-bold">ACTIVE POLL</span>
                </div>

                <h2 className="brutal-title text-3xl uppercase mb-4 leading-tight">
                    NEW PARKING REGULATIONS
                </h2>

                <p className="font-medium mb-6">
                    Should we allocate 5 guest spots for electric vehicle charging only?
                </p>

                <div className="space-y-3">
                    <VoteBar label="YES, APPROVE IT" percent={65} color="bg-green" />
                    <VoteBar label="NO, KEEP AS IS" percent={35} color="bg-red" />
                </div>

                <div className="mt-6 flex justify-between brutal-mono text-xs uppercase font-bold">
                    <span>142 VOTES</span>
                    <span>ENDS IN 2 DAYS</span>
                </div>
            </div>

            {/* Past decisions */}
            <div className="space-y-4">
                <h3 className="brutal-mono text-xs uppercase tracking-wider font-bold">RECENT DECISIONS</h3>

                <DecisionCard
                    title="ROOF RENOVATION BUDGET"
                    status="APPROVED"
                    date="OCT 10"
                    statusColor="bg-green"
                />

                <DecisionCard
                    title="NIGHT SECURITY SHIFT"
                    status="REJECTED"
                    date="SEP 28"
                    statusColor="bg-red"
                />
            </div>

        </div>
    );
}

function VoteBar({ label, percent, color }: any) {
    return (
        <div className="relative h-14 bg-white border-[3px] border-black overflow-hidden">
            <div
                className={`absolute left-0 top-0 h-full ${color} border-r-[3px] border-black transition-all duration-300`}
                style={{ width: `${percent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-4">
                <span className="font-bold uppercase text-sm relative z-10">{label}</span>
                <span className="brutal-mono font-bold relative z-10">{percent}%</span>
            </div>
        </div>
    );
}

function DecisionCard({ title, status, date, statusColor }: any) {
    const Icon = statusColor === 'bg-green' ? CheckCircle : X;

    return (
        <div className="bg-white border-[4px] border-black shadow-[4px_4px_0_black] p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`h-12 w-12 ${statusColor} border-[3px] border-black flex items-center justify-center shrink-0`}>
                    <Icon className="h-6 w-6" strokeWidth={3} />
                </div>
                <div>
                    <h4 className="font-bold uppercase">{title}</h4>
                    <p className="brutal-mono text-xs opacity-60">{date}</p>
                </div>
            </div>
            <span className={`${statusColor} px-3 py-1 border-[2px] border-black brutal-mono text-xs font-bold`}>
                {status}
            </span>
        </div>
    );
}
