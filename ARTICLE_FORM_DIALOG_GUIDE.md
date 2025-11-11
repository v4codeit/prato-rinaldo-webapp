# ArticleFormDialog - Implementation Guide

## State Management Pattern

```typescript
'use client';
import { useState } from 'react';

export function ArticleFormDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editingArticle;

  const handleClose = (open: boolean) => {
    if (!isSubmitting) {
      setIsOpen(open);
      if (!open) setEditingArticle(null);
    }
  };
}
```

## Validation Schema (Zod)

```typescript
export const createArticleSchema = z.object({
  title: z.string()
    .min(5, 'Minimo 5 caratteri')
    .max(500),
  slug: z.string()
    .min(5)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(500).optional().default(''),
  content: z.string().min(50).max(50000),
  coverImage: z.string().url().optional().default(''),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});
```

## Form Setup (react-hook-form)

```typescript
const form = useForm<CreateArticleFormData>({
  resolver: zodResolver(createArticleSchema),
  defaultValues: initialData ? {
    title: initialData.title,
    slug: initialData.slug,
    excerpt: initialData.excerpt || '',
    content: initialData.content,
    coverImage: initialData.cover_image || '',
    status: initialData.status,
  } : {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    status: 'draft',
  },
  mode: 'onChange',
});
```

## Auto-Slug Generation

```typescript
const titleValue = form.watch('title');

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')     // Remove accents
    .replace(/[^a-z0-9]+/g, '-')          // Non-alphanumeric to dash
    .replace(/^-+|-+$/g, '')               // Remove leading/trailing dashes
    .substring(0, 200);
};

useEffect(() => {
  if (!isEditMode && titleValue) {
    const newSlug = generateSlug(titleValue);
    form.setValue('slug', newSlug);
  }
}, [titleValue, isEditMode, form]);
```

## Server Action Pattern

```typescript
'use server';

export async function createArticle(formData: FormData) {
  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non autenticato' };

  // 2. Role check
  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Accesso negato' };
  }

  // 3. Validate
  const rawData = {
    title: formData.get('title') as string,
    slug: formData.get('slug') as string,
    excerpt: formData.get('excerpt') as string,
    content: formData.get('content') as string,
    coverImage: formData.get('coverImage') as string,
    status: formData.get('status') as 'draft' | 'published' | 'archived',
  };

  const parsed = createArticleSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] };
  }

  // 4. Insert
  const { error } = await supabase.from('articles').insert({
    ...parsed.data,
    author_id: user.id,
    tenant_id: profile.tenant_id,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
  });

  if (error) return { error: 'Errore creazione' };

  revalidatePath('/');
  revalidatePath('/admin/articles');

  return { success: true };
}
```

## Auto-Save Hook (localStorage)

```typescript
export function useFormAutoSave<T>(
  form: UseFormReturn<T>,
  options: { key: string; debounceMs?: number }
) {
  const { key, debounceMs = 30000 } = options;
  const timerRef = useRef<NodeJS.Timeout>();

  const saveToStorage = useCallback(() => {
    const data = form.getValues();
    localStorage.setItem(key, JSON.stringify(data));
  }, [form, key]);

  const debouncedSave = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveToStorage, debounceMs);
  }, [saveToStorage, debounceMs]);

  form.watch(() => debouncedSave());

  const restoreFromStorage = useCallback(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      form.reset(JSON.parse(saved));
      return true;
    }
    return false;
  }, [form, key]);

  const clearStorage = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { restoreFromStorage, clearStorage };
}
```

## Complete Dialog Component

```typescript
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArticleForm } from './article-form';
import { createArticle, updateArticle } from '@/app/actions/articles';
import type { CreateArticleFormData } from '@/lib/utils/validators';
import type { Article } from '@/lib/supabase/types';

export function ArticleFormDialog({
  open,
  onOpenChange,
  article,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: Article;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditMode = !!article;

  const handleSubmit = async (data: CreateArticleFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const result = isEditMode
        ? await updateArticle(article!.id, formData)
        : await createArticle(formData);

      if (result.error) {
        toast.error(result.error as string);
      } else {
        toast.success(isEditMode ? 'Aggiornato' : 'Creato');
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifica Articolo' : 'Nuovo Articolo'}
          </DialogTitle>
        </DialogHeader>
        <ArticleForm
          initialData={article}
          isEditMode={isEditMode}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
```

