"use client";

import React from "react";
import {
    LayoutDashboard,
    MessageSquare,
    Building2,
    Calendar,
    Settings,
    LogOut,
    User,
    Bell,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function SmartMenu() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pb-24">

            {/* 1. Desktop Sidebar Concept */}
            <div className="border rounded-3xl overflow-hidden bg-background shadow-sm h-[600px] flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="h-8 w-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">PR</div>
                        Prato Rinaldo
                    </div>
                </div>

                <div className="flex-1 p-4 space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wider">Principale</div>
                    <MenuLink icon={LayoutDashboard} label="Dashboard" active />
                    <MenuLink icon={MessageSquare} label="Bacheca" />
                    <MenuLink icon={Calendar} label="Eventi" />

                    <div className="text-xs font-semibold text-muted-foreground px-4 py-2 mt-6 uppercase tracking-wider">Condominio</div>
                    <MenuLink icon={Building2} label="Il Mio Condominio" />
                    <MenuLink icon={User} label="Profilo" />
                    <MenuLink icon={Settings} label="Impostazioni" />
                </div>

                <div className="p-4 border-t bg-slate-50/50">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-background transition-colors cursor-pointer">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src="/assets/avatars/1.png" />
                            <AvatarFallback>FR</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Francesca</p>
                            <p className="text-xs text-muted-foreground truncate">francesca@example.com</p>
                        </div>
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            </div>

            {/* 2. Mobile Drawer & Header Concept */}
            <div className="border rounded-3xl overflow-hidden bg-slate-100 shadow-sm h-[600px] relative">

                {/* Mobile Header */}
                <div className="bg-background/80 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-10 border-b">
                    <div className="h-8 w-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs">PR</div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Search className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full" />
                        </Button>
                        <Avatar className="h-8 w-8 ml-1">
                            <AvatarFallback className="bg-slate-200 text-slate-700">F</AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                {/* Mobile Content Preview */}
                <div className="p-4 space-y-4">
                    <div className="h-32 bg-white rounded-2xl shadow-sm animate-pulse" />
                    <div className="h-20 bg-white rounded-2xl shadow-sm animate-pulse" />
                    <div className="h-20 bg-white rounded-2xl shadow-sm animate-pulse" />
                </div>

                {/* New Mobile Bottom Nav (Floating) */}
                <div className="absolute bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-xl text-white p-2 rounded-2xl shadow-2xl flex justify-around items-center">
                    <MobileNavIcon icon={LayoutDashboard} active />
                    <MobileNavIcon icon={MessageSquare} />

                    {/* Central Action Button */}
                    <div className="-mt-8 bg-teal-500 p-3 rounded-2xl shadow-lg shadow-teal-500/30 transform hover:scale-105 transition-transform cursor-pointer">
                        <div className="h-6 w-6 text-white flex items-center justify-center font-bold text-xl">+</div>
                    </div>

                    <MobileNavIcon icon={Building2} />
                    <MobileNavIcon icon={User} />
                </div>

            </div>

        </div>
    );
}

function MenuLink({ icon: Icon, label, active }: { icon: any, label: string, active?: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
            active ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}>
            <Icon className={cn("h-5 w-5", active ? "text-teal-600" : "text-slate-400")} />
            {label}
        </div>
    );
}

function MobileNavIcon({ icon: Icon, active }: { icon: any, active?: boolean }) {
    return (
        <div className={cn(
            "p-3 rounded-xl transition-colors cursor-pointer",
            active ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
        )}>
            <Icon className="h-6 w-6" />
        </div>
    );
}
