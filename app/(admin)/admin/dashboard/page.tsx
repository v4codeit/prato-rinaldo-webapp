'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/molecules/stat-card';
import { Spinner } from '@/components/ui/spinner';
import { getDashboardStats } from '@/app/actions/admin';
import { Users, FileText, Calendar, ShoppingBag, Briefcase, MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const result = await getDashboardStats();

    if (result.stats) {
      setStats(result.stats);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          title="Utenti Totali"
          value={stats?.users || 0}
          icon={Users}
          trend={{ value: 12, label: '12%' }}
        />
        <StatCard
          title="Articoli"
          value={stats?.articles || 0}
          icon={FileText}
        />
        <StatCard
          title="Eventi"
          value={stats?.events || 0}
          icon={Calendar}
        />
        <StatCard
          title="Annunci Marketplace"
          value={stats?.marketplace || 0}
          icon={ShoppingBag}
        />
        <StatCard
          title="Professionisti"
          value={stats?.professionals || 0}
          icon={Briefcase}
        />
        <StatCard
          title="Discussioni Forum"
          value={stats?.threads || 0}
          icon={MessageSquare}
        />
        <StatCard
          title="In Moderazione"
          value={stats?.pendingModeration || 0}
          icon={AlertCircle}
          trend={{ value: stats?.pendingModeration > 0 ? 12 : 0, label: stats?.pendingModeration > 0 ? '12%' : '0%' }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestione Utenti
            </CardTitle>
            <CardDescription>
              Verifica e gestisci gli utenti della piattaforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/users">Gestisci Utenti</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Moderazione
            </CardTitle>
            <CardDescription>
              Rivedi contenuti in attesa di approvazione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/admin/moderation">
                  Coda Moderazione ({stats?.pendingModeration || 0})
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contenuti
            </CardTitle>
            <CardDescription>
              Crea e gestisci articoli e contenuti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/articles">Gestisci Articoli</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
