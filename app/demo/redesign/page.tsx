"use client";

import React, { useState } from "react";
import { SmartDashboard } from "@/components/demo/smart-dashboard";
import { ModernFeed } from "@/components/demo/modern-feed";
import { ModernLanding } from "@/components/demo/modern-landing";
import { SmartMenu } from "@/components/demo/smart-menu";
import { ModernAuth } from "@/components/demo/modern-auth";
import { Button } from "@/components/ui/button";
import { LayoutGrid, MessageSquare, Menu, Globe, Sidebar, Calendar, ShoppingBag, Vote, Building, Settings, User, Search, Bell, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import "./demo.css";

import { ModernEvents } from "@/components/demo/modern-events";
import { ModernEventDetail } from "@/components/demo/modern-event-detail";
import { ModernEventCreate } from "@/components/demo/modern-event-create";
import { ModernMarketplace } from "@/components/demo/modern-marketplace";
import { ModernMarketplaceDetail } from "@/components/demo/modern-marketplace-detail";
import { ModernMarketplaceCreate } from "@/components/demo/modern-marketplace-create";
import { ModernAgora } from "@/components/demo/modern-agora";
import { ModernAgoraDetail } from "@/components/demo/modern-agora-detail";
import { ModernAgoraCreate } from "@/components/demo/modern-agora-create";
import { ModernCommunity } from "@/components/demo/modern-community";
import { ModernCondo } from "@/components/demo/modern-condo";
import { ModernSettings } from "@/components/demo/modern-settings";

type ViewState =
    | "landing" | "auth" | "dashboard" | "feed"
    | "events" | "event-detail" | "event-create"
    | "marketplace" | "marketplace-detail" | "marketplace-create"
    | "agora" | "agora-detail" | "agora-create"
    | "community" | "condo" | "settings" | "menu";

export default function RedesignDemoPage() {
    const [activeView, setActiveView] = useState<ViewState>("landing");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCommunityFullscreen, setIsCommunityFullscreen] = useState(false);

    const handleLogin = () => {
        setIsAuthenticated(true);
        setActiveView("dashboard");
    };

    const navigateTo = (view: ViewState) => {
        setActiveView(view);
    };

    // If on landing or auth, show full screen without standard nav
    if (activeView === "landing") {
        return <ModernLanding onEnter={() => setActiveView("auth")} />;
    }

    if (activeView === "auth") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 font-sans">
                <ModernAuth onLogin={handleLogin} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-blue-500/20 pb-24">

            {/* Header (Desktop & Mobile) - Clean Style - Hidden when community is fullscreen */}
            {!isCommunityFullscreen && (
                <div className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
                    <div className="container flex h-16 items-center justify-between px-4">
                        {/* Left: Logo */}
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo("dashboard")}>
                            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                PR
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="rounded-full text-slate-600 hover:bg-slate-100">
                                <Search className="h-5 w-5" />
                            </Button>
                            <div className="relative">
                                <Button variant="ghost" size="icon" className="rounded-full text-slate-600 hover:bg-slate-100">
                                    <Bell className="h-5 w-5" />
                                </Button>
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                            </div>
                            <div
                                className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold cursor-pointer hover:ring-2 ring-slate-300 transition-all"
                                onClick={() => navigateTo("settings")}
                            >
                                F
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className={cn(
                "container max-w-5xl mx-auto animate-in fade-in duration-500",
                !isCommunityFullscreen && "py-6 px-4"
            )}>
                {activeView === "dashboard" && <SmartDashboard />}
                {activeView === "feed" && <ModernFeed />}

                {activeView === "events" && <ModernEvents onNavigate={(view) => navigateTo(view as ViewState)} />}
                {activeView === "event-detail" && <ModernEventDetail onBack={() => navigateTo("events")} />}
                {activeView === "event-create" && <ModernEventCreate onBack={() => navigateTo("events")} />}

                {activeView === "marketplace" && <ModernMarketplace onNavigate={(view) => navigateTo(view as ViewState)} />}
                {activeView === "marketplace-detail" && <ModernMarketplaceDetail onBack={() => navigateTo("marketplace")} />}
                {activeView === "marketplace-create" && <ModernMarketplaceCreate onBack={() => navigateTo("marketplace")} />}

                {activeView === "agora" && <ModernAgora onNavigate={(view) => navigateTo(view as ViewState)} />}
                {activeView === "agora-detail" && <ModernAgoraDetail onBack={() => navigateTo("agora")} />}
                {activeView === "agora-create" && <ModernAgoraCreate onBack={() => navigateTo("agora")} />}

                {activeView === "community" && (
                    <ModernCommunity onFullscreenChange={setIsCommunityFullscreen} />
                )}
                {activeView === "condo" && <ModernCondo />}
                {activeView === "settings" && <ModernSettings />}

                {/* Full Screen Menu Overlay */}
                {activeView === "menu" && (
                    <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-20 px-6 animate-in fade-in slide-in-from-bottom-10 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <MenuCard icon={Calendar} label="Eventi" color="bg-orange-100 text-orange-600" onClick={() => navigateTo("events")} />
                            <MenuCard icon={ShoppingBag} label="Mercatino" color="bg-emerald-100 text-emerald-600" onClick={() => navigateTo("marketplace")} />
                            <MenuCard icon={Vote} label="Agora" color="bg-violet-100 text-violet-600" onClick={() => navigateTo("agora")} />
                            <MenuCard icon={MessageSquare} label="Community" color="bg-blue-100 text-blue-600" onClick={() => navigateTo("community")} />
                        </div>
                        <div className="mt-8 text-center">
                            <Button variant="outline" className="rounded-full px-8" onClick={() => navigateTo("dashboard")}>
                                Chiudi Menu
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Bottom Navigation - Dark Pill Style - Hidden when community is fullscreen */}
            {!isCommunityFullscreen && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
                    <div className="bg-slate-900 rounded-3xl p-2 shadow-2xl shadow-slate-900/20 flex justify-between items-center px-6">
                        <NavButton icon={LayoutGrid} active={activeView === "dashboard"} onClick={() => navigateTo("dashboard")} />
                        <NavButton icon={MessageSquare} active={activeView === "feed"} onClick={() => navigateTo("feed")} />

                        {/* Central Plus Button */}
                        <div className="-mt-8">
                            <button
                                className="h-14 w-14 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                                onClick={() => navigateTo(activeView === "menu" ? "dashboard" : "menu")}
                            >
                                <Plus className={`h-8 w-8 transition-transform duration-300 ${activeView === "menu" ? "rotate-45" : ""}`} />
                            </button>
                        </div>

                        <NavButton icon={Building} active={activeView === "condo"} onClick={() => navigateTo("condo")} />
                        <NavButton icon={User} active={activeView === "settings"} onClick={() => navigateTo("settings")} />
                    </div>
                </div>
            )}

        </div>
    );
}

function NavButton({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-3 rounded-xl transition-all",
                active ? "text-white bg-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
        >
            <Icon className="h-6 w-6" strokeWidth={2} />
        </button>
    );
}

function MenuCard({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-white border shadow-sm hover:shadow-md transition-all active:scale-95"
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                <Icon className="h-6 w-6" />
            </div>
            <span className="font-bold text-slate-700">{label}</span>
        </button>
    );
}
