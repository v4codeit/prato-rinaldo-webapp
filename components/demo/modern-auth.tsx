"use client";

import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight, Github, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ModernAuth({ onLogin }: { onLogin: () => void }) {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Glass Card */}
                <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-xl relative overflow-hidden">

                    {/* Decorative Background Elements */}
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                {isLogin ? "Bentornato" : "Crea Account"}
                            </h1>
                            <p className="text-slate-500 mt-2">
                                {isLogin ? "Accedi per continuare su Prato Rinaldo" : "Unisciti alla tua comunità oggi stesso"}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {!isLogin && (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input
                                            placeholder="Nome Completo"
                                            className="pl-10 bg-white/50 border-white/50 focus:bg-white transition-all rounded-xl h-12"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        className="pl-10 bg-white/50 border-white/50 focus:bg-white transition-all rounded-xl h-12"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        className="pl-10 bg-white/50 border-white/50 focus:bg-white transition-all rounded-xl h-12"
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                                onClick={onLogin}
                            >
                                {isLogin ? "Accedi" : "Registrati"} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent px-2 text-slate-500 backdrop-blur-sm">O continua con</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="h-12 rounded-xl bg-white/30 border-white/50 hover:bg-white/50">
                                    <Chrome className="mr-2 h-4 w-4" /> Google
                                </Button>
                                <Button variant="outline" className="h-12 rounded-xl bg-white/30 border-white/50 hover:bg-white/50">
                                    <Github className="mr-2 h-4 w-4" /> GitHub
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors"
                            >
                                {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
