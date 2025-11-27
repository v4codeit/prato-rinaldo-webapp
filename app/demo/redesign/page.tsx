"use client";

import React, { useState } from "react";
import { SmartDashboard } from "@/components/demo/smart-dashboard";
import { ModernFeed } from "@/components/demo/modern-feed";
import { ModernLanding } from "@/components/demo/modern-landing";
import { SmartMenu } from "@/components/demo/smart-menu";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, MessageSquare, Menu, Globe, Sidebar } from "lucide-react";
import { cn } from "@/lib/utils";
import "./demo.css";

export default function RedesignDemoPage() {
    const [activeTab, setActiveTab] = useState<"dashboard" | "feed" | "landing" | "menu">("dashboard");

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-teal-500/20">

            {/* Demo Navigation Control (Top Bar) */}
            <div className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between overflow-x-auto demo-no-scrollbar">
                    <div className="flex items-center gap-2 font-bold text-lg mr-4 shrink-0">
                        <span className="bg-teal-600 text-white px-2 py-0.5 rounded-md text-sm">DEMO</span>
                        Prato Rinaldo
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <NavTab label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
                        <NavTab label="Feed" active={activeTab === "feed"} onClick={() => setActiveTab("feed")} />
                        <NavTab label="Landing" active={activeTab === "landing"} onClick={() => setActiveTab("landing")} />
                        <NavTab label="Menu & Nav" active={activeTab === "menu"} onClick={() => setActiveTab("menu")} />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="container py-6 animate-in fade-in duration-500">
                {activeTab === "dashboard" && <SmartDashboard />}
                {activeTab === "feed" && <ModernFeed />}
                {activeTab === "landing" && <ModernLanding />}
                {activeTab === "menu" && <SmartMenu />}
            </main>

            {/* Mobile Bottom Navigation (Mockup) */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-xl p-2 pb-6 md:hidden z-50">
                <div className="flex justify-around items-center">
                    <NavButton icon={LayoutDashboard} label="Home" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
                    <NavButton icon={MessageSquare} label="Bacheca" active={activeTab === "feed"} onClick={() => setActiveTab("feed")} />

                    {/* Central FAB */}
                    <div className="-mt-8">
                        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
                            <span className="text-2xl">+</span>
                        </Button>
                    </div>

                    <NavButton icon={Menu} label="Menu" active={false} />
                </div>
            </div>

        </div>
    );
}

function NavTab({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <Button
            variant={active ? "default" : "ghost"}
            size="sm"
            onClick={onClick}
            className={cn(
                "rounded-full px-4",
                active ? "bg-slate-900 text-white hover:bg-slate-800" : "text-muted-foreground hover:text-foreground"
            )}
        >
            {label}
        </Button>
    );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors w-16",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
        >
            <Icon className={cn("h-6 w-6", active && "fill-current")} />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}
