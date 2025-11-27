"use client";

import React, { useState } from "react";
import "./nexus.css";
import { BentoGrid } from "@/components/nexus/bento-grid";
import { ActionOrb } from "@/components/nexus/action-orb";
import { NexusMenu } from "@/components/nexus/nexus-menu";
import { NexusFeed } from "@/components/nexus/nexus-feed";
import { NexusCondo } from "@/components/nexus/nexus-condo";
import { NexusLanding } from "@/components/nexus/nexus-landing";
import { NexusEvents } from "@/components/nexus/nexus-events";
import { NexusMarketplace } from "@/components/nexus/nexus-marketplace";
import { NexusAgora } from "@/components/nexus/nexus-agora";
import { NexusAuth } from "@/components/nexus/nexus-auth";
import { NexusSettings } from "@/components/nexus/nexus-settings";
import { NexusEventDetail } from "@/components/nexus/nexus-event-detail";
import { NexusEventCreate } from "@/components/nexus/nexus-event-create";
import { NexusMarketplaceDetail } from "@/components/nexus/nexus-marketplace-detail";
import { NexusMarketplaceCreate } from "@/components/nexus/nexus-marketplace-create";
import { NexusAgoraDetail } from "@/components/nexus/nexus-agora-detail";
import { NexusAgoraCreate } from "@/components/nexus/nexus-agora-create";

export default function NexusPage() {
    const [activeView, setActiveView] = useState("landing");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Navigation handler that supports sub-views
    const handleNavigate = (view: string) => {
        setActiveView(view);
    };

    return (
        <div className="min-h-screen bg-[#fdfbf7] text-slate-900 font-sans selection:bg-[#bae6fd]/50 overflow-x-hidden relative">

            {/* Ambient Background Glows (Pastel) */}
            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#e9d5ff]/40 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#bae6fd]/40 rounded-full blur-[120px] pointer-events-none" />

            {/* Navigation Menu Overlay */}
            <NexusMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={handleNavigate}
                activeView={activeView}
            />

            <main className="container max-w-md mx-auto py-8 px-4 pb-32 relative z-10 min-h-screen flex flex-col">

                {/* Header */}
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <p className="text-xs font-mono text-slate-500 mb-1 tracking-widest">SYSTEM: ONLINE</p>
                        <h1 className="text-4xl font-black tracking-tighter nexus-gradient-text uppercase">
                            {activeView.includes('event') ? 'EVENTS' :
                                activeView.includes('marketplace') ? 'MARKET' :
                                    activeView.includes('agora') ? 'AGORA' :
                                        activeView === 'dashboard' ? 'NEXUS' : activeView.replace('-', ' ')}
                        </h1>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden hover:border-[#0ea5e9] transition-colors shadow-sm"
                    >
                        <img src="/assets/avatars/1.png" alt="User" className="h-full w-full object-cover" />
                    </button>
                </header>

                {/* View Content */}
                <div key={activeView} className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeView === 'landing' && <NexusLanding onEnter={() => setActiveView('auth')} />}
                    {activeView === 'auth' && <NexusAuth />}

                    {activeView === 'dashboard' && <BentoGrid />}
                    {activeView === 'feed' && <NexusFeed />}
                    {activeView === 'condo' && <NexusCondo />}

                    {activeView === 'events' && <NexusEvents onNavigate={handleNavigate} />}
                    {activeView === 'event-detail' && <NexusEventDetail onBack={() => setActiveView('events')} />}
                    {activeView === 'event-create' && <NexusEventCreate onBack={() => setActiveView('events')} />}

                    {activeView === 'marketplace' && <NexusMarketplace onNavigate={handleNavigate} />}
                    {activeView === 'marketplace-detail' && <NexusMarketplaceDetail onBack={() => setActiveView('marketplace')} />}
                    {activeView === 'marketplace-create' && <NexusMarketplaceCreate onBack={() => setActiveView('marketplace')} />}

                    {activeView === 'agora' && <NexusAgora onNavigate={handleNavigate} />}
                    {activeView === 'agora-detail' && <NexusAgoraDetail onBack={() => setActiveView('agora')} />}
                    {activeView === 'agora-create' && <NexusAgoraCreate onBack={() => setActiveView('agora')} />}

                    {activeView === 'settings' && <NexusSettings />}
                </div>

            </main>

            {/* Floating Action Orb - Hide on Landing */}
            {activeView !== 'landing' && <ActionOrb />}

        </div>
    );
}
