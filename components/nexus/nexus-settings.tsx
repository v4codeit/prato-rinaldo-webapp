"use client";

import React from "react";
import { User, Bell, Shield, Moon, LogOut, ChevronRight, Smartphone, Globe } from "lucide-react";

export function NexusSettings() {
    return (
        <div className="space-y-6 pb-20">

            {/* Profile Header */}
            <div className="nexus-glass p-6 rounded-[30px] bg-white/40 flex items-center gap-4">
                <div className="h-20 w-20 rounded-full border-4 border-white shadow-sm overflow-hidden">
                    <img src="/assets/avatars/1.png" alt="User" className="h-full w-full object-cover" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Francesca</h2>
                    <p className="text-sm text-slate-500">Unit 402 • Resident</p>
                    <div className="mt-2 flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-[#0ea5e9]/10 text-[#0ea5e9] text-[10px] font-bold uppercase tracking-wider">
                            Verified
                        </span>
                        <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-wider">
                            Admin
                        </span>
                    </div>
                </div>
            </div>

            {/* Settings Groups */}
            <div className="space-y-4">

                <SettingsGroup title="Preferences">
                    <SettingsItem icon={Bell} label="Notifications" value="On" />
                    <SettingsItem icon={Moon} label="Dark Mode" value="Auto" />
                    <SettingsItem icon={Globe} label="Language" value="English" />
                </SettingsGroup>

                <SettingsGroup title="Account">
                    <SettingsItem icon={User} label="Personal Info" />
                    <SettingsItem icon={Shield} label="Security" />
                    <SettingsItem icon={Smartphone} label="Linked Devices" value="2" />
                </SettingsGroup>

                <button className="w-full p-4 rounded-2xl bg-red-50 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                    <LogOut className="h-5 w-5" />
                    LOG OUT
                </button>

                <p className="text-center text-xs text-slate-400 font-mono pt-4">
                    NEXUS v2.0.4 (Build 8821)
                </p>

            </div>

        </div>
    );
}

function SettingsGroup({ title, children }: any) {
    return (
        <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-4">{title}</h3>
            <div className="nexus-glass rounded-[24px] overflow-hidden bg-white/40">
                {children}
            </div>
        </div>
    );
}

function SettingsItem({ icon: Icon, label, value }: any) {
    return (
        <button className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Icon className="h-4 w-4" />
                </div>
                <span className="font-bold text-slate-700 text-sm">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs font-medium text-slate-400">{value}</span>}
                <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
        </button>
    );
}
