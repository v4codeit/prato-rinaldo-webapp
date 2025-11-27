"use client";

import React, { useState } from "react";
import { ArrowLeft, Mail, Lock, User, Github, Twitter } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const PopAuth = ({ onLogin, onBack }: { onLogin: () => void, onBack: () => void }) => {
    const [mode, setMode] = useState<"login" | "register">("login");

    return (
        <div className="min-h-full bg-[#FFD88D] p-6 flex flex-col relative">
            <button
                onClick={onBack}
                className="absolute top-6 left-6 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all z-10"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="flex-1 flex flex-col justify-center space-y-6 mt-12">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black">
                        {mode === "login" ? "Welcome Back!" : "Join the Club"}
                    </h2>
                    <p className="font-bold opacity-60">
                        {mode === "login" ? "Ready to dive in?" : "Let's get you set up."}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white border-2 border-black rounded-[24px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl border-2 border-black mb-6">
                        <button
                            onClick={() => setMode("login")}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                mode === "login" ? "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "text-gray-500 hover:text-black"
                            )}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setMode("register")}
                            className={cn(
                                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                mode === "register" ? "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "text-gray-500 hover:text-black"
                            )}
                        >
                            Register
                        </button>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        {mode === "register" && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={20} />
                                <input
                                    className="w-full bg-[#FAFAFA] border-2 border-black rounded-xl py-3 pl-10 pr-4 font-bold placeholder:font-medium focus:bg-[#B8E6E1] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none"
                                    placeholder="Username"
                                />
                            </div>
                        )}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={20} />
                            <input
                                className="w-full bg-[#FAFAFA] border-2 border-black rounded-xl py-3 pl-10 pr-4 font-bold placeholder:font-medium focus:bg-[#B8E6E1] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none"
                                placeholder="Email Address"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={20} />
                            <input
                                type="password"
                                className="w-full bg-[#FAFAFA] border-2 border-black rounded-xl py-3 pl-10 pr-4 font-bold placeholder:font-medium focus:bg-[#B8E6E1] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <button
                        onClick={onLogin}
                        className="w-full mt-6 bg-black text-white border-2 border-black rounded-xl py-3 font-bold text-lg shadow-[4px_4px_0px_0px_#B8E6E1] active:translate-y-1 active:shadow-none transition-all"
                    >
                        {mode === "login" ? "Log In" : "Create Account"}
                    </button>

                    <div className="mt-6 flex items-center gap-4">
                        <div className="h-[2px] bg-gray-200 flex-1" />
                        <span className="text-xs font-bold text-gray-400 uppercase">Or continue with</span>
                        <div className="h-[2px] bg-gray-200 flex-1" />
                    </div>

                    <div className="flex gap-4 mt-4">
                        <button className="flex-1 bg-white border-2 border-black rounded-xl py-2 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-y-1 active:shadow-none transition-all">
                            <Github size={20} />
                        </button>
                        <button className="flex-1 bg-white border-2 border-black rounded-xl py-2 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-y-1 active:shadow-none transition-all">
                            <Twitter size={20} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
