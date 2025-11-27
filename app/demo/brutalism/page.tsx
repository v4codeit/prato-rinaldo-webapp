"use client";

import React, { useState } from "react";
import "./brutalism.css";
import { BrutalLanding } from "@/components/brutalism/brutal-landing";
import { BrutalMenu } from "@/components/brutalism/brutal-menu";
import { BrutalAuth } from "@/components/brutalism/brutal-auth";
import { BrutalDashboard } from "@/components/brutalism/brutal-dashboard";
import { BrutalFeed } from "@/components/brutalism/brutal-feed";
import { BrutalEvents } from "@/components/brutalism/brutal-events";
import { BrutalEventDetail } from "@/components/brutalism/brutal-event-detail";
import { BrutalMarketplace } from "@/components/brutalism/brutal-marketplace";
import { BrutalMarketplaceDetail } from "@/components/brutalism/brutal-marketplace-detail";
import { BrutalAgora } from "@/components/brutalism/brutal-agora";
import { BrutalAgoraDetail } from "@/components/brutalism/brutal-agora-detail";

export default function BrutalismPage() {
    const [activeView, setActiveView] = useState("landing");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavigate = (view: string) => {
        setActiveView(view);
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-cyan selection:text-black">

            <BrutalMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={handleNavigate}
                activeView={activeView}
            />

            <main className="container max-w-2xl mx-auto py-8 px-4 relative">

                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <p className="brutal-mono text-xs uppercase tracking-wider mb-2">SYSTEM ONLINE</p>
                        <h1 className="brutal-title text-5xl uppercase">
                            {activeView.includes('event') ? 'EVENTS' :
                                activeView.includes('marketplace') ? 'MARKET' :
                                    activeView.includes('agora') ? 'AGORA' :
                                        activeView === 'dashboard' ? 'NEXUS' : activeView.replace('-', ' ')}
                        </h1>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="h-16 w-16 bg-yellow border-[4px] border-black shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 flex items-center justify-center text-2xl font-bold"
                    >
                        ☰
                    </button>
                </header>

                <div key={activeView}>
                    {activeView === 'landing' && <BrutalLanding onEnter={() => setActiveView('dashboard')} />}
                    {activeView === 'auth' && <BrutalAuth />}
                    {activeView === 'dashboard' && <BrutalDashboard />}
                    {activeView === 'feed' && <BrutalFeed />}

                    {activeView === 'events' && <BrutalEvents onNavigate={handleNavigate} />}
                    {activeView === 'event-detail' && <BrutalEventDetail onBack={() => setActiveView('events')} />}

                    {activeView === 'marketplace' && <BrutalMarketplace onNavigate={handleNavigate} />}
                    {activeView === 'marketplace-detail' && <BrutalMarketplaceDetail onBack={() => setActiveView('marketplace')} />}

                    {activeView === 'agora' && <BrutalAgora onNavigate={handleNavigate} />}
                    {activeView === 'agora-detail' && <BrutalAgoraDetail onBack={() => setActiveView('agora')} />}

                    {activeView === 'condo' && <PlaceholderView title="MY CONDO" />}
                    {activeView === 'settings' && <PlaceholderView title="SETTINGS" />}
                </div>

            </main>

        </div>
    );
}

function PlaceholderView({ title }: { title: string }) {
    return (
        <div className="min-h-[400px] bg-white border-[6px] border-black shadow-[12px_12px_0_black] p-8 flex flex-col items-center justify-center">
            <div className="h-24 w-24 bg-yellow border-[4px] border-black mb-6 flex items-center justify-center text-4xl">
                🚧
            </div>
            <h2 className="brutal-title text-4xl mb-4">{title}</h2>
            <p className="font-bold text-center max-w-xs">
                UNDER CONSTRUCTION<br />
                COMING SOON
            </p>
        </div>
    );
}
