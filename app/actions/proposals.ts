'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const createProposalSchema = z.object({
  title: z.string().min(10, 'Il titolo deve contenere almeno 10 caratteri').max(500),
  description: z.string().min(50, 'La descrizione deve contenere almeno 50 caratteri'),
  categoryId: z.string().uuid(),
});

const createCommentSchema = z.object({
  content: z.string().min(10, 'Il commento deve contenere almeno 10 caratteri'),
});

const updateProposalStatusSchema = z.object({
  status: z.enum(['proposed', 'under_review', 'approved', 'in_progress', 'completed', 'declined']),
  reason: z.string().optional(),
  plannedDate: z.string().optional(),
  completedDate: z.string().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// =====================================================
// TYPES
// =====================================================

export type ProposalStatus = 'proposed' | 'under_review' | 'approved' | 'in_progress' | 'completed' | 'declined';

export type ProposalCategory = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  order_index: number;
};

export type ProposalAuthor = {
  id: string;
  name: string;
  avatar?: string | null;
  bio?: string | null;
};

export type Proposal = {
  id: string;
  tenant_id: string;
  category_id: string;
  author_id: string;
  title: string;
  description: string;
  status: ProposalStatus;
  upvotes: number;
  downvotes: number;
  score: number;
  view_count: number;
  decline_reason?: string | null;
  planned_date?: string | null;
  completed_date?: string | null;
  created_at: string;
  updated_at: string;
  author: ProposalAuthor;
  category: ProposalCategory;
};

export type ProposalComment = {
  id: string;
  tenant_id: string;
  proposal_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: ProposalAuthor;
};

export type ProposalStatusHistoryItem = {
  id: string;
  proposal_id: string;
  new_status: ProposalStatus;
  changed_by: string;
  reason?: string | null;
  created_at: string;
  changed_by_user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
};

// =====================================================
// CATEGORIES
// =====================================================

/**
 * Get all proposal categories
 */
export async function getProposalCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('proposal_categories')
    .select('id, name, icon, color, description, order_index')
    .order('order_index', { ascending: true });

  if (error) {
    return { categories: [] as ProposalCategory[] };
  }

  return { categories: (data || []) as unknown as ProposalCategory[] };
}

/**
 * Get category by ID
 */
export async function getCategoryById(categoryId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('proposal_categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (error) {
    return { category: null };
  }

  return { category: data };
}

/**
 * Create new category (admin only)
 */
export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('admin_role, tenant_id')
    .eq('id', user.id)
    .single() as { data: { admin_role: string | null; tenant_id: string } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.admin_role || '')) {
    return { error: 'Solo gli amministratori possono creare categorie' };
  }

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    icon: formData.get('icon') as string || undefined,
    color: formData.get('color') as string || '#0891b2',
  };

  const parsed = createCategorySchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  // Get max order_index
  const { data: maxOrder } = await supabase
    .from('proposal_categories')
    .select('order_index')
    .eq('tenant_id', profile.tenant_id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single() as { data: { order_index: number } | null };

  const categoryId = nanoid();

  const { error } = await supabase.from('proposal_categories').insert({
    id: categoryId,
    tenant_id: profile.tenant_id,
    name: parsed.data.name,
    description: parsed.data.description,
    icon: parsed.data.icon,
    color: parsed.data.color,
    order_index: (maxOrder?.order_index || 0) + 1,
  });

  if (error) {
    return { error: 'Errore durante la creazione della categoria' };
  }

  revalidatePath('/agora');
  revalidatePath('/admin/agora/categories');
  return { success: true, categoryId };
}

/**
 * Update category (admin only)
 */
export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('admin_role')
    .eq('id', user.id)
    .single() as { data: { admin_role: string | null } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.admin_role || '')) {
    return { error: 'Solo gli amministratori possono modificare categorie' };
  }

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    icon: formData.get('icon') as string || undefined,
    color: formData.get('color') as string || undefined,
  };

  const parsed = createCategorySchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const { error } = await supabase
    .from('proposal_categories')
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      icon: parsed.data.icon,
      color: parsed.data.color,
    })
    .eq('id', categoryId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento della categoria' };
  }

  revalidatePath('/agora');
  revalidatePath('/admin/agora/categories');
  return { success: true };
}

/**
 * Delete category (admin only)
 */
export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('admin_role')
    .eq('id', user.id)
    .single() as { data: { admin_role: string | null } | null };

  if (!profile || !['admin', 'super_admin'].includes(profile.admin_role || '')) {
    return { error: 'Solo gli amministratori possono eliminare categorie' };
  }

  // Check if category has proposals
  const { count } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (count && count > 0) {
    return { error: 'Impossibile eliminare una categoria che contiene proposte' };
  }

  const { error } = await supabase
    .from('proposal_categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    return { error: 'Errore durante l\'eliminazione della categoria' };
  }

  revalidatePath('/agora');
  revalidatePath('/admin/agora/categories');
  return { success: true };
}

