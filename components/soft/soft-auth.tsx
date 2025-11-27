"use client";

import React, { useState } from "react";
import { Mail, Lock, User, Chrome, Github } from "lucide-react";

export function SoftAuth() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-[500px] flex items-center justify-center py-8">

            <div className="w-full max-w-md soft-card p-8">

                {/* Tab switcher */}
                <div className="flex gap-2 mb-8 p-1 bg-soft-mint/20 rounded-[20px]">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 h-12 rounded-[16px] font-semibold transition-all duration-200 ${isLogin
                                ? 'bg-white shadow-button text-soft-navy'
                                : 'text-soft-navy/50 hover:text-soft-navy'
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 h-12 rounded-[16px] font-semibold transition-all duration-200 ${!isLogin
                                ? 'bg-white shadow-button text-soft-navy'
                                : 'text-soft-navy/50 hover:text-soft-navy'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">

                    {!isLogin && (
                        <FormField
                            icon={User}
                            label="Full Name"
                            placeholder="John Doe"
                            type="text"
                        />
                    )}

                    <FormField
                        icon={Mail}
                        label="Email"
                        placeholder="you@example.com"
                        type="email"
                    />

                    <FormField
                        icon={Lock}
                        label="Password"
                        placeholder="••••••••"
                        type="password"
                    />

                    <button className="w-full h-14 soft-button text-soft-navy font-semibold text-lg mt-6">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>

                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-8">
                    <div className="flex-1 h-px bg-soft-navy/10" />
                    <span className="text-sm text-soft-navy/40 font-medium">or continue with</span>
                    <div className="flex-1 h-px bg-soft-navy/10" />
                </div>

                {/* Social buttons */}
                <div className="flex gap-3">
                    <SocialButton icon={Chrome} gradient="gradient-peach" />
                    <SocialButton icon={Github} gradient="gradient-lavender" />
                </div>

            </div>

        </div>
    );
}

function FormField({ icon: Icon, label, placeholder, type }: any) {
    return (
        <div>
            <label className="text-sm font-semibold text-soft-navy/70 mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                {label}
            </label>
            <input
                type={type}
                placeholder={placeholder}
                className="soft-input w-full"
            />
        </div>
    );
}

function SocialButton({ icon: Icon, gradient }: any) {
    return (
        <button className={`flex-1 h-14 ${gradient} rounded-[18px] shadow-button hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-soft-navy" strokeWidth={2.5} />
        </button>
    );
}
