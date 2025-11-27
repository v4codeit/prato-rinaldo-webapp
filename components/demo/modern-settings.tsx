"use client";

import React from "react";
import { User, Bell, Lock, Moon, HelpCircle, LogOut, ChevronRight, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ModernSettings() {
    return (
        <div className="space-y-6 pb-24">

            <h2 className="text-3xl font-bold text-slate-900">Impostazioni</h2>

            {/* Profile Card */}
            <div className="bg-white border rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm text-center md:text-left">
                <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-slate-50">
                        <AvatarImage src="/assets/avatars/me.png" />
                        <AvatarFallback className="bg-slate-900 text-white text-xl">FR</AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                        <User className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">Francesca Rossi</h3>
                    <p className="text-slate-500">francesca.rossi@example.com</p>
                    <Badge className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none inline-block">Residente Verificato</Badge>
                </div>
                <Button variant="outline" className="rounded-full w-full md:w-auto px-6">Modifica Profilo</Button>
            </div>

            {/* Settings Groups */}
            <div className="space-y-6">

                {/* Account */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">Account</h4>
                    <div className="bg-white border rounded-3xl overflow-hidden">
                        <SettingsItem icon={User} label="Informazioni Personali" />
                        <SettingsItem icon={Bell} label="Notifiche" hasSwitch />
                        <SettingsItem icon={Lock} label="Privacy e Sicurezza" />
                    </div>
                </div>

                {/* App */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2">Applicazione</h4>
                    <div className="bg-white border rounded-3xl overflow-hidden">
                        <SettingsItem icon={Moon} label="Modalità Scura" hasSwitch />
                        <SettingsItem icon={Globe} label="Lingua" value="Italiano" />
                        <SettingsItem icon={HelpCircle} label="Aiuto e Supporto" />
                    </div>
                </div>

            </div>

            {/* Logout */}
            <Button variant="destructive" className="w-full h-14 rounded-2xl text-lg font-medium shadow-lg shadow-red-500/20 hover:bg-red-600">
                <LogOut className="mr-2 h-5 w-5" /> Esci dall'account
            </Button>

            <p className="text-center text-xs text-slate-400 mt-8">
                Prato Rinaldo App v2.4.0 (Build 2024.11.27)
            </p>

        </div>
    );
}

function SettingsItem({ icon: Icon, label, value, hasSwitch }: { icon: any, label: string, value?: string, hasSwitch?: boolean }) {
    return (
        <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b last:border-none">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 font-medium text-slate-900">{label}</div>
            {value && <span className="text-sm text-slate-500 mr-2">{value}</span>}
            {hasSwitch ? (
                <Switch />
            ) : (
                <ChevronRight className="h-5 w-5 text-slate-300" />
            )}
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${className}`}>{children}</span>;
}
