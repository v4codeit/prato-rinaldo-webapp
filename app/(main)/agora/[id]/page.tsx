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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProposalTagBadge, ProposalTagBadgeGroup } from '@/components/atoms/proposal-tag-badge';
import {
  Lightbulb,
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Calendar,
  Eye,
  Pencil,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileIcon,
  Users,
  ArrowUp
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

// Status badge configuration with modern colors
const STATUS_CONFIG = {
  proposed: {
    label: 'Proposta',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    icon: Lightbulb,
  },
  under_review: {
    label: 'In Valutazione',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: AlertCircle,
  },
  approved: {
    label: 'Approvata',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-700',
    icon: CheckCircle,
  },
  in_progress: {
    label: 'In Corso',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: Clock,
  },
  completed: {
    label: 'Completata',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    icon: CheckCircle,
  },
  declined: {
    label: 'Rifiutata',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: XCircle,
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

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-violet-600 transition-colors" asChild>
          <Link href={returnTo as any}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {returnTo.includes('feed') || returnTo.includes('bacheca')
              ? 'Torna al Feed'
              : "Torna all'Agorà"}
          </Link>
        </Button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Card */}
            <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm">
              {/* Status & Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} hover:${statusConfig.bgColor} border-none px-3 py-1`}>
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                  {statusConfig.label}
                </Badge>
                {proposal.category && (
                  <Badge
                    style={{ backgroundColor: proposal.category.color || '#0891b2' }}
                    className="text-white border-0 px-3 py-1"
                  >
                    {proposal.category.icon && <span className="mr-1.5">{proposal.category.icon}</span>}
                    {proposal.category.name}
                  </Badge>
                )}
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true, locale: it })}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                {proposal.title}
              </h1>

              {/* Tags */}
              {proposal.tags && proposal.tags.length > 0 && (
                <div className="mb-4">
                  <ProposalTagBadgeGroup>
                    {proposal.tags.map((tag) => (
                      <ProposalTagBadge key={tag.id} tag={tag} />
                    ))}
                  </ProposalTagBadgeGroup>
                </div>
              )}

              {/* Description */}
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-6">
                {proposal.description}
              </p>

              {/* Attachments inline preview */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {attachments.map((attachment: any) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 hover:border-violet-300 transition-colors"
                    >
                      {attachment.file_type.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.file_name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-slate-50">
                          <FileIcon className="h-10 w-10 text-slate-400 mb-2" />
                          <p className="text-xs text-center px-2 line-clamp-2 text-slate-500">{attachment.file_name}</p>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}

              {/* Stats & Actions Footer */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>{proposal.view_count} visualizzazioni</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowUp className={proposal.upvotes > 0 ? 'text-emerald-500 h-4 w-4' : 'h-4 w-4'} />
                    <span className={proposal.upvotes > 0 ? 'text-emerald-600 font-medium' : ''}>
                      {proposal.upvotes} supporti
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canEdit && (
                    <Button variant="outline" size="sm" className="rounded-full" asChild>
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
            </div>

            {/* Decline Reason (if declined) */}
            {proposal.status === 'declined' && proposal.decline_reason && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
                <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5" />
                  Motivo del Rifiuto
                </h3>
                <p className="text-red-600">{proposal.decline_reason}</p>
              </div>
            )}

            {/* Voting Section */}
            {canVote && (
              <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-3xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <ThumbsUp className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Supporta questa proposta</h3>
                    <p className="text-sm text-slate-500">Aiuta questa idea a salire in classifica</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-sm border border-violet-100">
                    <Users className="h-6 w-6 text-violet-500" />
                    <div>
                      <div className="text-2xl font-bold text-violet-700">{proposal.upvotes}</div>
                      <div className="text-xs text-slate-500">
                        {proposal.upvotes === 1 ? 'persona supporta' : 'persone supportano'}
                      </div>
                    </div>
                  </div>

                  <ProposalVoteButtons
                    proposalId={id}
                    hasVoted={userVote}
                  />
                </div>
              </div>
            )}

            {/* Status Timeline */}
            {statusHistory.length > 0 && (
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-6">Cronologia dello Stato</h3>
                <div className="space-y-4">
                  {statusHistory.map((item, index) => {
                    const itemConfig = STATUS_CONFIG[item.new_status as keyof typeof STATUS_CONFIG];
                    const ItemIcon = itemConfig.icon;

                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 ${itemConfig.bgColor}`}>
                            <ItemIcon className={`h-4 w-4 ${itemConfig.textColor}`} />
                          </div>
                          {index < statusHistory.length - 1 && (
                            <div className="w-px h-full bg-slate-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${itemConfig.textColor}`}>{itemConfig.label}</p>
                            <p className="text-sm text-slate-400">
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: it })}
                            </p>
                          </div>
                          {item.reason && (
                            <p className="text-sm text-slate-500 mt-1">{item.reason}</p>
                          )}
                          <p className="text-sm text-slate-400 mt-1">
                            da {getShortName(item.changed_by_user.name)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-slate-50 rounded-3xl p-6 md:p-8">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Discussione ({comments.length})
              </h3>

              {/* Comment Form */}
              <div className="mb-6">
                <ProposalCommentForm proposalId={id} />
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">
                    Nessun commento ancora. Sii il primo a commentare!
                  </p>
                ) : (
                  comments.map((comment) => {
                    const isCommentOwner = resident.id === comment.user_id;
                    const canDeleteComment = isCommentOwner || isAdmin;

                    return (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={comment.user.avatar || undefined} />
                          <AvatarFallback className="bg-slate-200 text-slate-600">
                            {getInitials(comment.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-sm text-slate-900">
                                {getShortName(comment.user.name)}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: it })}
                                </span>
                                {canDeleteComment && (
                                  <ProposalCommentDeleteButton commentId={comment.id} />
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wide mb-4">Proposta da</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={proposal.author.avatar || undefined} />
                  <AvatarFallback className="bg-violet-100 text-violet-700">
                    {getInitials(proposal.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-slate-900">{getShortName(proposal.author.name)}</p>
                  {proposal.author.bio && (
                    <p className="text-sm text-slate-500 line-clamp-2">{proposal.author.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wide mb-4">Statistiche</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <ArrowUp className="h-4 w-4" /> Supporti
                  </span>
                  <span className="font-bold text-slate-900">{proposal.upvotes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Visualizzazioni
                  </span>
                  <span className="font-bold text-slate-900">{proposal.view_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" /> Commenti
                  </span>
                  <span className="font-bold text-slate-900">{comments.length}</span>
                </div>
              </div>
            </div>

            {/* Attachments Card (if any) */}
            {attachments.length > 0 && (
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wide mb-4">
                  Allegati ({attachments.length})
                </h3>
                <div className="space-y-2">
                  {attachments.map((attachment: any) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                    >
                      <div className={`p-2 rounded-lg ${attachment.file_type.startsWith('image/') ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                        {attachment.file_type.startsWith('image/') ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-bold">PDF</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{attachment.file_name}</p>
                        <p className="text-xs text-slate-400">Clicca per aprire</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
