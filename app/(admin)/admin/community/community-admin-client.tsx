'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/molecules/empty-state';
import type { TopicListItem } from '@/types/topics';
import { getVisibilityLabel, getWritePermissionLabel } from '@/types/topics';
import { deleteTopic } from '@/app/actions/topics';
import {
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  MessageSquare,
  Lock,
  Globe,
  Shield,
  UserCheck,
} from 'lucide-react';
import type { Route } from 'next';

interface CommunityAdminClientProps {
  topics: TopicListItem[];
}

/**
 * Admin client component for managing topics
 */
export function CommunityAdminClient({ topics }: CommunityAdminClientProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');

  // Filter topics
  const filteredTopics = React.useMemo(() => {
    let result = topics;

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [topics, search]);

  // Handle delete
  const handleDelete = async (topicId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo topic? Tutti i messaggi verranno persi.')) {
      return;
    }
    await deleteTopic(topicId);
    router.refresh();
  };

  // Get visibility icon
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'authenticated':
        return <UserCheck className="h-4 w-4" />;
      case 'verified':
        return <Shield className="h-4 w-4" />;
      case 'members_only':
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestione Community</h1>
        <p className="text-muted-foreground">
          Gestisci i topic della community e le loro impostazioni
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Topic Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messaggi Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topics.reduce((sum, t) => sum + t.messageCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membri Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topics.reduce((sum, t) => sum + t.memberCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Topics table */}
      {filteredTopics.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nessun topic"
          description={
            search
              ? 'Nessun risultato per la ricerca'
              : 'Non ci sono ancora topic. Crea il primo!'
          }
          action={
            !search && (
              <Button asChild>
                <Link href={'/admin/community/new' as Route}>Crea Topic</Link>
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Visibilità</TableHead>
                <TableHead>Scrittura</TableHead>
                <TableHead className="text-right">Membri</TableHead>
                <TableHead className="text-right">Messaggi</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTopics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-lg flex-shrink-0"
                        style={{ backgroundColor: `${topic.color}20` }}
                      >
                        {topic.icon || (
                          <MessageSquare
                            className="h-5 w-5"
                            style={{ color: topic.color }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{topic.name}</span>
                          {topic.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {topic.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      {getVisibilityIcon(topic.visibility)}
                      {getVisibilityLabel(topic.visibility)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getWritePermissionLabel(topic.writePermission)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {topic.memberCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      {topic.messageCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/community/${topic.slug}` as Route}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifica
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/community/${topic.slug}/members` as Route}>
                            <Users className="mr-2 h-4 w-4" />
                            Gestisci membri
                          </Link>
                        </DropdownMenuItem>
                        {!topic.isDefault && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(topic.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Elimina
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
