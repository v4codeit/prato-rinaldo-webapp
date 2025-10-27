import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility per combinare classi Tailwind CSS
 * Combina clsx e tailwind-merge per gestire conflitti di classi
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
