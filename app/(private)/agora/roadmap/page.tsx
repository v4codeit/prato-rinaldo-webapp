import { requireVerifiedResident } from '@/lib/auth/dal';
import { getRoadmapProposals } from '@/app/actions/proposals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Clock, Trophy, Calendar } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/utils/constants';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const metadata = {
  title: 'Roadmap Proposte',
  description: 'Visualizza la roadmap delle proposte approvate, in corso e completate',
};

export default async function RoadmapPage() {
  // Require verified resident (redirects if not authenticated/verified)
  await requireVerifiedResident();

  // Load roadmap proposals grouped by status
  const { approved, inProgress, completed } = await getRoadmapProposals();

  return (
    <div className="container py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" asChild>
            <Link href={ROUTES.AGORA}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna all'Agorà
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Roadmap Proposte</h1>
            <p className="text-muted-foreground">
              Segui il progresso delle proposte approvate dalla community
            </p>
          </div>
        </div>

        {/* Timeline Grid - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Approved Column */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-lg">Approvate</CardTitle>
                </div>
                <Badge variant="secondary">{approved.length}</Badge>
              </div>
              <CardDescription>
                Proposte approvate in attesa di implementazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {approved.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nessuna proposta approvata
                </p>
              ) : (
                approved.map((proposal) => (
                  <Link key={proposal.id} href={`${ROUTES.AGORA}/${proposal.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {proposal.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Trophy className="h-3 w-3" />
                            <span>{proposal.score} voti</span>
                          </div>
                          {proposal.planned_date && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(proposal.planned_date), 'MMM yyyy', { locale: it })}
                              </span>
                            </div>
                          )}
                        </div>
                        {proposal.category && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: proposal.category.color || undefined }}
                          >
                            {proposal.category.name}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* In Progress Column */}
          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg">In Corso</CardTitle>
                </div>
                <Badge variant="secondary">{inProgress.length}</Badge>
              </div>
              <CardDescription>
                Proposte attualmente in fase di implementazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {inProgress.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nessuna proposta in corso
                </p>
              ) : (
                inProgress.map((proposal) => (
                  <Link key={proposal.id} href={`${ROUTES.AGORA}/${proposal.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-purple-200 dark:border-purple-900">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {proposal.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Trophy className="h-3 w-3" />
                            <span>{proposal.score} voti</span>
                          </div>
                          {proposal.planned_date && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(proposal.planned_date), 'MMM yyyy', { locale: it })}
                              </span>
                            </div>
                          )}
                        </div>
                        {proposal.category && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: proposal.category.color || undefined }}
                          >
                            {proposal.category.name}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Completed Column */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">Completate</CardTitle>
                </div>
                <Badge variant="secondary">{completed.length}</Badge>
              </div>
              <CardDescription>
                Proposte implementate con successo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {completed.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nessuna proposta completata
                </p>
              ) : (
                completed.map((proposal) => (
                  <Link key={proposal.id} href={`${ROUTES.AGORA}/${proposal.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {proposal.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Trophy className="h-3 w-3" />
                            <span>{proposal.score} voti</span>
                          </div>
                          {proposal.completed_date && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              <span>
                                {format(new Date(proposal.completed_date), 'MMM yyyy', { locale: it })}
                              </span>
                            </div>
                          )}
                        </div>
                        {proposal.category && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: proposal.category.color || undefined }}
                          >
                            {proposal.category.name}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
