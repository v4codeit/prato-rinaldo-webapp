/**
 * Formatting utilities for names, dates, and other display values
 */

/**
 * Abbreviates a full name to "FirstName L." format
 *
 * @param fullName - Full name (e.g., "Valerio Zappone")
 * @returns Abbreviated name (e.g., "Valerio Z.")
 *
 * @example
 * getShortName("Valerio Zappone") // "Valerio Z."
 * getShortName("Mario") // "Mario"
 * getShortName("Anna Maria Rossi") // "Anna R."
 * getShortName("") // ""
 */
export function getShortName(fullName: string): string {
  if (!fullName) return '';

  const parts = fullName.trim().split(' ').filter(Boolean);

  // Single name - return as is
  if (parts.length === 1) return parts[0];

  // Multiple names - first name + last initial
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];

  return `${firstName} ${lastInitial}.`;
}

/**
 * Gets initials for avatar fallback (max 2 letters)
 *
 * @param name - Full name
 * @returns Uppercase initials (e.g., "VZ")
 *
 * @example
 * getInitials("Valerio Zappone") // "VZ"
 * getInitials("Mario") // "MA"
 * getInitials("Anna Maria Rossi") // "AR"
 * getInitials("") // "U"
 */
export function getInitials(name: string): string {
  if (!name) return 'U';

  const trimmed = name.trim();
  const words = trimmed.split(' ').filter(Boolean);

  // Multiple words - first letter of first + last word
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  // Single word - first 2 letters (or 1 if name is single char)
  return trimmed.substring(0, 2).toUpperCase();
}
