/**
 * Mercatino components barrel export
 *
 * This module exports all Mercatino-related components for the
 * community marketplace system (buy/sell/rent items and real estate)
 */

// Main card component
export { MercatinoCard } from './mercatino-card';
export type { MercatinoCardProps } from './mercatino-card';

// Donation badge (Supporta il Comitato)
export { DonationBadge, DonationBadgeAnimated } from './donation-badge';
export type { DonationBadgeProps } from './donation-badge';

// Contact buttons
export { ContactButtons, ContactDialog } from './contact-buttons';
export type { ContactButtonsProps, ContactInfo } from './contact-buttons';

// Wizard components
export {
  MercatinoWizard,
  WizardStep1,
  WizardStep2Object,
  WizardStep2RealEstate,
  WizardStep3,
  WizardStep4,
  WizardStep5,
} from './wizard';
export type {
  MercatinoWizardData,
  MercatinoWizardProps,
  WizardStep1Data,
  WizardStep2ObjectData,
  WizardStep2RealEstateData,
  WizardStep3Data,
  WizardStep4Data,
  WizardStep5Data,
} from './wizard';
