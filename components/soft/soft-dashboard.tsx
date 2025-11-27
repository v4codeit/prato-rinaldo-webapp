"use client";

import React from "react";
import { Users, Calendar, TrendingUp, Zap } from "lucide-react";

export function SoftDashboard() {
    return (
        <div className="space-y-6 pb-20">

            {/* Welcome card */}
            <div className="soft-card p-8 gradient-multi">
                <h2 className="soft-title text-3xl text-soft-navy mb-2">Welcome Back!</h2>
                <p className="text-soft-navy/70 font-medium">Here's what's happening in your community</p>
            </div>

            {/* Balance card (like in reference) */}
            <div className="soft-card p-8 gradient-mint">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-sm text-soft-navy/60 font-semibold mb-1">Your Balance</p>
                        <h3 className="soft-title text-5xl text-soft-navy">€2,568</h3>
                    </div>
                    <button className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-sm shadow-button hover:scale-110 transition-transform flex items-center justify-center">
                        <span className="text-xl">+</span>
                    </button>
                </div>
                <div className="flex gap-3">
                    <QuickAction icon="📤" label="Send" color="bg-soft-peach" />
                    <QuickAction icon="📥" label="Request" color="bg-soft-lavender" />
                    <QuickAction icon="💳" label="Cards" color="bg-soft-blue" />
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">

                <StatCard
                    icon={Users}
                    value="247"
                    label="Residents"
                    gradient="gradient-lavender"
                />

                <StatCard
                    icon={Calendar}
                    value="3"
                    label="Events"
                    gradient="gradient-peach"
                />

                <StatCard
                    icon={TrendingUp}
                    value="12"
                    label="Active Polls"
                    gradient="gradient-mint"
                />

                <StatCard
                    icon={Zap}
                    value="98%"
                    label="Uptime"
                    gradient="gradient-lavender"
                />

            </div>

            {/* Recent activity */}
            <div className="soft-card p-6">
                <h3 className="soft-title text-lg text-soft-navy mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    <ActivityItem
                        icon="🎉"
                        title="BBQ Party RSVP"
                        time="2h ago"
                        color="bg-soft-peach"
                    />
                    <ActivityItem
                        icon="🗳️"
                        title="Voted on parking poll"
                        time="5h ago"
                        color="bg-soft-lavender"
                    />
                    <ActivityItem
                        icon="💬"
                        title="New message from Anna"
                        time="1d ago"
                        color="bg-soft-mint"
                    />
                </div>
            </div>

        </div>
    );
}

function QuickAction({ icon, label, color }: any) {
    return (
        <button className={`flex-1 h-20 ${color} rounded-[20px] shadow-button hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-1`}>
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-semibold text-soft-navy">{label}</span>
        </button>
    );
}

function StatCard({ icon: Icon, value, label, gradient }: any) {
    return (
        <div className={`soft-card ${gradient} p-6 hover:scale-105 transition-transform duration-200`}>
            <Icon className="h-8 w-8 text-soft-navy mb-3" strokeWidth={2.5} />
            <p className="soft-title text-3xl text-soft-navy mb-1">{value}</p>
            <p className="text-sm text-soft-navy/60 font-semibold">{label}</p>
        </div>
    );
}

function ActivityItem({ icon, title, time, color }: any) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-[16px] hover:bg-soft-mint/10 transition-colors">
            <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center shadow-button shrink-0`}>
                <span className="text-xl">{icon}</span>
            </div>
            <div className="flex-1">
                <p className="font-semibold text-soft-navy">{title}</p>
                <p className="text-sm text-soft-navy/50">{time}</p>
            </div>
        </div>
    );
}
