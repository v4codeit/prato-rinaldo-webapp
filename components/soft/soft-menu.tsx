"use client";

import React from "react";
import { X } from "lucide-react";

interface SoftMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string) => void;
    activeView: string;
}

export function SoftMenu({ isOpen, onClose, onNavigate, activeView }: SoftMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soft-navy/40 backdrop-blur-xl">

            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/90 shadow-button hover:scale-110 transition-transform flex items-center justify-center"
            >
                <X className="h-6 w-6 text-soft-navy" strokeWidth={2.5} />
            </button>

            {/* Menu grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">

                <MenuItem
                    icon="🏠"
                    label="Landing"
                    gradient="gradient-mint"
                    isActive={activeView === 'landing'}
                    onClick={() => { onNavigate('landing'); onClose(); }}
                />
                <MenuItem
                    icon="📊"
                    label="Dashboard"
                    gradient="gradient-lavender"
                    isActive={activeView === 'dashboard'}
                    onClick={() => { onNavigate('dashboard'); onClose(); }}
                />
                <MenuItem
                    icon="📝"
                    label="Feed"
                    gradient="gradient-peach"
                    isActive={activeView === 'feed'}
                    onClick={() => { onNavigate('feed'); onClose(); }}
                />
                <MenuItem
                    icon="📅"
                    label="Events"
                    gradient="gradient-mint"
                    isActive={activeView === 'events'}
                    onClick={() => { onNavigate('events'); onClose(); }}
                />
                <MenuItem
                    icon="🛒"
                    label="Market"
                    gradient="gradient-lavender"
                    isActive={activeView === 'marketplace'}
                    onClick={() => { onNavigate('marketplace'); onClose(); }}
                />
                <MenuItem
                    icon="🗳️"
                    label="Agora"
                    gradient="gradient-peach"
                    isActive={activeView === 'agora'}
                    onClick={() => { onNavigate('agora'); onClose(); }}
                />
                <MenuItem
                    icon="🏡"
                    label="My Condo"
                    gradient="gradient-mint"
                    isActive={activeView === 'condo'}
                    onClick={() => { onNavigate('condo'); onClose(); }}
                />
                <MenuItem
                    icon="⚙️"
                    label="Settings"
                    gradient="gradient-lavender"
                    isActive={activeView === 'settings'}
                    onClick={() => { onNavigate('settings'); onClose(); }}
                />

            </div>

        </div>
    );
}

function MenuItem({ icon, label, gradient, isActive, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`h-32 ${gradient} rounded-[30px] shadow-float hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-3 ${isActive ? 'ring-4 ring-white/50' : ''
                }`}
        >
            <span className="text-4xl">{icon}</span>
            <span className="soft-title text-lg text-soft-navy">{label}</span>
        </button>
    );
}
