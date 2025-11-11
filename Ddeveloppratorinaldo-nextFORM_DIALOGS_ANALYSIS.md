# Analisi Pattern Form Dialogs - ArticleFormDialog

**Data:** Novembre 2025 | **Progetto:** Prato Rinaldo Community Platform

---

## 1. DIALOG WRAPPER PATTERN

### Base Dialog Components (shadcn/ui)
- Localizzati in `components/ui/dialog.tsx`
- Overlay con `z-50` e animazioni smooth
- Max-width: `lg` (32rem) di default - Responsive mobile-friendly

### Pattern State Management

```typescript
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function ArticleFormDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editingArticle;

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    setIsOpen(true);
  };

  const handleClose = (open: boolean) => {
    if (!isSubmitting) {
      setIsOpen(open);
      if (!open) setEditingArticle(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifica Articolo' : 'Nuovo Articolo'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica i dettagli dell\'articolo'
              : 'Crea un nuovo articolo per la comunità'}
          </DialogDescription>
        </DialogHeader>
        {/* Form Content */}
      </DialogContent>
    </Dialog>
  );
}
```

**Pattern chiave:**
- `onOpenChange` gestisce apertura/chiusura
- `editingArticle` determina create vs edit
- `isSubmitting` previene chiusura durante submit
- Close automatico dopo submit di successo tramite `setIsOpen(false)`

---

## 2. REACT-HOOK-FORM + ZOD

### Validation Schema

```typescript
// lib/utils/validators.ts
import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z
    .string()
    .min(5, 'Il titolo deve contenere almeno 5 caratteri')
    .max(500, 'Il titolo non può superare 500 caratteri'),

  slug: z
    .string()
    .min(5, 'Lo slug deve contenere almeno 5 caratteri')
    .max(200, 'Lo slug non può superare 200 caratteri')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug non valido'),

  excerpt: z
    .string()
    .max(500, 'L\'excerpt non può superare 500 caratteri')
    .optional()
    .default(''),

  content: z
    .string()
    .min(50, 'Il contenuto deve contenere almeno 50 caratteri')
    .max(50000, 'Il contenuto non può superare 50000 caratteri'),

  coverImage: z
    .string()
    .url('URL immagine non valido')
    .optional()
    .default(''),

  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export type CreateArticleFormData = z.infer<typeof createArticleSchema>;
```

