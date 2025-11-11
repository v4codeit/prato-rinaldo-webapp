import { notFound } from 'next/navigation';
import { requireVerifiedResident } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import {
  getProposalById,
  getProposalComments,
  getUserVote,
  getProposalStatusHistory
} from '@/app/actions/proposals';
import { getProposalAttachments } from '@/app/actions/storage';
import { ROUTES } from '@/lib/utils/constants';
import { getShortName, getInitials } from '@/lib/utils/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Lightbulb,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileIcon
} from 'lucide-react';
import Link from 'next/link';
import { ProposalVoteButtons } from './proposal-vote-buttons';
import { ProposalCommentForm } from './proposal-comment-form';
import { ProposalDeleteButton } from './proposal-delete-button';
import { ProposalCommentDeleteButton } from './proposal-comment-delete-button';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { proposal } = await getProposalById(id);

  if (!proposal) {
    return {
      title: 'Proposta non trovata',
    };
  }

  return {
    title: proposal.title,
    description: proposal.description.substring(0, 160),
  };
}

// Status badge configuration
const STATUS_CONFIG = {
  proposed: {
    label: 'Proposta',
    variant: 'secondary' as const,
    icon: Lightbulb,
    color: 'text-blue-600',
  },
  under_review: {
    label: 'In Revisione',
    variant: 'default' as const,
    icon: AlertCircle,
    color: 'text-yellow-600',
  },
  approved: {
    label: 'Approvata',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  in_progress: {
    label: 'In Corso',
    variant: 'default' as const,
    icon: Clock,
    color: 'text-purple-600',
  },
  completed: {
    label: 'Completata',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-700',
  },
  declined: {
    label: 'Rifiutata',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
  },
};

export default async function ProposalDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  // Require verified resident (redirects if not authenticated/verified)
  const resident = await requireVerifiedResident();

  const { id } = await params;
  const search = await searchParams;
  const returnTo = search.returnTo || ROUTES.AGORA;

  // Get user profile to check admin role
  const supabase = await createClient();
  const { data: userProfile } = await supabase
    .from('users')
    .select('admin_role')
    .eq('id', resident.id)
    .single();

  const isAdmin = userProfile?.admin_role && ['admin', 'super_admin', 'moderator'].includes(userProfile.admin_role);

  // Load proposal
  const { proposal } = await getProposalById(id);

  if (!proposal) {
    notFound();
  }

  // Load comments
  const { comments } = await getProposalComments(id);

  // Load user's vote
  const { vote: userVote } = await getUserVote(id);

  // Load status history (if not proposed)
  const { history: statusHistory } = proposal.status !== 'proposed'
    ? await getProposalStatusHistory(id)
    : { history: [] };

  // Load attachments
  const { attachments } = await getProposalAttachments(id);

  // Check if current user is the author
  const isAuthor = resident.id === proposal.author_id;

  // Can edit: author + status === 'proposed'
  const canEdit = isAuthor && proposal.status === 'proposed';

  // Can delete: author + status in ['proposed', 'declined']
  const canDelete = isAuthor && ['proposed', 'declined'].includes(proposal.status);

  // Can vote: status !== 'declined'
  const canVote = proposal.status !== 'declined';

  const statusConfig = STATUS_CONFIG[proposal.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;

  // Get category icon component
  const getCategoryIcon = (iconName: string | null | undefined) => {
    if (!iconName) return null;
    // For simplicity, return the icon name - you can map this to actual icon components
    return iconName;
  };

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href={returnTo as any}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {returnTo.includes('feed') || returnTo.includes('bacheca')
              ? 'Torna al Feed'
              : "Torna all'Agorà"}
          </Link>
        </Button>

        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Badge */}
                  {proposal.category && (
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: proposal.category.color || undefined,
                        color: proposal.category.color || undefined
                      }}
                    >
                      {proposal.category.icon && (
                        <span className="mr-1">{proposal.category.icon}</span>
                      )}
                      {proposal.category.name}
                    </Badge>
                  )}

                  {/* Status Badge */}
                  <Badge variant={statusConfig.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                <h1 className="text-3xl font-bold">{proposal.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(proposal.created_at), {
                        addSuffix: true,
                        locale: it
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{proposal.view_count} visualizzazioni</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`${ROUTES.AGORA}/${id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifica
                    </Link>
                  </Button>
                )}
                {canDelete && (
                  <ProposalDeleteButton proposalId={id} />
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Author Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proposta da</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={proposal.author.avatar || undefined} />
                <AvatarFallback>
                  {getInitials(proposal.author.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{getShortName(proposal.author.name)}</p>
                {proposal.author.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {proposal.author.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description Card */}
        <Card>
          <CardHeader>
            <CardTitle>Descrizione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap">{proposal.description}</p>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-3">Allegati ({attachments.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachments.map((attachment: any) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                    >
                      {attachment.file_type.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.file_name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-muted">
                          <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-xs text-center px-2 line-clamp-2">{attachment.file_name}</p>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decline Reason (if declined) */}
        {proposal.status === 'declined' && proposal.decline_reason && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Motivo del Rifiuto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{proposal.decline_reason}</p>
            </CardContent>
          </Card>
        )}

        {/* Voting Card */}
        {canVote && (
          <Card>
            <CardHeader>
              <CardTitle>Vota questa proposta</CardTitle>
              <CardDescription>
                Esprimi il tuo supporto o le tue perplessità
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Vote Stats */}
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
                      <ThumbsUp className="h-6 w-6" />
                      {proposal.upvotes}
                    </div>
                    <p className="text-sm text-muted-foreground">Favorevoli</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-red-600">
                      <ThumbsDown className="h-6 w-6" />
                      {proposal.downvotes}
                    </div>
                    <p className="text-sm text-muted-foreground">Contrari</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {proposal.score}
                    </div>
                    <p className="text-sm text-muted-foreground">Punteggio</p>
                  </div>
                </div>

                {/* Vote Buttons */}
                <ProposalVoteButtons
                  proposalId={id}
                  userVote={userVote}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        {statusHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cronologia dello Stato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusHistory.map((item, index) => {
                  const itemConfig = STATUS_CONFIG[item.new_status as keyof typeof STATUS_CONFIG];
                  const ItemIcon = itemConfig.icon;

                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`rounded-full p-2 ${itemConfig.color} bg-muted`}>
                          <ItemIcon className="h-4 w-4" />
                        </div>
                        {index < statusHistory.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{itemConfig.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                              locale: it
                            })}
                          </p>
                        </div>
                        {item.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.reason}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          da {getShortName(item.changed_by_user.name)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Commenti ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Comment Form */}
            <ProposalCommentForm proposalId={id} />

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun commento ancora. Sii il primo a commentare!
                </p>
              ) : (
                comments.map((comment) => {
                  const isCommentOwner = resident.id === comment.user_id;
                  const canDeleteComment = isCommentOwner || isAdmin;

                  return (
                    <div key={comment.id} className="flex gap-3 border-t pt-4 first:border-t-0 first:pt-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.avatar || undefined} />
                        <AvatarFallback>
                          {getInitials(comment.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{getShortName(comment.user.name)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: it
                              })}
                            </p>
                          </div>
                          {canDeleteComment && (
                            <ProposalCommentDeleteButton commentId={comment.id} />
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