// =====================================================
// PROPOSALS
// =====================================================

/**
 * Get proposals with filters and pagination
 */
export async function getProposals(params: {
  categoryId?: string;
  status?: ProposalStatus;
  sortBy?: 'score' | 'created_at';
  page?: number;
  limit?: number;
} = {}) {
  const supabase = await createClient();

  const {
    categoryId,
    status,
    sortBy = 'score',
    page = 1,
    limit = 20,
  } = params;

  const offset = (page - 1) * limit;

  let query = supabase
    .from('proposals')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar
      ),
      category:proposal_categories!category_id (
        id,
        name,
        icon,
        color
      )
    `, { count: 'exact' });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (sortBy === 'score') {
    query = query.order('score', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { proposals: [], total: 0 };
  }

  return { proposals: (data || []) as unknown as Proposal[], total: count || 0 };
}

/**
 * Get proposal by ID with full details
 */
export async function getProposalById(proposalId: string) {
  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar,
        bio
      ),
      category:proposal_categories!category_id (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('id', proposalId)
    .single();

  if (error || !proposal) {
    return { proposal: null };
  }

  const typedProposal = proposal as unknown as Proposal;

  // Increment view count
  await supabase
    .from('proposals')
    .update({ view_count: typedProposal.view_count + 1 })
    .eq('id', proposalId);

  return { proposal: { ...typedProposal, view_count: typedProposal.view_count + 1 } as Proposal };
}

/**
 * Get roadmap proposals (approved, in_progress, completed)
 */
export async function getRoadmapProposals() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('proposals')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        avatar
      ),
      category:proposal_categories!category_id (
        id,
        name,
        icon,
        color
      )
    `)
    .in('status', ['approved', 'in_progress', 'completed'])
    .order('score', { ascending: false });

  if (error) {
    return { proposals: [] };
  }

  const typedData = (data || []) as unknown as Proposal[];

  // Group by status
  const approved = typedData.filter(p => p.status === 'approved');
  const inProgress = typedData.filter(p => p.status === 'in_progress');
  const completed = typedData.filter(p => p.status === 'completed');

  return {
    proposals: typedData,
    approved,
    inProgress,
    completed,
  };
}

/**
 * Create new proposal (verified residents only)
 */
export async function createProposal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is verified
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status, tenant_id')
    .eq('id', user.id)
    .single() as { data: { verification_status: string; tenant_id: string } | null };

  if (!profile || profile.verification_status !== 'approved') {
    return { error: 'Solo i residenti verificati possono creare proposte' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    categoryId: formData.get('categoryId') as string,
  };

  const parsed = createProposalSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const proposalId = nanoid();

  const { error } = await supabase.from('proposals').insert({
    id: proposalId,
    tenant_id: profile.tenant_id,
    category_id: parsed.data.categoryId,
    author_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    status: 'proposed',
    upvotes: 0,
    downvotes: 0,
    view_count: 0,
  });

  if (error) {
    return { error: 'Errore durante la creazione della proposta' };
  }

  revalidatePath('/agora');
  return { success: true, proposalId };
}

/**
 * Update proposal status (admin/board only)
 */
export async function updateProposalStatus(proposalId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is admin or board member
  const { data: profile } = await supabase
    .from('users')
    .select('admin_role, is_in_board')
    .eq('id', user.id)
    .single() as { data: { admin_role: string | null; is_in_board: boolean } | null };

  const canUpdate = profile && (
    ['admin', 'super_admin', 'moderator'].includes(profile.admin_role || '') ||
    profile.is_in_board
  );

  if (!canUpdate) {
    return { error: 'Solo amministratori e membri del comitato possono cambiare lo stato' };
  }

  const rawData = {
    status: formData.get('status') as string,
    reason: formData.get('reason') as string || undefined,
    plannedDate: formData.get('plannedDate') as string || undefined,
    completedDate: formData.get('completedDate') as string || undefined,
  };

  const parsed = updateProposalStatusSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const updateData: any = {
    status: parsed.data.status,
  };

  if (parsed.data.status === 'approved' && parsed.data.plannedDate) {
    updateData.planned_date = parsed.data.plannedDate;
  }

  if (parsed.data.status === 'completed' && parsed.data.completedDate) {
    updateData.completed_date = parsed.data.completedDate;
  }

  if (parsed.data.status === 'declined' && parsed.data.reason) {
    updateData.decline_reason = parsed.data.reason;
  }

  const { error } = await supabase
    .from('proposals')
    .update(updateData)
    .eq('id', proposalId);

  if (error) {
    return { error: 'Errore durante l\'aggiornamento dello stato' };
  }

  // Log status change
  await supabase.from('proposal_status_history').insert({
    id: nanoid(),
    proposal_id: proposalId,
    new_status: parsed.data.status,
    changed_by: user.id,
    reason: parsed.data.reason,
  });

  revalidatePath('/agora');
  revalidatePath(`/agora/${proposalId}`);
  revalidatePath('/agora/roadmap');
  return { success: true };
}

