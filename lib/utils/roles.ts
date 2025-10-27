import { COMMITTEE_ROLES } from './constants';

/**
 * Get all board member roles for validation
 */
export function getBoardMemberRoles(): string[] {
  return Object.values(COMMITTEE_ROLES);
}
