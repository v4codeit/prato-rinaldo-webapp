'use client';

import * as React from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/molecules/empty-state';
import { toast } from 'sonner';
import type { TopicListItem, TopicMemberWithUser, TopicMemberRole } from '@/types/topics';
import { getMemberRoleLabel } from '@/types/topics';
import { getInitials } from '@/lib/utils/format';
import {
  addTopicMember,
  removeTopicMember,
  updateMemberRole,
} from '@/app/actions/topic-members';
import {
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Trash2,
  Loader2,
  Users,
  Crown,
} from 'lucide-react';

interface TopicMembersClientProps {
  topic: TopicListItem;
  members: TopicMemberWithUser[];
}

/**
 * Admin client component for managing topic members
 */
export function TopicMembersClient({
  topic,
  members: initialMembers,
}: TopicMembersClientProps) {
  const router = useRouter();
  const [members, setMembers] = React.useState(initialMembers);
  const [search, setSearch] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newMemberEmail, setNewMemberEmail] = React.useState('');
  const [newMemberRole, setNewMemberRole] = React.useState<TopicMemberRole>('writer');

  // Filter members by search
  const filteredMembers = React.useMemo(() => {
    if (!search.trim()) return members;

    const searchLower = search.toLowerCase();
    return members.filter(
      (m) =>
        m.user.name?.toLowerCase().includes(searchLower) ||
        m.user.email?.toLowerCase().includes(searchLower)
    );
  }, [members, search]);

  // Group members by role
  const membersByRole = React.useMemo(() => {
    const groups: Record<string, TopicMemberWithUser[]> = {
      admin: [],
      moderator: [],
      writer: [],
      viewer: [],
    };

    filteredMembers.forEach((member) => {
      groups[member.role]?.push(member);
    });

    return groups;
  }, [filteredMembers]);

  // Handle add member
  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addTopicMember(topic.id, {
        email: newMemberEmail,
        role: newMemberRole,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Membro aggiunto con successo');
      setIsAddDialogOpen(false);
      setNewMemberEmail('');
      setNewMemberRole('writer');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle role change
  const handleRoleChange = async (memberId: string, userId: string, newRole: TopicMemberRole) => {
    const result = await updateMemberRole(topic.id, userId, newRole);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    toast.success('Ruolo aggiornato');
  };

  // Handle remove member
  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Rimuovere questo membro dal topic?')) return;

    const result = await removeTopicMember(topic.id, userId);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    toast.success('Membro rimosso');
  };

  // Get role icon
  const getRoleIcon = (role: TopicMemberRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'moderator':
        return <ShieldCheck className="h-4 w-4 text-blue-600" />;
      case 'writer':
        return <User className="h-4 w-4 text-green-600" />;
      case 'viewer':
        return <User className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Membri di {topic.name}
          </h1>
          <p className="text-muted-foreground">
            Gestisci i membri e i loro ruoli nel topic
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Aggiungi membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi membro</DialogTitle>
              <DialogDescription>
                Aggiungi un utente al topic specificando la sua email
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email utente</label>
                <Input
                  placeholder="email@esempio.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ruolo</label>
                <Select
                  value={newMemberRole}
                  onValueChange={(value) =>
                    setNewMemberRole(value as TopicMemberRole)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Lettore</SelectItem>
                    <SelectItem value="writer">Membro</SelectItem>
                    <SelectItem value="moderator">Moderatore</SelectItem>
                    <SelectItem value="admin">Amministratore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button onClick={handleAddMember} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Aggiungi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Membri totali</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{membersByRole.admin.length}</p>
                <p className="text-sm text-muted-foreground">Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {membersByRole.moderator.length}
                </p>
                <p className="text-sm text-muted-foreground">Moderatori</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {membersByRole.writer.length + membersByRole.viewer.length}
                </p>
                <p className="text-sm text-muted-foreground">Membri</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca membri..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Members table */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun membro"
          description={
            search
              ? 'Nessun risultato per la ricerca'
              : 'Questo topic non ha ancora membri'
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utente</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Aggiunto il</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={member.user.avatar || undefined}
                          alt={member.user.name || ''}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.user.name || member.user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.user.name || 'Utente'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(
                            member.id,
                            member.user_id,
                            value as TopicMemberRole
                          )
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Lettore</SelectItem>
                          <SelectItem value="writer">Membro</SelectItem>
                          <SelectItem value="moderator">Moderatore</SelectItem>
                          <SelectItem value="admin">Amministratore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.joined_at).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Rimuovi
                        </DropdownMenuItem>
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