// =====================================================
// VOTING
// =====================================================

/**
 * Get user's vote for a proposal
 */
export async function getUserVote(proposalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { vote: null };
  }

  const { data, error } = await supabase
    .from('proposal_votes')
    .select('vote_type')
    .eq('proposal_id', proposalId)
    .eq('user_id', user.id)
    .single() as { data: { vote_type: 'up' | 'down' } | null; error: any };

  if (error) {
    return { vote: null };
  }

  return { vote: data?.vote_type || null };
}

/**
 * Vote on proposal (verified residents only)
 * If user already voted the same type, remove vote
 * If user voted different type, switch vote
 */
export async function voteProposal(proposalId: string, voteType: 'up' | 'down') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Check if user is verified
  const { data: profile } = await supabase
    .from('users')
    .select('verification_status')
    .eq('id', user.id)
    .single() as { data: { verification_status: string } | null };

  if (!profile || profile.verification_status !== 'approved') {
    return { error: 'Solo i residenti verificati possono votare' };
  }

  // Check existing vote
  const { data: existingVote } = await supabase
    .from('proposal_votes')
    .select('vote_type')
    .eq('proposal_id', proposalId)
    .eq('user_id', user.id)
    .single() as { data: { vote_type: 'up' | 'down' } | null };

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Remove vote (toggle off)
      const { error } = await supabase
        .from('proposal_votes')
        .delete()
        .eq('proposal_id', proposalId)
        .eq('user_id', user.id);

      if (error) {
        return { error: 'Errore durante la rimozione del voto' };
      }
    } else {
      // Switch vote
      const { error } = await supabase
        .from('proposal_votes')
        .update({ vote_type: voteType })
        .eq('proposal_id', proposalId)
        .eq('user_id', user.id);

      if (error) {
        return { error: 'Errore durante il cambio del voto' };
      }
    }
  } else {
    // New vote
    const { error } = await supabase.from('proposal_votes').insert({
      id: nanoid(),
      proposal_id: proposalId,
      user_id: user.id,
      vote_type: voteType,
    });

    if (error) {
      return { error: 'Errore durante la votazione' };
    }
  }

  revalidatePath(`/agora/${proposalId}`);
  revalidatePath('/agora');
  return { success: true };
}

// =====================================================
// COMMENTS
// =====================================================

/**
 * Get comments for a proposal
 */
export async function getProposalComments(proposalId: string, page: number = 1, limit: number = 50) {
  const supabase = await createClient();

  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('proposal_comments')
    .select(`
      *,
      user:users!user_id (
        id,
        name,
        avatar,
        bio
      )
    `, { count: 'exact' })
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return { comments: [], total: 0 };
  }

  return { comments: (data || []) as unknown as ProposalComment[], total: count || 0 };
}

/**
 * Create comment (all registered users)
 */
export async function createComment(proposalId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single() as { data: { tenant_id: string } | null };

  if (!profile) {
    return { error: 'Profilo non trovato' };
  }

  const rawData = {
    content: formData.get('content') as string,
  };

  const parsed = createCommentSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Dati non validi' };
  }

  const commentId = nanoid();

  const { error } = await supabase.from('proposal_comments').insert({
    id: commentId,
    tenant_id: profile.tenant_id,
    proposal_id: proposalId,
    user_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    return { error: 'Errore durante la creazione del commento' };
  }

  revalidatePath(`/agora/${proposalId}`);
  return { success: true, commentId };
}

/**
 * Delete comment (owner or admin)
 */
export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Get comment and check ownership
  const { data: comment } = await supabase
    .from('proposal_comments')
    .select('user_id, proposal_id')
    .eq('id', commentId)
    .single() as { data: { user_id: string; proposal_id: string } | null };

  if (!comment) {
    return { error: 'Commento non trovato' };
  }

  // Check if user is owner or admin
  const { data: profile } = await supabase
    .from('users')
    .select('admin_role')
    .eq('id', user.id)
    .single() as { data: { admin_role: string | null } | null };

  const isOwner = comment.user_id === user.id;
  const isAdmin = profile && ['admin', 'super_admin', 'moderator'].includes(profile.admin_role || '');

  if (!isOwner && !isAdmin) {
    return { error: 'Non autorizzato' };
  }

  const { error } = await supabase
    .from('proposal_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    return { error: 'Errore durante l\'eliminazione del commento' };
  }

  revalidatePath(`/agora/${comment.proposal_id}`);
  return { success: true };
}

/**
 * Get proposal status history
 */
export async function getProposalStatusHistory(proposalId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('proposal_status_history')
    .select(`
      *,
      changed_by_user:users!changed_by (
        id,
        name,
        avatar
      )
    `)
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: true });

  if (error) {
    return { history: [] };
  }

  return { history: (data || []) as unknown as ProposalStatusHistoryItem[] };
}
