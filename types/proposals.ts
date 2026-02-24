/**
 * Types for the Agora proposals system with tag support
 */

/**
 * Tag per categorizzare le proposte
 */
export interface ProposalTag {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Tag assignment (junction table)
 */
export interface ProposalTagAssignment {
  id: string;
  proposal_id: string;
  tag_id: string;
  created_at: string;
}

/**
 * Input per creare un nuovo tag
 */
export interface CreateTagInput {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
}

/**
 * Input per aggiornare un tag
 */
export interface UpdateTagInput {
  name?: string;
  slug?: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  order_index?: number;
  is_active?: boolean;
}

/**
 * Proposta con tag inclusi
 */
export interface ProposalWithTags {
  id: string;
  title: string;
  description: string;
  status: string;
  upvotes: number;
  score: number;
  view_count: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  category: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  };
  tags: ProposalTag[];
}
