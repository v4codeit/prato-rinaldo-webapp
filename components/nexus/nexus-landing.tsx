"use client";

import React from "react";
import { ArrowRight, Shield, Users, Zap } from "lucide-react";

export function NexusLanding({ onEnter }: { onEnter: () => void }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 pb-10">

            {/* Hero Content */}
            <div className="relative z-10 text-center px-6 max-w-lg mx-auto">

                <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/60 backdrop-blur-md shadow-sm animate-in fade-in slide-in-from-top-4 duration-1000">
                    <span className="h-2 w-2 rounded-full bg-[#0ea5e9] animate-pulse" />
                    <span className="text-xs font-bold text-slate-600 tracking-wider">PROJECT NEXUS v2.0</span>
                </div>

                <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-[0.9] animate-in fade-in zoom-in-50 duration-1000 delay-100">
                    YOUR <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-[#ec4899]">COMMUNITY</span> <br />
                    REIMAGINED
                </h1>

                <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-xs mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                    Experience the future of neighborhood living. Fluid, connected, and alive.
                </p>

                <button
                    onClick={onEnter}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#0ea5e9] text-white rounded-full font-bold text-lg tracking-wide overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(14,165,233,0.4)] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300"
                >
                    <span className="relative z-10">ENTER NEXUS</span>
                    <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

            </div>

            {/* Feature Grid (Floating) */}
            <div className="mt-20 grid grid-cols-3 gap-4 px-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                <FeatureCard icon={Shield} label="Secure" delay={0} />
                <FeatureCard icon={Users} label="Social" delay={100} />
                <FeatureCard icon={Zap} label="Instant" delay={200} />
            </div>

            {/* Abstract Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#bae6fd]/30 to-[#fbcfe8]/30 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[5000ms]" />

        </div>
    );
}

function FeatureCard({ icon: Icon, label, delay }: any) {
    return (
        <div
            className="nexus-glass p-4 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white/30 hover:bg-white/50 transition-colors"
            style={{ animationDelay: `${delay}ms` }}
        >
            <Icon className="h-6 w-6 text-slate-700" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
    );
}
