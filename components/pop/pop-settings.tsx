"use client";

import React from "react";
import { User, Bell, Lock, HelpCircle, LogOut, ChevronRight, Moon } from "lucide-react";

export const PopSettings = () => {
    const settingsGroups = [
        {
            title: "Account",
            items: [
                { icon: User, label: "Personal Info", color: "bg-[#B8E6E1]" },
                { icon: Bell, label: "Notifications", color: "bg-[#FFD88D]" },
                { icon: Lock, label: "Privacy & Security", color: "bg-[#FFB7B2]" },
            ]
        },
        {
            title: "App",
            items: [
                { icon: Moon, label: "Dark Mode", color: "bg-[#D4C5F9]" },
                { icon: HelpCircle, label: "Help & Support", color: "bg-[#A0C4FF]" },
            ]
        }
    ];

    return (
        <div className="p-6 pt-12 pb-24 space-y-6 bg-[#A0C4FF] min-h-full">

            <h1 className="text-3xl font-black mb-8">Settings</h1>

            {/* Profile Card */}
            <div className="bg-white border-2 border-black rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-[#FFD88D] border-2 border-black rounded-full flex items-center justify-center font-black text-2xl">
                    JD
                </div>
                <div className="flex-1">
                    <h2 className="font-black text-lg">John Doe</h2>
                    <p className="font-bold text-gray-400 text-sm">john.doe@example.com</p>
                </div>
                <button className="px-3 py-1 border-2 border-black rounded-full text-xs font-black hover:bg-black hover:text-white transition-colors">
                    EDIT
                </button>
            </div>

            {/* Settings Groups */}
            <div className="space-y-8">
                {settingsGroups.map((group, idx) => (
                    <div key={idx} className="space-y-4">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider ml-2">{group.title}</h3>
                        <div className="bg-white border-2 border-black rounded-[20px] overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {group.items.map((item, i) => (
                                <div
                                    key={i}
                                    className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${i !== group.items.length - 1 ? 'border-b-2 border-gray-100' : ''}`}
                                >
                                    <div className={`w-10 h-10 ${item.color} border-2 border-black rounded-lg flex items-center justify-center`}>
                                        <item.icon size={20} />
                                    </div>
                                    <span className="font-bold flex-1">{item.label}</span>
                                    <ChevronRight size={20} className="text-gray-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Logout Button */}
            <button className="w-full mt-8 bg-[#FFB7B2] border-2 border-black rounded-xl py-4 font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
                <LogOut size={20} />
                Log Out
            </button>

            <p className="text-center text-xs font-bold text-gray-300 mt-6">
                Version 2.0.1 (Pop Edition)
            </p>

        </div>
    );
};
