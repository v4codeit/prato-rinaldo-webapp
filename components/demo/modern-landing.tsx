"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Shield, Zap, MapPin } from "lucide-react";

export function ModernLanding({ onEnter }: { onEnter: () => void }) {
    return (
        <div className="flex flex-col min-h-screen bg-background">

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-background to-background" />
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-teal-500/10 text-teal-600 hover:bg-teal-500/20">
                            <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2 animate-pulse" />
                            La tua community digitale
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl max-w-4xl demo-gradient-text">
                            Vivi il tuo quartiere <br className="hidden md:inline" /> in modo intelligente.
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Prato Rinaldo non è solo un luogo, è una comunità. Connettiti con i vicini, gestisci il condominio e rimani aggiornato sugli eventi locali. Tutto in un'unica app.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Button size="lg" className="rounded-full bg-slate-900 text-white hover:bg-slate-800" onClick={onEnter}>
                                Inizia Ora <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full">
                                Scopri di più
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-slate-50/50">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Users}
                            title="Community Reale"
                            description="Conosci i tuoi vicini, organizza eventi e partecipa alla vita di quartiere in modo sicuro."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Condominio Smart"
                            description="Segnala guasti, paga le spese e vota alle assemblee direttamente dal tuo smartphone."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Avvisi Rapidi"
                            description="Ricevi notifiche immediate su lavori stradali, interruzioni idriche e urgenze."
                        />
                    </div>
                </div>
            </section>

            {/* Stats / Social Proof */}
            <section className="py-24 border-t">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <StatItem number="500+" label="Famiglie" />
                        <StatItem number="12" label="Condomini" />
                        <StatItem number="50+" label="Eventi Annuali" />
                        <StatItem number="24/7" label="Supporto" />
                    </div>
                </div>
            </section>

        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="flex flex-col items-start p-6 bg-background rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 text-teal-600">
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}

function StatItem({ number, label }: { number: string, label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-4xl font-extrabold text-slate-900 mb-2">{number}</span>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
    );
}
