"use client";

import React, { useState } from "react";
import "./soft.css";
import { SoftLanding } from "@/components/soft/soft-landing";
import { SoftMenu } from "@/components/soft/soft-menu";
import { SoftAuth } from "@/components/soft/soft-auth";
import { SoftDashboard } from "@/components/soft/soft-dashboard";
import { SoftFeed } from "@/components/soft/soft-feed";
import { SoftEvents } from "@/components/soft/soft-events";
import { SoftEventDetail } from "@/components/soft/soft-event-detail";
import { SoftMarketplace } from "@/components/soft/soft-marketplace";
import { SoftMarketplaceDetail } from "@/components/soft/soft-marketplace-detail";
import { SoftAgora } from "@/components/soft/soft-agora";
import { SoftAgoraDetail } from "@/components/soft/soft-agora-detail";

export default function SoftPage() {
    const [activeView, setActiveView] = useState("landing");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavigate = (view: string) => {
        setActiveView(view);
    };

    return (
        <div className="min-h-screen gradient-multi font-sans relative overflow-hidden">

            <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-soft-lavender rounded-full opacity-30 blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-soft-peach rounded-full opacity-30 blur-3xl" />

            <SoftMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={handleNavigate}
                activeView={activeView}
            />

            <main className="container max-w-md mx-auto py-8 px-4 relative z-10">

                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-soft-navy/60 mb-1 font-semibold">
                            Welcome Back
                        </p>
                        <h1 className="soft-title text-4xl text-soft-navy">
                            {activeView.includes('event') ? 'Events' :
                                activeView.includes('marketplace') ? 'Market' :
                                    activeView.includes('agora') ? 'Agora' :
                                        activeView === 'landing' ? 'Nexus' :
                                            activeView === 'dashboard' ? 'Dashboard' :
                                                activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                        </h1>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm shadow-button flex items-center justify-center hover:scale-105 transition-transform duration-200"
                    >
                        <div className="flex flex-col gap-1">
                            <div className="w-5 h-0.5 bg-soft-navy rounded-full" />
                            <div className="w-5 h-0.5 bg-soft-navy rounded-full" />
                            <div className="w-5 h-0.5 bg-soft-navy rounded-full" />
                        </div>
                    </button>
                </header>

                <div key={activeView} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeView === 'landing' && <SoftLanding onEnter={() => setActiveView('dashboard')} />}
                    {activeView === 'auth' && <SoftAuth />}
                    {activeView === 'dashboard' && <SoftDashboard />}
                    {activeView === 'feed' && <SoftFeed />}

                    {activeView === 'events' && <SoftEvents onNavigate={handleNavigate} />}
                    {activeView === 'event-detail' && <SoftEventDetail onBack={() => setActiveView('events')} />}

                    {activeView === 'marketplace' && <SoftMarketplace onNavigate={handleNavigate} />}
                    {activeView === 'marketplace-detail' && <SoftMarketplaceDetail onBack={() => setActiveView('marketplace')} />}

                    {activeView === 'agora' && <SoftAgora onNavigate={handleNavigate} />}
                    {activeView === 'agora-detail' && <SoftAgoraDetail onBack={() => setActiveView('agora')} />}

                    {activeView === 'condo' && <PlaceholderView title="My Condo" />}
                    {activeView === 'settings' && <PlaceholderView title="Settings" />}
                </div>

            </main>

        </div>
    );
}

function PlaceholderView({ title }: { title: string }) {
    return (
        <div className="soft-card p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full gradient-lavender flex items-center justify-center text-4xl mb-6 shadow-button">
                ✨
            </div>
            <h2 className="soft-title text-3xl text-soft-navy mb-3">{title}</h2>
            <p className="text-soft-navy/60 font-medium">Coming soon...</p>
        </div>
    );
}
