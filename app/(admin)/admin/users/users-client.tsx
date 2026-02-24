'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { FilterPanel, type FilterField } from '@/components/admin/filter-panel';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/format';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, CheckCircle, XCircle, Shield, Users, Crown, Star, FileText, DollarSign, Building, AlertTriangle, Clock, UserPlus, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  updateUserRole,
  updateVerificationStatus,
  deleteUser,
  resendVerificationEmail,
} from '@/app/actions/users';
import { updateUserCommitteeRole } from '@/app/actions/admin';
import { markNotificationActionCompleted } from '@/app/actions/notifications';
import { COMMITTEE_ROLES } from '@/lib/utils/constants';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  role: string;
  admin_role: string | null;
  committee_role: string | null;
  is_in_board: boolean;
  is_in_council: boolean;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

interface PendingUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  phone: string | null;
  created_at: string;
}

interface UsersClientProps {
  users: User[];
  total: number;
  pendingUsers: PendingUser[];
}

export function UsersClient({ users: initialUsers, total: initialTotal, pendingUsers }: UsersClientProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, any>>({});
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [newRole, setNewRole] = React.useState('');
  const [newAdminRole, setNewAdminRole] = React.useState('');

  // Committee role dialog state
  const [committeeDialogOpen, setCommitteeDialogOpen] = React.useState(false);
  const [committeeEditingUser, setCommitteeEditingUser] = React.useState<User | null>(null);
  const [newCommitteeRole, setNewCommitteeRole] = React.useState<string>('none');
  const [newIsInBoard, setNewIsInBoard] = React.useState(false);
  const [newIsInCouncil, setNewIsInCouncil] = React.useState(false);

  // Helper function for committee role badge
  const getCommitteeRoleBadge = (role: string | null) => {
    if (!role) return null;

    const badges: Record<string, { label: string; variant: any; icon: any }> = {
      [COMMITTEE_ROLES.PRESIDENT]: { label: 'Presidente', variant: 'destructive', icon: Crown },
      [COMMITTEE_ROLES.VICE_PRESIDENT]: { label: 'Vice Presidente', variant: 'default', icon: Star },
      [COMMITTEE_ROLES.SECRETARY]: { label: 'Segretario', variant: 'secondary', icon: FileText },
      [COMMITTEE_ROLES.TREASURER]: { label: 'Tesoriere', variant: 'default', icon: DollarSign },
      [COMMITTEE_ROLES.BOARD_MEMBER]: { label: 'Membro Board', variant: 'outline', icon: Users },
      [COMMITTEE_ROLES.COUNCIL_MEMBER]: { label: 'Membro Council', variant: 'outline', icon: Building },
    };

    return badges[role];
  };

  // Filter definition
  const filterFields: FilterField[] = [
    {
      type: 'select',
      key: 'role',
      label: 'Ruolo',
      allowAll: true,
      options: [
        { value: 'user', label: 'Utente' },
        { value: 'admin', label: 'Admin' },
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'inactive', label: 'Inattivo' },
      ],
    },
    {
      type: 'select',
      key: 'verification_status',
      label: 'Verifica',
      allowAll: true,
      options: [
        { value: 'pending', label: 'In attesa' },
        { value: 'approved', label: 'Approvato' },
        { value: 'rejected', label: 'Rifiutato' },
      ],
    },
  ];

  // Table columns
  const columns: DataTableColumn<User>[] = [
    {
      key: 'user',
      header: 'Utente',
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Ruolo',
      hiddenOnMobile: true,
      render: (user) => {
        const roleLabels: Record<string, { label: string; variant: any }> = {
          user: { label: 'Utente', variant: 'secondary' },
          admin: { label: 'Admin', variant: 'default' },
          super_admin: { label: 'Super Admin', variant: 'destructive' },
          inactive: { label: 'Inattivo', variant: 'outline' },
        };
        const role = roleLabels[user.role] || roleLabels.user;
        return <Badge variant={role.variant}>{role.label}</Badge>;
      },
    },
    {
      key: 'committee_role',
      header: 'Ruolo Comitato',
      hiddenOnMobile: true,
      render: (user) => {
        const badge = getCommitteeRoleBadge(user.committee_role);
        if (!badge) return <span className="text-sm text-muted-foreground">—</span>;

        const Icon = badge.icon;
        return (
          <Badge variant={badge.variant} className="text-xs">
            <Icon className="h-3 w-3 mr-1" />
            {badge.label}
          </Badge>
        );
      },
    },
    {
      key: 'board_council',
      header: 'Board/Council',
      hiddenOnMobile: true,
      render: (user) => {
        if (!user.is_in_board && !user.is_in_council) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        return (
          <div className="flex gap-1">
            {user.is_in_board && (
              <Badge variant="default" className="text-xs">Board</Badge>
            )}
            {user.is_in_council && (
              <Badge variant="secondary" className="text-xs">Council</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'verification_status',
      header: 'Verifica',
      hiddenOnMobile: true,
      render: (user) => {
        const statusLabels: Record<string, { label: string; variant: any }> = {
          pending: { label: 'In attesa', variant: 'secondary' },
          approved: { label: 'Verificato', variant: 'default' },
          rejected: { label: 'Rifiutato', variant: 'destructive' },
        };
        const status = statusLabels[user.verification_status] || statusLabels.pending;
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: 'created_at',
      header: 'Registrato',
      hiddenOnMobile: true,
      render: (user) => new Date(user.created_at).toLocaleDateString('it-IT'),
    },
  ];

  // Handle verification status change
  const handleVerify = async (userId: string, status: 'approved' | 'rejected') => {
    const { error } = await updateVerificationStatus(userId, status);
    if (error) {
      toast.error(error);
    } else {
      // Mark related notifications as action_completed
      await markNotificationActionCompleted(undefined, userId);
      toast.success(status === 'approved' ? 'Utente verificato' : 'Verifica rifiutata');
      router.refresh();
    }
  };

  // Handle resend email (welcome for pending, verification for approved/rejected)
  const handleResendEmail = async (user: User) => {
    const { error } = await resendVerificationEmail(user.id);
    if (error) {
      toast.error(error);
    } else {
      const emailType = user.verification_status === 'pending' ? 'benvenuto' : 'verifica';
      toast.success(`Email di ${emailType} reinviata a ${user.email}`);
    }
  };

  // Handle user deletion
  const handleDelete = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;

    const { error } = await deleteUser(userId);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Utente eliminato');
      router.refresh();
    }
  };

  // Handle role update
  const handleUpdateRole = async () => {
    if (!editingUser) return;

    // Convert "none" to null for admin_role
    const adminRoleValue = newAdminRole === 'none' || !newAdminRole ? null : newAdminRole;

    const { error } = await updateUserRole(
      editingUser.id,
      newRole,
      adminRoleValue
    );

    if (error) {
      toast.error(error);
    } else {
      toast.success('Ruolo aggiornato');
      setEditingUser(null);
      router.refresh();
    }
  };

  // Handle committee role update
  const handleUpdateCommitteeRole = async () => {
    if (!committeeEditingUser) return;

    // Convert "none" to null for committee_role
    const committeeRoleValue = newCommitteeRole === 'none' ? null : newCommitteeRole;

    const { error } = await updateUserCommitteeRole(
      committeeEditingUser.id,
      committeeRoleValue,
      newIsInBoard,
      newIsInCouncil
    );

    if (error) {
      toast.error(error);
    } else {
      toast.success('Ruolo comitato aggiornato');
      setCommitteeDialogOpen(false);
      setCommitteeEditingUser(null);
      router.refresh();
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Pending Users Section - "Da verificare" */}
        {pendingUsers.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-amber-900">
                    Da verificare ({pendingUsers.length})
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    Utenti in attesa di verifica identità
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || undefined} alt={user.name || 'User'} />
                        <AvatarFallback className="bg-amber-100 text-amber-700">
                          {getInitials(user.name || user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name || 'Nome non disponibile'}</span>
                          <Badge variant="secondary" className="text-xs">
                            <UserPlus className="mr-1 h-3 w-3" />
                            Nuovo
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email || 'Email non disponibile'}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Registrato {new Date(user.created_at).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleVerify(user.id, 'rejected')}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Rifiuta
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerify(user.id, 'approved')}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Approva
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <FilterPanel
          fields={filterFields}
          filters={filters}
          onFilterChange={setFilters}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cerca per nome o email..."
          title="Filtra utenti"
          description="Filtra gli utenti per ruolo e stato di verifica"
        />

        {/* Users Table */}
        <DataTable
          data={initialUsers}
          columns={columns}
          rowActions={[
            {
              label: 'Modifica ruolo',
              icon: Edit,
              onClick: (user) => {
                setEditingUser(user);
                setNewRole(user.role);
                setNewAdminRole(user.admin_role || 'none');
              },
            },
            {
              label: 'Gestisci comitato',
              icon: Users,
              onClick: (user) => {
                setCommitteeEditingUser(user);
                setNewCommitteeRole(user.committee_role || 'none');
                setNewIsInBoard(user.is_in_board);
                setNewIsInCouncil(user.is_in_council);
                setCommitteeDialogOpen(true);
              },
            },
            {
              label: 'Verifica',
              icon: CheckCircle,
              onClick: (user) => handleVerify(user.id, 'approved'),
              disabled: (user) => user.verification_status === 'approved',
            },
            {
              label: 'Rifiuta verifica',
              icon: XCircle,
              onClick: (user) => handleVerify(user.id, 'rejected'),
              variant: 'destructive',
              disabled: (user) => user.verification_status === 'rejected',
            },
            {
              label: 'Reinvia email',
              icon: Mail,
              onClick: (user) => handleResendEmail(user),
            },
            {
              label: 'Elimina',
              icon: Trash2,
              onClick: (user) => handleDelete(user.id),
              variant: 'destructive',
            },
          ]}
          emptyMessage="Nessun utente trovato"
        />
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Ruolo Utente</DialogTitle>
            <DialogDescription>
              Aggiorna il ruolo e i permessi di {editingUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ruolo Principale</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utente</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newRole === 'admin' || newRole === 'super_admin') && (
              <div className="space-y-2">
                <Label>Ruolo Admin (Opzionale)</Label>
                <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nessuno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuno</SelectItem>
                    <SelectItem value="moderator">Moderatore</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateRole}>
              <Shield className="h-4 w-4 mr-2" />
              Aggiorna Ruolo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Committee Role Dialog */}
      <Dialog open={committeeDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCommitteeDialogOpen(false);
          setCommitteeEditingUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gestione Ruolo Comitato</DialogTitle>
            <DialogDescription>
              Assegna o modifica il ruolo nel comitato per {committeeEditingUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Committee Role Selection */}
            <div className="space-y-3">
              <Label htmlFor="committee-role" className="text-base font-semibold">
                Ruolo nel Comitato
              </Label>
              <Select value={newCommitteeRole} onValueChange={setNewCommitteeRole}>
                <SelectTrigger id="committee-role">
                  <SelectValue placeholder="Seleziona un ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Nessun ruolo
                    </span>
                  </SelectItem>
                  <SelectItem value={COMMITTEE_ROLES.PRESIDENT}>
                    <span className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Presidente
                    </span>
                  </SelectItem>
                  <SelectItem value={COMMITTEE_ROLES.VICE_PRESIDENT}>
                    <span className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Vice Presidente
                    </span>
                  </SelectItem>
                  <SelectItem value={COMMITTEE_ROLES.SECRETARY}>
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Segretario
                    </span>
                  </SelectItem>
                  <SelectItem value={COMMITTEE_ROLES.TREASURER}>
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Tesoriere
                    </span>
                  </SelectItem>
                  <SelectItem value={COMMITTEE_ROLES.BOARD_MEMBER}>
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Membro Consiglio Direttivo
                    </span>
                  </SelectItem>
                  <SelectItem value={COMMITTEE_ROLES.COUNCIL_MEMBER}>
                    <span className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Membro Consiglio Comunale
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                I membri del comitato possono creare e gestire eventi
              </p>
            </div>

            {/* Board & Council Checkboxes */}
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium">Appartenenza Consigli</p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-in-board"
                  checked={newIsInBoard}
                  onCheckedChange={(checked) => setNewIsInBoard(checked as boolean)}
                />
                <Label
                  htmlFor="is-in-board"
                  className="text-sm font-normal cursor-pointer"
                >
                  Membro del Consiglio Direttivo (Board)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-in-council"
                  checked={newIsInCouncil}
                  onCheckedChange={(checked) => setNewIsInCouncil(checked as boolean)}
                />
                <Label
                  htmlFor="is-in-council"
                  className="text-sm font-normal cursor-pointer"
                >
                  Membro del Consiglio Comunale (Council)
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">
                I membri del Board possono creare e votare proposte nella sezione Agorà
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCommitteeDialogOpen(false);
                setCommitteeEditingUser(null);
              }}
            >
              Annulla
            </Button>
            <Button onClick={handleUpdateCommitteeRole}>
              <Users className="h-4 w-4 mr-2" />
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
