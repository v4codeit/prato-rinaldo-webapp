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
  categoryId: z.string().uuid('Categoria non valida'),
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
  categoryId: z.string().uuid('Categoria non valida'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  isPrivate: z.boolean().default(false),
  committeePercentage: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(0),
  images: z
    .array(z.string().url('URL immagine non valido'))
    .min(1, 'Carica almeno 1 immagine')
    .max(6, 'Massimo 6 immagini')
    .default([]),
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

// Volunteer profile schema
export const createVolunteerProfileSchema = z.object({
  // Required fields
  category: z.string().min(2, 'Seleziona una categoria'),

  businessName: z
    .string()
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(255, "Il nome non può superare 255 caratteri"),

  description: z
    .string()
    .min(50, 'La descrizione deve contenere almeno 50 caratteri')
    .max(2000, 'La descrizione non può superare 2000 caratteri'),

  // Services - Accepts array of strings
  services: z
    .array(z.string().min(2, 'Servizio troppo corto').max(50, 'Servizio troppo lungo'))
    .min(1, 'Inserisci almeno un servizio')
    .max(10, 'Massimo 10 servizi'),

  // Certifications - Optional array of strings
  certifications: z
    .array(z.string().min(2).max(100))
    .max(10, 'Massimo 10 certificazioni')
    .optional()
    .default([]),

  // Contact - At least one required
  contactEmail: z
    .string()
    .email('Email non valida')
    .optional(),

  contactPhone: z
    .string()
    .regex(/^[+]?[\d\s()-]+$/, 'Numero di telefono non valido')
    .optional(),

  address: z
    .string()
    .max(200, "L'indirizzo non può superare 200 caratteri")
    .optional(),

  // Volunteer-specific: availability hours per week
  availabilityHours: z
    .number()
    .int('Le ore devono essere un numero intero')
    .min(1, 'Inserisci almeno 1 ora')
    .max(168, 'Massimo 168 ore settimanali')
    .optional(),
}).refine(
  data => data.contactEmail || data.contactPhone,
  {
    message: 'Inserisci almeno un metodo di contatto (email o telefono)',
    path: ['contactEmail'],
  }
);

// Professional profile schema
export const createProfessionalProfileSchema = z.object({
  // Required fields
  category: z.string().min(2, 'Seleziona una categoria'),

  businessName: z
    .string()
    .min(2, "Il nome dell'attività deve contenere almeno 2 caratteri")
    .max(255, "Il nome dell'attività non può superare 255 caratteri"),

  representativeName: z
    .string()
    .min(2, 'Il nome del rappresentante deve contenere almeno 2 caratteri')
    .max(255, 'Il nome del rappresentante non può superare 255 caratteri')
    .optional(),

  description: z
    .string()
    .min(50, 'La descrizione deve contenere almeno 50 caratteri')
    .max(2000, 'La descrizione non può superare 2000 caratteri'),

  // Services - Accepts array of strings
  services: z
    .array(z.string().min(2, 'Servizio troppo corto').max(50, 'Servizio troppo lungo'))
    .min(1, 'Inserisci almeno un servizio')
    .max(10, 'Massimo 10 servizi'),

  // Certifications - Optional array of strings
  certifications: z
    .array(z.string().min(2).max(100))
    .max(10, 'Massimo 10 certificazioni')
    .optional()
    .default([]),

  // Contact - At least one required
  contactEmail: z
    .string()
    .email('Email non valida')
    .optional(),

  contactPhone: z
    .string()
    .regex(/^[+]?[\d\s()-]+$/, 'Numero di telefono non valido')
    .optional(),

  // Professional-specific fields
  website: z
    .string()
    .url('URL non valido')
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .min(10, "L'indirizzo deve contenere almeno 10 caratteri")
    .max(200, "L'indirizzo non può superare 200 caratteri"),

  // VAT number (Partita IVA) - optional
  vatNumber: z
    .string()
    .regex(/^IT\d{11}$/, 'Partita IVA non valida (formato: IT + 11 cifre)')
    .optional()
    .or(z.literal('')),

  // Hourly rate - optional
  hourlyRate: z
    .number()
    .min(0.01, 'La tariffa deve essere maggiore di 0')
    .max(9999.99, 'La tariffa non può superare 9999.99 €')
    .optional(),
}).refine(
  data => data.contactEmail || data.contactPhone,
  {
    message: 'Inserisci almeno un metodo di contatto (email o telefono)',
    path: ['contactEmail'],
  }
);

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

// Agora schemas
export const createProposalSchema = z.object({
  title: z.string().min(10, 'Il titolo deve contenere almeno 10 caratteri').max(200, 'Il titolo non può superare 200 caratteri'),
  description: z.string().min(50, 'La descrizione deve contenere almeno 50 caratteri').max(2000, 'La descrizione non può superare 2000 caratteri'),
  categoryId: z.string().uuid('Seleziona una categoria valida'),
});

// Messaging schemas
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Il messaggio non può essere vuoto').max(2000, 'Il messaggio è troppo lungo (max 2000 caratteri)'),
});

