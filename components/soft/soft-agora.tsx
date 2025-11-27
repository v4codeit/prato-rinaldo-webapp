"use client";

import React from "react";
import { Vote, CheckCircle, X } from "lucide-react";

export function SoftAgora({ onNavigate }: { onNavigate?: (view: string) => void }) {
    return (
        <div className="space-y-6 pb-20">

            {/* Create button */}
            <button
                onClick={() => onNavigate?.('agora-create')}
                className="w-full h-14 soft-button text-soft-navy font-semibold flex items-center justify-center gap-2"
            >
                <span className="text-xl">+</span>
                Create Poll
            </button>

            {/* Active poll */}
            <div
                onClick={() => onNavigate?.('agora-detail')}
                className="soft-card gradient-lavender p-8 cursor-pointer hover:scale-[1.02] transition-transform duration-200"
            >
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/90 shadow-button flex items-center justify-center">
                        <Vote className="h-5 w-5 text-soft-navy" strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold text-soft-navy/60 text-sm uppercase tracking-wide">Active Poll</span>
                </div>

                <h2 className="soft-title text-2xl text-soft-navy mb-4 leading-tight">
                    New Parking Regulations
                </h2>

                <p className="text-soft-navy/70 font-medium mb-6 leading-relaxed">
                    Should we allocate 5 guest spots for electric vehicle charging only?
                </p>

                <div className="space-y-3">
                    <VoteBar label="Yes, approve it" percent={65} color="gradient-mint" />
                    <VoteBar label="No, keep as is" percent={35} color="gradient-peach" />
                </div>

                <div className="mt-6 flex justify-between text-sm text-soft-navy/60 font-semibold">
                    <span>142 votes</span>
                    <span>Ends in 2 days</span>
                </div>
            </div>

            {/* Past decisions */}
            <div className="space-y-3">
                <h3 className="soft-title text-sm text-soft-navy/60 uppercase tracking-wide">Recent Decisions</h3>

                <DecisionCard
                    title="Roof Renovation Budget"
                    status="Approved"
                    date="Oct 10"
                    statusColor="gradient-mint"
                    Icon={CheckCircle}
                />

                <DecisionCard
                    title="Night Security Shift"
                    status="Rejected"
                    date="Sep 28"
                    statusColor="gradient-peach"
                    Icon={X}
                />
            </div>

        </div>
    );
}

function VoteBar({ label, percent, color }: any) {
    return (
        <div className="relative h-14 bg-white/80 rounded-[999px] overflow-hidden shadow-button">
            <div
                className={`absolute left-0 top-0 h-full ${color} transition-all duration-500 rounded-[999px]`}
                style={{ width: `${percent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-5">
                <span className="font-semibold text-soft-navy relative z-10">{label}</span>
                <span className="font-bold text-soft-navy relative z-10">{percent}%</span>
            </div>
        </div>
    );
}

function DecisionCard({ title, status, date, statusColor, Icon }: any) {
    return (
        <div className="soft-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${statusColor} rounded-full flex items-center justify-center shadow-button shrink-0`}>
                    <Icon className="h-6 w-6 text-soft-navy" strokeWidth={2.5} />
                </div>
                <div>
                    <h4 className="font-bold text-soft-navy">{title}</h4>
                    <p className="text-sm text-soft-navy/50">{date}</p>
                </div>
            </div>
            <span className={`pill ${statusColor === 'gradient-mint' ? 'pill-green' : 'pill-pink'}`}>
                {status}
            </span>
        </div>
    );
}
