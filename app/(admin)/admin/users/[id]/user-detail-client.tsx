'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Route } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  Users,
  Shield,
  Crown,
  Star,
  FileText,
  DollarSign,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Award,
  MessageSquare,
  ShoppingBag,
  Hash,
  Activity,
  Send,
  Eye,
  Baby,
  Accessibility,
  Vote,
} from 'lucide-react';
import { getInitials } from '@/lib/utils/format';
import { ROUTES, COMMITTEE_ROLES } from '@/lib/utils/constants';
import {
  updateUserRole,
  updateVerificationStatus,
  deleteUser,
  resendVerificationEmail,
} from '@/app/actions/users';
import { updateUserCommitteeRole } from '@/app/actions/admin';
import { markNotificationActionCompleted } from '@/app/actions/notifications';
import type { AdminUserDetail, UserActivitySummary } from '@/app/actions/users';

// ── Label Maps ─────────────────────────────────────────────────────

const MEMBERSHIP_TYPE_LABELS: Record<string, string> = {
  resident: 'Residente',
  domiciled: 'Domiciliato',
  landowner: 'Proprietario Terriero',
};

const MUNICIPALITY_LABELS: Record<string, string> = {
  san_cesareo: 'San Cesareo',
  zagarolo: 'Zagarolo',
};

const ROLE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  user: { label: 'Utente', variant: 'secondary' },
  admin: { label: 'Admin', variant: 'default' },
  super_admin: { label: 'Super Admin', variant: 'destructive' },
};

const ADMIN_ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderatore',
};

const VERIFICATION_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; color: string }> = {
  pending: { label: 'In Attesa', variant: 'secondary', color: 'text-amber-600' },
  approved: { label: 'Verificato', variant: 'default', color: 'text-green-600' },
  rejected: { label: 'Rifiutato', variant: 'destructive', color: 'text-red-600' },
};

const COMMITTEE_ROLE_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  [COMMITTEE_ROLES.PRESIDENT]: { label: 'Presidente', icon: Crown },
  [COMMITTEE_ROLES.VICE_PRESIDENT]: { label: 'Vice Presidente', icon: Star },
  [COMMITTEE_ROLES.SECRETARY]: { label: 'Segretario', icon: FileText },
  [COMMITTEE_ROLES.TREASURER]: { label: 'Tesoriere', icon: DollarSign },
  [COMMITTEE_ROLES.BOARD_MEMBER]: { label: 'Membro Board', icon: Users },
  [COMMITTEE_ROLES.COUNCIL_MEMBER]: { label: 'Membro Council', icon: Building },
};

// ── Helper Components ──────────────────────────────────────────────

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium mt-0.5">
          {value || <span className="text-muted-foreground italic">Non specificato</span>}
        </dd>
      </div>
    </div>
  );
}

