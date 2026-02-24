'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Shield, Zap, LayoutDashboard, User } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/utils/constants';
import { createClient } from '@/lib/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function ModernLandingContent() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const isMobile = useIsMobile();
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            // SOLO MOBILE + loggato: redirect automatico a /bacheca
            if (isMobile && user) {
                router.push('/bacheca');
            }
            setLoading(false);
        });
    }, [isMobile, router]);

    // Durante il check auth su mobile, mostra loading minimale
    if (loading && isMobile) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Image
                    src="/assets/logos/logo-pratorinaldo.png"
                    alt="Prato Rinaldo"
                    width={40}
                    height={40}
                    className="animate-pulse rounded-xl"
                    sizes="40px"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAARklEQVQYlWP4z8DwHwMDAxMDFGBIMPxnYGBgYmJi+M/AwMDEwMDAxMDAwMTAwMBARQUTA8N/BgYGJiYmhv8MDAyMVFQAALOYCAvzJJHRAAAAAElFTkSuQmCC"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Nav Bar Minimal */}
            <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/assets/logos/logo-pratorinaldo.png"
                            alt="Prato Rinaldo"
                            width={40}
                            height={40}
                            className="rounded-xl"
                            sizes="40px"
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAACXBIWXMAAAsTAAALEwEAmpwYAAAARklEQVQYlWP4z8DwHwMDAxMDFGBIMPxnYGBgYmJi+M/AwMDEwMDAxMDAwMTAwMBARQUTA8N/BgYGJiYmhv8MDAyMVFQAALOYCAvzJJHRAAAAAElFTkSuQmCC"
                        />
                        <span className="font-bold text-xl text-slate-900">Prato Rinaldo</span>
                    </div>
                    <div className="flex gap-3">
                        {user ? (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href={ROUTES.SETTINGS}>
                                        <User className="h-4 w-4 mr-2" />
                                        Profilo
                                    </Link>
                                </Button>
                                <Button className="rounded-full bg-slate-900 hover:bg-slate-800" asChild>
                                    <Link href={ROUTES.BACHECA}>
                                        <LayoutDashboard className="h-4 w-4 mr-2" />
                                        Vai alla Bacheca
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href={ROUTES.LOGIN}>Accedi</Link>
                                </Button>
                                <Button className="rounded-full bg-slate-900 hover:bg-slate-800" asChild>
                                    <Link href={ROUTES.REGISTER}>Iscriviti</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden flex-1">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-background to-background" />
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-teal-500/10 text-teal-600 border-teal-200">
                            <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2 animate-pulse" />
                            La tua community digitale
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl max-w-4xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            Vivi il tuo quartiere <br className="hidden md:inline" /> in modo intelligente.
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Prato Rinaldo non è solo un luogo, è una comunità. Connettiti con i vicini, gestisci il condominio e rimani aggiornato sugli eventi locali.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {user ? (
                                <Button size="lg" className="rounded-full bg-slate-900 hover:bg-slate-800 text-white" asChild>
                                    <Link href={ROUTES.BACHECA}>
                                        <LayoutDashboard className="h-4 w-4 mr-2" />
                                        Vai alla Bacheca <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button size="lg" className="rounded-full bg-slate-900 hover:bg-slate-800 text-white" asChild>
                                    <Link href={ROUTES.REGISTER}>
                                        Inizia Ora <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                            <Button size="lg" variant="outline" className="rounded-full" asChild>
                                <Link href="#features">Scopri di più</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-50/50">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Tutto quello che ti serve</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Una piattaforma completa per vivere la tua comunità in modo moderno e connesso.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Users}
                            title="Community Reale"
                            description="Conosci i tuoi vicini, organizza eventi e partecipa alla vita di quartiere in modo sicuro."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Condominio Smart"
                            description="Segnala guasti, visualizza documenti e rimani aggiornato sulle assemblee."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Avvisi Rapidi"
                            description="Ricevi notifiche immediate su lavori stradali, interruzioni idriche e urgenze."
                        />
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-24 border-t bg-white">
                <div className="container px-4 md:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <StatItem number="500+" label="Famiglie" />
                        <StatItem number="12" label="Condomini" />
                        <StatItem number="50+" label="Eventi Annuali" />
                        <StatItem number="24/7" label="Supporto" />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight lg:text-4xl max-w-3xl">
                            {user ? 'Bentornato nella community!' : 'Pronto per unirti alla community?'}
                        </h2>
                        <p className="text-slate-300 max-w-2xl text-lg">
                            {user
                                ? 'Accedi alla tua bacheca per vedere le ultime novità dal quartiere.'
                                : 'Registrati ora e inizia a vivere il tuo quartiere in modo più connesso e intelligente.'
                            }
                        </p>
                        {user ? (
                            <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-100" asChild>
                                <Link href={ROUTES.BACHECA}>
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    Vai alla Bacheca <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-100" asChild>
                                <Link href={ROUTES.REGISTER}>
                                    Iscriviti Gratuitamente <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )}
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
            <h3 className="text-xl font-bold mb-2 text-slate-900">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
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
