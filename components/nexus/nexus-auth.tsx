"use client";

import React, { useState } from "react";
import { Mail, Lock, ArrowRight, Github, Chrome } from "lucide-react";

export function NexusAuth() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-[600px] flex flex-col items-center justify-center p-4">

            {/* Auth Card */}
            <div className="w-full max-w-sm nexus-glass rounded-[40px] p-8 bg-white/40 border border-white/60 relative overflow-hidden">

                {/* Background Blob */}
                <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[#0ea5e9]/20 rounded-full blur-2xl pointer-events-none" />

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                        {isLogin ? "Welcome Back" : "Join Nexus"}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {isLogin ? "Enter your credentials to access the void." : "Create your digital identity today."}
                    </p>
                </div>

                <div className="space-y-4">

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="email"
                                placeholder="citizen@nexus.com"
                                className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 text-slate-800 placeholder:text-slate-400 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 text-slate-800 placeholder:text-slate-400 transition-all"
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Invite Code</label>
                            <input
                                type="text"
                                placeholder="NEXUS-2024"
                                className="w-full h-12 px-4 rounded-2xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 text-slate-800 placeholder:text-slate-400 text-center tracking-widest font-mono uppercase"
                            />
                        </div>
                    )}

                    <button className="w-full h-14 mt-4 rounded-2xl bg-[#0ea5e9] text-white font-bold text-lg tracking-wide shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                        {isLogin ? "ENTER NEXUS" : "INITIALIZE"}
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                </div>

                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 w-full">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Or continue with</span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="flex gap-3">
                        <SocialButton icon={Chrome} />
                        <SocialButton icon={Github} />
                    </div>

                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-slate-500 hover:text-[#0ea5e9] font-medium transition-colors"
                    >
                        {isLogin ? "New here? Create account" : "Already a citizen? Login"}
                    </button>
                </div>

            </div>
        </div>
    );
}

function SocialButton({ icon: Icon }: any) {
    return (
        <button className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0ea5e9] hover:border-[#0ea5e9] transition-all hover:scale-110">
            <Icon className="h-5 w-5" />
        </button>
    );
}
