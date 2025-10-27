import { z } from 'zod';

/**
 * Schemi di validazione Zod riutilizzabili
 */

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
    email: z.string().email('Email non valida'),
    password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email non valida'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  });

// Profile schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri').optional(),
  bio: z.string().max(500, 'La bio non può superare 500 caratteri').optional(),
  phone: z.string().optional(),
  avatar: z.string().url('URL avatar non valido').optional(),
});

// Onboarding schemas
export const onboardingStep1Schema = z.object({
  membershipType: z.enum(['resident', 'domiciled', 'landowner']),
  street: z.string().min(2, 'La via è obbligatoria'),
  streetNumber: z.string().min(1, 'Il numero civico è obbligatorio'),
  zipCode: z.string().length(5, 'Il CAP deve essere di 5 cifre'),
  municipality: z.enum(['san_cesareo', 'zagarolo']),
});

export const onboardingStep2Schema = z.object({
  householdSize: z.number().int().min(1, 'Inserire il numero di componenti').optional(),
  hasMinors: z.boolean().optional(),
  minorsCount: z.number().int().min(0).optional(),
  hasSeniors: z.boolean().optional(),
  seniorsCount: z.number().int().min(0).optional(),
});

// Article schemas
export const createArticleSchema = z.object({
  title: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(500),
  slug: z.string().min(5).max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(50, 'Il contenuto deve contenere almeno 50 caratteri'),
  coverImage: z.string().url('URL immagine non valido').optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

// Event schemas
export const createEventSchema = z.object({
  title: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(500),
  description: z.string().min(20, 'La descrizione deve contenere almeno 20 caratteri'),
  location: z.string().min(3, 'La località è obbligatoria'),
  coverImage: z.string().url('URL immagine non valido').optional(),
  startDate: z.string().datetime('Data inizio non valida'),
  endDate: z.string().datetime('Data fine non valida').optional(),
  isPrivate: z.boolean().default(false),
  maxAttendees: z.number().int().min(1).optional(),
  requiresPayment: z.boolean().default(false),
  price: z.number().int().min(0).default(0),
});

// Marketplace schemas
export const createMarketplaceItemSchema = z.object({
  title: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(500),
  description: z.string().min(20, 'La descrizione deve contenere almeno 20 caratteri'),
  price: z.number().int().min(0, 'Il prezzo deve essere positivo'),
  committeePercentage: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(0),
  images: z.array(z.string().url()).optional(),
});

// Forum schemas
export const createThreadSchema = z.object({
  categoryId: z.string().uuid('ID categoria non valido'),
  title: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(500),
  content: z.string().min(20, 'Il contenuto deve contenere almeno 20 caratteri'),
});

export const createPostSchema = z.object({
  threadId: z.string().uuid('ID thread non valido'),
  content: z.string().min(10, 'Il contenuto deve contenere almeno 10 caratteri'),
});

// Professional profile schemas
export const createProfessionalProfileSchema = z.object({
  category: z.string().min(2, 'La categoria è obbligatoria'),
  businessName: z
    .string()
    .min(2, "Il nome dell'attività deve contenere almeno 2 caratteri")
    .max(255, "Il nome dell'attività non può superare 255 caratteri")
    .optional(),
  title: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(255),
  description: z.string().min(50, 'La descrizione deve contenere almeno 50 caratteri'),
  services: z
    .array(z.string())
    .min(1, 'Inserisci almeno un servizio')
    .max(20, 'Massimo 20 servizi')
    .optional()
    .default([]),
  isVolunteer: z.boolean().default(false),
  contactEmail: z.string().email('Email non valida').optional(),
  contactPhone: z
    .string()
    .regex(/^[+]?[\d\s()-]+$/, 'Numero di telefono non valido')
    .optional(),
  website: z.string().url('URL non valido').optional(),
  address: z.string().max(500, "L'indirizzo non può superare 500 caratteri").optional(),
  certifications: z.array(z.string()).max(10, 'Massimo 10 certificazioni').optional().default([]),
});

// Review schemas
export const createReviewSchema = z.object({
  rating: z.number().int('Il voto deve essere un numero intero').min(1, 'Il voto minimo è 1').max(5, 'Il voto massimo è 5'),
  comment: z.string().min(10, 'Il commento deve contenere almeno 10 caratteri').max(1000, 'Il commento non può superare 1000 caratteri').optional(),
});

// Resource schemas
export const createDocumentSchema = z.object({
  title: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(500, 'Il titolo non può superare 500 caratteri'),
  description: z.string().min(10, 'La descrizione deve contenere almeno 10 caratteri').optional(),
  category: z.string().min(2, 'La categoria è obbligatoria').max(100, 'La categoria non può superare 100 caratteri'),
  fileUrl: z.string().url('URL del file non valido').min(1, 'URL del file è obbligatorio'),
  fileType: z.string().max(100, 'Il tipo di file non può superare 100 caratteri').optional(),
  fileSize: z.number().int('La dimensione del file deve essere un numero intero').min(1, 'La dimensione del file deve essere positiva').max(50000000, 'Il file non può superare 50MB'),
  isPublic: z.boolean().default(true),
});

export const createTutorialSchema = z.object({
  title: z.string().min(5, 'Il titolo deve contenere almeno 5 caratteri').max(500, 'Il titolo non può superare 500 caratteri'),
  content: z.string().min(50, 'Il contenuto deve contenere almeno 50 caratteri'),
  category: z.string().min(2, 'La categoria è obbligatoria').max(100, 'La categoria non può superare 100 caratteri'),
  coverImage: z
    .string()
    .url('URL immagine di copertina non valido')
    .optional()
    .or(z.literal('')),
  videoUrl: z
    .string()
    .url('URL video non valido')
    .optional()
    .or(z.literal('')),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Seleziona un livello di difficoltà valido' }),
  }),
  estimatedTime: z.number().int('Il tempo stimato deve essere un numero intero').min(1, 'Il tempo stimato deve essere almeno 1 minuto').max(480, 'Il tempo stimato non può superare 8 ore'),
});