function ActivityTile({
  icon: Icon,
  count,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <div className="text-lg font-semibold leading-none">{count}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// ── Date Formatting ────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Main Component ─────────────────────────────────────────────────

interface UserDetailClientProps {
  user: AdminUserDetail;
  activity: UserActivitySummary;
  badges: any[];
  points: { totalPoints: number; level: number };
}

export function UserDetailClient({ user, activity, badges, points }: UserDetailClientProps) {
  const router = useRouter();

  // Role dialog state
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [newRole, setNewRole] = React.useState(user.role);
  const [newAdminRole, setNewAdminRole] = React.useState(user.admin_role || 'none');

  // Committee dialog state
  const [committeeDialogOpen, setCommitteeDialogOpen] = React.useState(false);
  const [newCommitteeRole, setNewCommitteeRole] = React.useState(user.committee_role || 'none');
  const [newIsInBoard, setNewIsInBoard] = React.useState(user.is_in_board);
  const [newIsInCouncil, setNewIsInCouncil] = React.useState(user.is_in_council);

  // Action loading states
  const [isDeleting, setIsDeleting] = React.useState(false);

  const verification = VERIFICATION_LABELS[user.verification_status] || VERIFICATION_LABELS.pending;
  const role = ROLE_LABELS[user.role] || ROLE_LABELS.user;

  // ── Handlers ──

  const handleVerify = async (status: 'approved' | 'rejected') => {
    const { error } = await updateVerificationStatus(user.id, status);
    if (error) {
      toast.error(error);
    } else {
      await markNotificationActionCompleted(undefined, user.id);
      toast.success(status === 'approved' ? 'Utente verificato' : 'Verifica rifiutata');
      router.refresh();
    }
  };

  const handleUpdateRole = async () => {
    const adminRoleValue = newAdminRole === 'none' || !newAdminRole ? null : newAdminRole;
    const { error } = await updateUserRole(user.id, newRole, adminRoleValue);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Ruolo aggiornato');
      setRoleDialogOpen(false);
      router.refresh();
    }
  };

  const handleUpdateCommitteeRole = async () => {
    const committeeRoleValue = newCommitteeRole === 'none' ? null : newCommitteeRole;
    const { error } = await updateUserCommitteeRole(
      user.id,
      committeeRoleValue,
      newIsInBoard,
      newIsInCouncil,
    );
    if (error) {
      toast.error(error);
    } else {
      toast.success('Ruolo comitato aggiornato');
      setCommitteeDialogOpen(false);
      router.refresh();
    }
  };

  const handleResendEmail = async () => {
    const { error } = await resendVerificationEmail(user.id);
    if (error) {
      toast.error(error);
    } else {
      const emailType = user.verification_status === 'pending' ? 'benvenuto' : 'verifica';
      toast.success(`Email di ${emailType} reinviata a ${user.email}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo utente? Questa azione non e reversibile.')) return;
    setIsDeleting(true);
    const { error } = await deleteUser(user.id);
    if (error) {
      toast.error(error);
      setIsDeleting(false);
    } else {
      toast.success('Utente eliminato');
      router.push(ROUTES.ADMIN_USERS as Route);
    }
  };

  // ── Address helper ──

  const fullAddress = [user.street, user.street_number].filter(Boolean).join(', ');
  const fullAddressWithZip = [fullAddress, user.zip_code].filter(Boolean).join(' - ');

  return (
    <>
      <div className="space-y-6">
        {/* ── Header Card ── */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <Avatar className="h-20 w-20 flex-shrink-0">
                <AvatarImage src={user.avatar || undefined} alt={user.name || 'Utente'} />
                <AvatarFallback className="text-xl">
                  {getInitials(user.name || user.email || 'U')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2 text-center md:text-left">
                <h1 className="text-2xl font-bold">{user.name || 'Nome non disponibile'}</h1>

                <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground md:flex-row md:gap-3">
                  {user.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </span>
                  )}
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {user.phone}
                    </span>
                  )}
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap justify-center gap-2 pt-1 md:justify-start">
                  <Badge variant={verification.variant}>{verification.label}</Badge>
                  <Badge variant={role.variant}>{role.label}</Badge>
                  {user.admin_role && (
                    <Badge variant="outline">{ADMIN_ROLE_LABELS[user.admin_role] || user.admin_role}</Badge>
                  )}
                  {user.committee_role && COMMITTEE_ROLE_LABELS[user.committee_role] && (
                    <Badge variant="secondary">
                      {React.createElement(COMMITTEE_ROLE_LABELS[user.committee_role].icon, { className: 'h-3 w-3 mr-1' })}
                      {COMMITTEE_ROLE_LABELS[user.committee_role].label}
                    </Badge>
                  )}
                  {user.is_in_board && <Badge variant="default">Board</Badge>}
                  {user.is_in_council && <Badge variant="secondary">Council</Badge>}
                </div>

                {/* Date info */}
                <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground md:flex-row md:gap-3 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Registrato: {formatDate(user.created_at) || '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Ultimo accesso: {formatDate(user.last_signed_in) || '—'}
                  </span>
                </div>

                {/* Actions */}
                <Separator className="my-3" />
                <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleVerify('approved')}
                    disabled={user.verification_status === 'approved'}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approva
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleVerify('rejected')}
                    disabled={user.verification_status === 'rejected'}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rifiuta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNewRole(user.role);
                      setNewAdminRole(user.admin_role || 'none');
                      setRoleDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Ruolo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNewCommitteeRole(user.committee_role || 'none');
                      setNewIsInBoard(user.is_in_board);
                      setNewIsInCouncil(user.is_in_council);
                      setCommitteeDialogOpen(true);
                    }}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Comitato
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleResendEmail}>
                    <Send className="h-4 w-4 mr-1" />
                    Reinvia Email
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {isDeleting ? 'Eliminando...' : 'Elimina'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ── Left Column ── */}
          <div className="space-y-6">
            {/* Profilo Personale */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profilo Personale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1">
                  <InfoRow label="Nome" value={user.name} icon={User} />
                  <InfoRow label="Email" value={user.email} icon={Mail} />
                  <InfoRow label="Telefono" value={user.phone} icon={Phone} />
                  <InfoRow
                    label="Bio"
                    value={
                      user.bio ? (
                        <p className="text-sm whitespace-pre-wrap">{user.bio}</p>
                      ) : null
                    }
                    icon={FileText}
                  />
                </dl>
              </CardContent>
            </Card>

            {/* Residenza */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Residenza
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1">
                  <InfoRow
                    label="Tipo Associazione"
                    value={
                      user.membership_type
                        ? MEMBERSHIP_TYPE_LABELS[user.membership_type] || user.membership_type
                        : null
                    }
                    icon={Hash}
                  />
                  <InfoRow label="Indirizzo" value={fullAddress || null} icon={MapPin} />
                  <InfoRow label="CAP" value={user.zip_code} icon={MapPin} />
                  <InfoRow
                    label="Comune"
                    value={
                      user.municipality
                        ? MUNICIPALITY_LABELS[user.municipality] || user.municipality
                        : null
                    }
                    icon={Building}
                  />
                </dl>
              </CardContent>
            </Card>

            {/* Nucleo Familiare */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Nucleo Familiare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1">
                  <InfoRow
                    label="Componenti Nucleo"
                    value={user.household_size != null ? String(user.household_size) : null}
                    icon={Users}
                  />
                  <InfoRow
                    label="Minori"
                    value={
                      user.has_minors
                        ? `Si${user.minors_count != null ? ` (${user.minors_count})` : ''}`
                        : user.has_minors === false
                          ? 'No'
                          : null
                    }
                    icon={Baby}
                  />
                  <InfoRow
                    label="Anziani"
                    value={
                      user.has_seniors
                        ? `Si${user.seniors_count != null ? ` (${user.seniors_count})` : ''}`
                        : user.has_seniors === false
                          ? 'No'
                          : null
                    }
                    icon={Accessibility}
                  />
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-6">
            {/* Ruoli e Permessi */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Ruoli e Permessi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1">
                  <InfoRow
                    label="Ruolo Principale"
                    value={<Badge variant={role.variant}>{role.label}</Badge>}
                    icon={Shield}
                  />
                  <InfoRow
                    label="Ruolo Admin"
                    value={
                      user.admin_role ? (
                        <Badge variant="outline">{ADMIN_ROLE_LABELS[user.admin_role] || user.admin_role}</Badge>
                      ) : null
                    }
                    icon={Shield}
                  />
                  <InfoRow
                    label="Ruolo Comitato"
                    value={
                      user.committee_role && COMMITTEE_ROLE_LABELS[user.committee_role] ? (
                        <Badge variant="secondary">
                          {React.createElement(COMMITTEE_ROLE_LABELS[user.committee_role].icon, { className: 'h-3 w-3 mr-1' })}
                          {COMMITTEE_ROLE_LABELS[user.committee_role].label}
                        </Badge>
                      ) : null
                    }
                    icon={Crown}
                  />
                  <InfoRow
                    label="Membro Board"
                    value={user.is_in_board ? 'Si' : 'No'}
                    icon={Users}
                  />
                  <InfoRow
                    label="Membro Council"
                    value={user.is_in_council ? 'Si' : 'No'}
                    icon={Building}
                  />
                </dl>
              </CardContent>
            </Card>

            {/* Attivita */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Attivita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <ActivityTile icon={FileText} count={activity.articles} label="Articoli" />
                  <ActivityTile icon={Calendar} count={activity.events} label="Eventi" />
                  <ActivityTile icon={Vote} count={activity.proposals} label="Proposte" />
                  <ActivityTile icon={ShoppingBag} count={activity.marketplace_items} label="Mercatino" />
                  <ActivityTile icon={Hash} count={activity.topic_memberships} label="Topic" />
                  <ActivityTile icon={MessageSquare} count={activity.topic_messages} label="Messaggi" />
                  <ActivityTile icon={MessageSquare} count={activity.proposal_comments} label="Commenti" />
                  <ActivityTile icon={Eye} count={activity.proposal_votes} label="Voti" />
                </div>
              </CardContent>
            </Card>

            {/* Badge e Punti */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Badge e Punti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Livello {points.level}</div>
                    <div className="text-sm text-muted-foreground">{points.totalPoints} punti totali</div>
                  </div>
                </div>

                {badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nessun badge ottenuto</p>
                ) : (
                  <div className="space-y-2">
                    {badges.map((ub: any) => (
                      <div
                        key={ub.id || ub.badge_id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-lg">
                          {ub.badge?.icon || '🏅'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{ub.badge?.name || 'Badge'}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {ub.badge?.description || ''}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex-shrink-0">
                          {ub.earned_at ? formatDate(ub.earned_at) : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sistema */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1">
                  <InfoRow
                    label="Onboarding Completato"
                    value={user.onboarding_completed ? 'Si' : 'No'}
                    icon={CheckCircle}
                  />
                  <InfoRow
                    label="Step Onboarding"
                    value={String(user.onboarding_step)}
                    icon={Hash}
                  />
                  <InfoRow
                    label="Data Creazione"
                    value={formatDateTime(user.created_at)}
                    icon={Calendar}
                  />
                  <InfoRow
                    label="Ultimo Aggiornamento"
                    value={formatDateTime(user.updated_at)}
                    icon={Clock}
                  />
                  <InfoRow
                    label="Ultimo Accesso"
                    value={formatDateTime(user.last_signed_in)}
                    icon={Clock}
                  />
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Edit Role Dialog ── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Ruolo Utente</DialogTitle>
            <DialogDescription>
              Aggiorna il ruolo e i permessi di {user.name}
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
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateRole}>
              <Shield className="h-4 w-4 mr-2" />
              Aggiorna Ruolo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Committee Role Dialog ── */}
      <Dialog open={committeeDialogOpen} onOpenChange={setCommitteeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gestione Ruolo Comitato</DialogTitle>
            <DialogDescription>
              Assegna o modifica il ruolo nel comitato per {user.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
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

            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium">Appartenenza Consigli</p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-in-board"
                  checked={newIsInBoard}
                  onCheckedChange={(checked) => setNewIsInBoard(checked as boolean)}
                />
                <Label htmlFor="is-in-board" className="text-sm font-normal cursor-pointer">
                  Membro del Consiglio Direttivo (Board)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-in-council"
                  checked={newIsInCouncil}
                  onCheckedChange={(checked) => setNewIsInCouncil(checked as boolean)}
                />
                <Label htmlFor="is-in-council" className="text-sm font-normal cursor-pointer">
                  Membro del Consiglio Comunale (Council)
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">
                I membri del Board possono creare e votare proposte nella sezione Agora
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCommitteeDialogOpen(false)}>
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
