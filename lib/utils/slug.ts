/**
 * Slug Utility - Pure Functions (Client-Safe)
 *
 * This module contains pure string transformation functions for slug generation.
 * NO Supabase dependency - can be used in both Client and Server Components.
 *
 * For database-dependent slug operations (uniqueness checks), use slug-generator.ts
 */

const SLUG_CONFIG = {
  MAX_LENGTH: 200,
  MIN_LENGTH: 3,
} as const;

/**
 * Normalize accents and diacritical marks
 *
 * @example
 * removeAccents('Prato Rinaldo è Bellissimo!') // 'Prato Rinaldo e Bellissimo!'
 */
export function removeAccents(text: string): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Generate a URL-friendly slug from a title
 *
 * @example
 * generateSlug('Prato Rinaldo è Bellissimo!') // 'prato-rinaldo-e-bellissimo'
 *
 * @param title - The title to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(title: string): string {
  if (!title) return '';

  // Step 1: Remove accents
  let slug = removeAccents(title);

  // Step 2: Convert to lowercase
  slug = slug.toLowerCase();

  // Step 3: Replace spaces with hyphens
  slug = slug.replace(/\s+/g, '-');

  // Step 4: Remove non-word characters (except hyphens) and underscores
  slug = slug.replace(/[^\w-]/g, '').replace(/[_]/g, '-');

  // Step 5: Replace multiple consecutive hyphens with single hyphen
  slug = slug.replace(/-+/g, '-');

  // Step 6: Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  // Step 7: Truncate to max length (smart truncation at word boundary)
  if (slug.length > SLUG_CONFIG.MAX_LENGTH) {
    slug = slug.substring(0, SLUG_CONFIG.MAX_LENGTH);
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen > 0) {
      slug = slug.substring(0, lastHyphen);
    }
  }

  return slug;
}

/**
 * Validate slug format
 *
 * @param slug - The slug to validate
 * @returns Error message if invalid, null if valid
 */
export function validateSlugFormat(slug: string): string | null {
  if (!slug || slug.trim().length === 0) {
    return 'Lo slug non può essere vuoto';
  }

  if (slug.length < SLUG_CONFIG.MIN_LENGTH) {
    return 'Lo slug deve contenere almeno ' + SLUG_CONFIG.MIN_LENGTH + ' caratteri';
  }

  if (slug.length > SLUG_CONFIG.MAX_LENGTH) {
    return 'Lo slug non può superare ' + SLUG_CONFIG.MAX_LENGTH + ' caratteri';
  }

  // Slug must start and end with alphanumeric, can contain hyphens in between
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return 'Lo slug deve contenere solo lettere minuscole, numeri e trattini';
  }

  // No consecutive hyphens
  if (slug.includes('--')) {
    return 'Lo slug non può contenere trattini consecutivi';
  }

  // No leading or trailing hyphens
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return 'Lo slug non può iniziare o terminare con un trattino';
  }

  return null;
}

/**
 * Export SLUG_CONFIG for use in other modules
 */
export { SLUG_CONFIG };
