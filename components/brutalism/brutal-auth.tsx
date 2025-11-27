"use client";

import React, { useState } from "react";
import { Mail, Lock, User } from "lucide-react";

export function BrutalAuth() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-[500px] flex flex-col items-center justify-center py-8">

            {/* Auth box */}
            <div className="w-full max-w-md bg-white border-[6px] border-black shadow-[12px_12px_0_black] p-8">

                {/* Tabs */}
                <div className="flex mb-8 border-[4px] border-black">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 h-14 font-bold uppercase transition-all duration-100 ${isLogin
                                ? 'bg-yellow text-black'
                                : 'bg-white text-black hover:bg-gray-100'
                            }`}
                    >
                        LOGIN
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 h-14 font-bold uppercase transition-all duration-100 border-l-[4px] border-black ${!isLogin
                                ? 'bg-cyan text-black'
                                : 'bg-white text-black hover:bg-gray-100'
                            }`}
                    >
                        REGISTER
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-6">

                    <FormField
                        icon={Mail}
                        label="EMAIL"
                        placeholder="user@nexus.com"
                        type="email"
                    />

                    <FormField
                        icon={Lock}
                        label="PASSWORD"
                        placeholder="••••••••"
                        type="password"
                    />

                    {!isLogin && (
                        <FormField
                            icon={User}
                            label="NAME"
                            placeholder="John Doe"
                            type="text"
                        />
                    )}

                    {/* Submit button */}
                    <button className="w-full h-16 bg-black text-white border-[4px] border-black shadow-[8px_8px_0_black] hover:shadow-[4px_4px_0_black] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-100 mt-8">
                        <span className="brutal-title text-xl uppercase tracking-tight">
                            {isLogin ? 'ACCESS SYSTEM' : 'CREATE ACCOUNT'}
                        </span>
                    </button>

                </div>

                {/* Social */}
                <div className="mt-8 pt-8 border-t-[4px] border-black">
                    <div className="flex gap-4">
                        <SocialButton label="GOOGLE" bg="bg-red" />
                        <SocialButton label="GITHUB" bg="bg-black text-white" />
                    </div>
                </div>

            </div>

        </div>
    );
}

function FormField({ icon: Icon, label, placeholder, type }: any) {
    return (
        <div>
            <label className="brutal-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" strokeWidth={3} />
                {label}
            </label>
            <input
                type={type}
                placeholder={placeholder}
                className="w-full h-14 px-4 border-[3px] border-black focus:border-cyan focus:shadow-[0_0_0_4px_#00FFFF] outline-none font-bold transition-all duration-100"
            />
        </div>
    );
}

function SocialButton({ label, bg }: any) {
    return (
        <button className={`flex-1 h-12 ${bg} border-[3px] border-black shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 font-bold text-sm uppercase`}>
            {label}
        </button>
    );
}
