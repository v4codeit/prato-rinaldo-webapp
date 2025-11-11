'use server';

/**
 * Slug Generator - Database-Dependent Functions (Server-Only)
 *
 * This module contains async functions that check slug uniqueness in the database.
 * Requires Supabase server client - can ONLY be used in Server Components or Server Actions.
 *
 * For pure slug generation (no DB), use slug.ts
 */

import { createClient } from '@/lib/supabase/server';
import { generateSlug, SLUG_CONFIG } from './slug';

/**
 * Check if a slug already exists in articles table
 */
export async function checkSlugUniqueness(
  slug: string,
  tenantId: string,
  excludeArticleId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug)
      .eq('tenant_id', tenantId);
    
    if (excludeArticleId) {
      query = query.neq('id', excludeArticleId);
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error('Error checking slug uniqueness:', error);
      return true;
    }
    
    return (count ?? 0) > 0;
  } catch (error) {
    console.error('Error in checkSlugUniqueness:', error);
    return true;
  }
}

/**
 * Ensure slug is unique by appending number if needed
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  tenantId: string,
  excludeArticleId?: string
): Promise<string> {
  if (!baseSlug || baseSlug.length === 0) {
    return 'article';
  }
  
  const exists = await checkSlugUniqueness(baseSlug, tenantId, excludeArticleId);
  if (!exists) {
    return baseSlug;
  }
  
  const maxAttempts = 100;
  for (let i = 2; i < maxAttempts; i++) {
    const suffix = '-' + i;
    const candidateSlug = baseSlug + suffix;
    
    let finalSlug = candidateSlug;
    if (finalSlug.length > SLUG_CONFIG.MAX_LENGTH) {
      const maxBaseLength = SLUG_CONFIG.MAX_LENGTH - suffix.length;
      finalSlug = baseSlug.substring(0, maxBaseLength) + suffix;
      
      const lastHyphen = finalSlug.lastIndexOf('-');
      if (lastHyphen > 0 && lastHyphen < finalSlug.length - suffix.length) {
        finalSlug = finalSlug.substring(0, lastHyphen) + suffix;
      }
    }
    
    const isUnique = !(await checkSlugUniqueness(finalSlug, tenantId, excludeArticleId));
    if (isUnique) {
      return finalSlug;
    }
  }
  
  return baseSlug + '-' + Date.now();
}

/**
 * Complete slug generation pipeline
 */
export async function generateUniqueSlug(
  title: string,
  tenantId: string,
  excludeArticleId?: string
): Promise<string> {
  const baseSlug = generateSlug(title);
  return ensureUniqueSlug(baseSlug, tenantId, excludeArticleId);
}

