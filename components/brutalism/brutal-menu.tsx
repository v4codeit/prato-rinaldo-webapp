"use client";

import React from "react";
import { X } from "lucide-react";

interface BrutalMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string) => void;
    activeView: string;
}

export function BrutalMenu({ isOpen, onClose, onNavigate, activeView }: BrutalMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8">

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 h-16 w-16 bg-red text-white border-[4px] border-white shadow-[4px_4px_0_white] hover:shadow-[2px_2px_0_white] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center justify-center"
            >
                <X className="h-8 w-8" strokeWidth={4} />
            </button>

            {/* Menu grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">

                <MenuItem
                    label="LANDING"
                    bg="bg-yellow"
                    isActive={activeView === 'landing'}
                    onClick={() => { onNavigate('landing'); onClose(); }}
                />
                <MenuItem
                    label="DASHBOARD"
                    bg="bg-cyan"
                    isActive={activeView === 'dashboard'}
                    onClick={() => { onNavigate('dashboard'); onClose(); }}
                />
                <MenuItem
                    label="FEED"
                    bg="bg-magenta"
                    isActive={activeView === 'feed'}
                    onClick={() => { onNavigate('feed'); onClose(); }}
                />
                <MenuItem
                    label="EVENTS"
                    bg="bg-green"
                    isActive={activeView === 'events'}
                    onClick={() => { onNavigate('events'); onClose(); }}
                />
                <MenuItem
                    label="MARKET"
                    bg="bg-red"
                    isActive={activeView === 'marketplace'}
                    onClick={() => { onNavigate('marketplace'); onClose(); }}
                />
                <MenuItem
                    label="AGORA"
                    bg="bg-yellow"
                    isActive={activeView === 'agora'}
                    onClick={() => { onNavigate('agora'); onClose(); }}
                />
                <MenuItem
                    label="MY CONDO"
                    bg="bg-cyan"
                    isActive={activeView === 'condo'}
                    onClick={() => { onNavigate('condo'); onClose(); }}
                />
                <MenuItem
                    label="SETTINGS"
                    bg="bg-white"
                    isActive={activeView === 'settings'}
                    onClick={() => { onNavigate('settings'); onClose(); }}
                />

            </div>

        </div>
    );
}

function MenuItem({ label, bg, isActive, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`h-32 ${bg} ${bg === 'bg-white' ? 'text-black' : 'text-black'} border-[4px] border-white ${isActive ? 'shadow-[8px_8px_0_white]' : 'shadow-[4px_4px_0_white]'
                } hover:shadow-[8px_8px_0_white] hover:scale-105 transition-all duration-100 flex items-center justify-center`}
        >
            <span className="brutal-title text-2xl uppercase tracking-tight">{label}</span>
        </button>
    );
}
