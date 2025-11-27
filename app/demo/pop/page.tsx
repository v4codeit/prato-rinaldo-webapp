"use client";

import React, { useState } from "react";
import "./pop.css";
import { cn } from "@/lib/utils/cn";
import {
    MessageSquare,
    Calendar,
    ShoppingBag,
    Vote,
    Home,
    User
} from "lucide-react";
import { PopLanding } from "@/components/pop/pop-landing";
import { PopAuth } from "@/components/pop/pop-auth";
import { PopDashboard } from "@/components/pop/pop-dashboard";
import { PopFeed } from "@/components/pop/pop-feed";
import { PopEvents } from "@/components/pop/pop-events";
import { PopMarketplace } from "@/components/pop/pop-marketplace";
import { PopAgora } from "@/components/pop/pop-agora";
import { PopCondo } from "@/components/pop/pop-condo";
import { PopSettings } from "@/components/pop/pop-settings";

const PopMenu = ({ activeTab, onNavigate }: { activeTab: string, onNavigate: (tab: string) => void }) => {
    const menuItems = [
        { id: "dashboard", icon: Home, label: "Home", color: "bg-[#B8E6E1]" },
        { id: "feed", icon: MessageSquare, label: "Feed", color: "bg-[#FFD88D]" },
        { id: "events", icon: Calendar, label: "Events", color: "bg-[#FFB7B2]" },
        { id: "marketplace", icon: ShoppingBag, label: "Market", color: "bg-[#D4C5F9]" },
        { id: "agora", icon: Vote, label: "Agora", color: "bg-[#A0C4FF]" },
        { id: "condo", icon: Home, label: "Condo", color: "bg-[#B8E6E1]" },
        { id: "settings", icon: User, label: "Profile", color: "bg-[#FFD88D]" },
    ];

    return (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-black p-4 pb-8 z-50 overflow-x-auto no-scrollbar">
            <div className="flex justify-between items-center min-w-max gap-4 px-4">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                            "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 border-2 border-transparent flex-shrink-0",
                            activeTab === item.id
                                ? `border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-2 ${item.color}`
                                : "hover:bg-gray-100"
                        )}
                    >
                        <item.icon className={cn("w-6 h-6", activeTab === item.id ? "text-black" : "text-gray-500")} />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default function PopDemoPage() {
    const [currentView, setCurrentView] = useState("landing");
    const [activeTab, setActiveTab] = useState("dashboard");

    const navigateTo = (view: string) => {
        setCurrentView(view);
        if (["dashboard", "feed", "events", "marketplace", "agora", "condo", "settings"].includes(view)) {
            setActiveTab(view);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case "landing":
                return <PopLanding onStart={() => navigateTo("auth")} />;
            case "auth":
                return <PopAuth onLogin={() => navigateTo("dashboard")} onBack={() => navigateTo("landing")} />;
            case "dashboard":
                return <PopDashboard />;
            case "feed":
                return <PopFeed />;
            case "events":
                return <PopEvents />;
            case "marketplace":
                return <PopMarketplace />;
            case "agora":
                return <PopAgora />;
            case "condo":
                return <PopCondo />;
            case "settings":
                return <PopSettings />;
            default:
                return <div className="p-6 pt-12 bg-[#FAFAFA] h-full">Not Found</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans text-[#1A1A1A]">
            {/* Mobile Frame */}
            <div className="w-full max-w-[400px] h-[850px] bg-white rounded-[40px] border-[8px] border-black overflow-hidden relative shadow-2xl flex flex-col">
                {/* Status Bar Area */}
                <div className="h-8 bg-white border-b-2 border-black w-full absolute top-0 z-50 flex items-center justify-between px-6">
                    <div className="text-xs font-bold">9:41</div>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full bg-black"></div>
                        <div className="w-3 h-3 rounded-full bg-black"></div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar bg-[#FAFAFA] relative">
                    {renderContent()}
                </div>

                {/* Navigation (only show if not landing or auth) */}
                {!["landing", "auth"].includes(currentView) && (
                    <PopMenu activeTab={activeTab} onNavigate={navigateTo} />
                )}
            </div>
        </div>
    );
}
