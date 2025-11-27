"use client";

import React from "react";
import { Zap, Users, Calendar, TrendingUp } from "lucide-react";

export function BrutalDashboard() {
    return (
        <div className="space-y-6 pb-20">

            {/* Welcome banner */}
            <div className="bg-yellow border-[6px] border-black shadow-[8px_8px_0_black] p-6">
                <h2 className="brutal-title text-4xl uppercase mb-2">WELCOME BACK</h2>
                <p className="font-bold">Your community dashboard. Updated in real-time.</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">

                <StatBox
                    icon={Users}
                    value="247"
                    label="RESIDENTS"
                    bg="bg-cyan"
                />

                <StatBox
                    icon={Calendar}
                    value="3"
                    label="EVENTS"
                    bg="bg-magenta"
                />

                <StatBox
                    icon={TrendingUp}
                    value="12"
                    label="ACTIVE POLLS"
                    bg="bg-green"
                />

                <StatBox
                    icon={Zap}
                    value="98%"
                    label="UPTIME"
                    bg="bg-yellow"
                />

            </div>

            {/* Quick actions */}
            <div className="space-y-3">
                <h3 className="brutal-mono text-xs uppercase tracking-widest font-bold">QUICK ACTIONS</h3>

                <QuickAction label="CREATE EVENT" bg="bg-white" />
                <QuickAction label="POST UPDATE" bg="bg-white" />
                <QuickAction label="START POLL" bg="bg-white" />
            </div>

            {/* Alerts */}
            <div className="bg-red text-white border-[4px] border-black shadow-[8px_8px_0_black] p-6">
                <div className="flex items-start gap-4">
                    <div className="h-8 w-8 bg-white text-black border-[2px] border-black flex items-center justify-center brutal-mono font-bold shrink-0">
                        !
                    </div>
                    <div>
                        <h4 className="font-bold uppercase mb-1">WATER SHUT-OFF</h4>
                        <p className="text-sm font-medium">Scheduled maintenance tomorrow 9AM-12PM. Block A & B affected.</p>
                    </div>
                </div>
            </div>

        </div>
    );
}

function StatBox({ icon: Icon, value, label, bg }: any) {
    return (
        <div className={`${bg} border-[4px] border-black shadow-[6px_6px_0_black] p-6 hover:shadow-[8px_8px_0_black] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-100`}>
            <Icon className="h-8 w-8 mb-3" strokeWidth={3} />
            <p className="brutal-title text-4xl mb-1">{value}</p>
            <p className="brutal-mono text-xs uppercase tracking-wider font-bold">{label}</p>
        </div>
    );
}

function QuickAction({ label, bg }: any) {
    return (
        <button className={`w-full h-16 ${bg} border-[3px] border-black shadow-[4px_4px_0_black] hover:shadow-[6px_6px_0_black] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-100 font-bold uppercase text-left px-6 flex items-center justify-between`}>
            <span>{label}</span>
            <span className="text-2xl">→</span>
        </button>
    );
}