// =====================================================
// TOPICS SYSTEM SCHEMAS (Telegram-style chat)
// =====================================================

// Topic visibility enum
export const topicVisibilityEnum = z.enum(['public', 'authenticated', 'verified', 'members_only']);

// Topic write permission enum
export const topicWritePermissionEnum = z.enum(['all_viewers', 'verified', 'members_only', 'admins_only']);

// Topic member role enum
export const topicMemberRoleEnum = z.enum(['viewer', 'writer', 'moderator', 'admin']);

// Topic reaction type enum
export const topicReactionTypeEnum = z.enum(['like', 'love', 'laugh', 'wow', 'sad', 'angry']);

// Create topic schema (admin only)
export const createTopicSchema = z.object({
  name: z
    .string()
    .min(3, 'Il nome deve contenere almeno 3 caratteri')
    .max(100, 'Il nome non può superare 100 caratteri'),
  slug: z
    .string()
    .min(3, 'Lo slug deve contenere almeno 3 caratteri')
    .max(100, 'Lo slug non può superare 100 caratteri')
    .regex(/^[a-z0-9-]+$/, 'Lo slug può contenere solo lettere minuscole, numeri e trattini')
    .optional(),
  description: z
    .string()
    .max(500, 'La descrizione non può superare 500 caratteri')
    .optional(),
  icon: z
    .string()
    .max(50, 'Icona troppo lunga')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Colore non valido (usa formato esadecimale #RRGGBB)')
    .optional()
    .default('#0891b2'),
  visibility: topicVisibilityEnum.default('verified'),
  writePermission: topicWritePermissionEnum.default('verified'),
  autoPostSource: z
    .enum(['events', 'marketplace', 'proposals'])
    .optional(),
  autoPostFilter: z
    .record(z.unknown())
    .optional()
    .default({}),
});

// Update topic schema (partial of create)
export const updateTopicSchema = z.object({
  name: z
    .string()
    .min(3, 'Il nome deve contenere almeno 3 caratteri')
    .max(100, 'Il nome non può superare 100 caratteri')
    .optional(),
  description: z
    .string()
    .max(500, 'La descrizione non può superare 500 caratteri')
    .optional()
    .nullable(),
  icon: z
    .string()
    .max(50, 'Icona troppo lunga')
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Colore non valido')
    .optional(),
  coverImage: z
    .string()
    .url('URL immagine non valido')
    .optional()
    .nullable(),
  visibility: topicVisibilityEnum.optional(),
  writePermission: topicWritePermissionEnum.optional(),
  autoPostSource: z
    .enum(['events', 'marketplace', 'proposals'])
    .optional()
    .nullable(),
  autoPostFilter: z
    .record(z.unknown())
    .optional(),
  orderIndex: z
    .number()
    .int('Ordine deve essere un numero intero')
    .min(0)
    .optional(),
});

// Topic message schema (allows empty content if images are present)
export const sendTopicMessageSchema = z
  .object({
    content: z
      .string()
      .max(4000, 'Il messaggio è troppo lungo (max 4000 caratteri)')
      .default(''),
    replyToId: z
      .string()
      .uuid('ID risposta non valido')
      .optional(),
    mentions: z
      .array(z.string().uuid('ID utente non valido'))
      .optional(),
    metadata: z
      .record(z.unknown())
      .optional(),
  })
  .refine(
    (data) => {
      const hasContent = data.content && data.content.trim().length > 0;
      const hasImages =
        data.metadata &&
        Array.isArray((data.metadata as Record<string, unknown>).images) &&
        ((data.metadata as Record<string, unknown>).images as unknown[]).length > 0;
      return hasContent || hasImages;
    },
    { message: 'Inserisci un messaggio o allega almeno una immagine' }
  );

// Edit message schema
export const editTopicMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Il messaggio non può essere vuoto')
    .max(4000, 'Il messaggio è troppo lungo (max 4000 caratteri)'),
});

// Message reaction schema
export const topicReactionSchema = z.object({
  emoji: z
    .string()
    .min(1, 'Emoji richiesta')
    .max(20, 'Emoji troppo lunga'),
});

// Add member schema
export const addTopicMemberSchema = z.object({
  userId: z
    .string()
    .uuid('ID utente non valido')
    .optional(),
  email: z
    .string()
    .email('Email non valida')
    .optional(),
  role: topicMemberRoleEnum.default('writer'),
}).refine(
  data => data.userId || data.email,
  {
    message: 'Specifica ID utente o email',
    path: ['userId'],
  }
);

// Update member role schema
export const updateTopicMemberRoleSchema = z.object({
  role: topicMemberRoleEnum,
});

// Update subscription (mute) schema
export const updateTopicSubscriptionSchema = z.object({
  isMuted: z.boolean().optional(),
});

// Image upload metadata schema
export const topicImageMetadataSchema = z.object({
  url: z.string().url('URL immagine non valido'),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  alt: z.string().max(200).optional(),
});
