"use client";

import React from "react";
import { Building, Phone, Mail, FileText, Download, Shield, Wrench, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DOCUMENTS = [
    { title: "Verbale Assemblea 2024", date: "15 Ott 2024", type: "PDF", size: "2.4 MB" },
    { title: "Bilancio Preventivo 2025", date: "01 Ott 2024", type: "XLS", size: "1.1 MB" },
    { title: "Regolamento Condominiale", date: "Gen 2020", type: "PDF", size: "5.0 MB" },
    { title: "Avviso Disinfestazione", date: "20 Set 2024", type: "PDF", size: "0.5 MB" },
];

export function ModernCondo() {
    return (
        <div className="space-y-6 pb-24">

            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Il Mio Condominio</h2>
                <p className="text-slate-500">Gestisci la tua casa e contatta l'amministrazione</p>
            </div>

            {/* Admin Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
                            <Building className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none mb-2">Amministratore</Badge>
                            <h3 className="text-2xl font-bold">Studio Rossi & Partners</h3>
                            <p className="text-slate-300">Via Roma 123, Prato Rinaldo</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button className="flex-1 md:flex-none bg-white text-slate-900 hover:bg-slate-100">
                            <Phone className="mr-2 h-4 w-4" /> Chiama
                        </Button>
                        <Button variant="outline" className="flex-1 md:flex-none border-white/20 text-white hover:bg-white/10">
                            <Mail className="mr-2 h-4 w-4" /> Email
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ActionCard icon={Wrench} label="Segnala Guasto" color="text-orange-500" bg="bg-orange-50" />
                <ActionCard icon={Shield} label="Registro Visitatori" color="text-blue-500" bg="bg-blue-50" />
                <ActionCard icon={FileText} label="Documenti" color="text-purple-500" bg="bg-purple-50" />
                <ActionCard icon={Phone} label="Numeri Utili" color="text-emerald-500" bg="bg-emerald-50" />
            </div>

            {/* Documents Section */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Documenti Recenti</h3>
                    <Button variant="link" className="text-blue-600">Vedi tutti</Button>
                </div>
                <div className="space-y-3">
                    {DOCUMENTS.map((doc, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer group">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900">{doc.title}</h4>
                                <p className="text-xs text-slate-500">{doc.date} • {doc.size}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-slate-900">
                                <Download className="h-5 w-5" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

function ActionCard({ icon: Icon, label, color, bg }: { icon: any, label: string, color: string, bg: string }) {
    return (
        <button className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-white border hover:shadow-md transition-all group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="h-7 w-7" />
            </div>
            <span className="font-bold text-slate-700 text-sm">{label}</span>
        </button>
    );
}
