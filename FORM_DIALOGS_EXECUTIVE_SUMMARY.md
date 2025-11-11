# Form Dialogs Analysis - Executive Summary

## Overview

Ho analizzato i pattern di form dialogs nel progetto Prato Rinaldo per implementare ArticleFormDialog con:
- react-hook-form + Zod validation
- Auto-slug generation
- Auto-save su localStorage
- RichTextEditor per contenuto HTML
- Create/Edit mode management

## Documents Created

1. **ARTICLE_FORM_DIALOG_GUIDE.md** (6.5 KB)
   - Complete implementation guide
   - State management pattern
   - Validation schema
   - Form setup with react-hook-form
   - Auto-slug generation code
   - Server action pattern
   - Auto-save hook
   - Complete dialog component

2. **FORM_DIALOGS_PATTERNS.txt** (3.5 KB)
   - 10 key patterns identified
   - Existing dialog implementations analyzed
   - Differences for Articles module

## Key Findings

### Dialog Components (shadcn/ui)
- Located: `components/ui/dialog.tsx`
- Features: z-50 overlay, smooth animations, max-width lg
- Responsive mobile-friendly design

### Form Patterns Analyzed

**Users Admin Panel** (users-client.tsx)
```
Dialog + SelectTrigger for role updates
- Simple form with 2 selects
- handleUpdateRole server action
- Modal role update workflow
```

**Announcements** (announcements-client.tsx)
```
Dialog + full form (create & edit)
- 8 input fields
- Reset form on close
- handleSubmit with toast notifications
- Form state in useState (not react-hook-form)
```

**Tenant Settings** (tenant-settings-form.tsx)
```
Card-based form (not dialog)
- Multiple sections with separate submit buttons
- Switch fields for boolean values
- Checkbox groups for arrays
- Color picker inputs
- Uses react-hook-form + Zod
- Custom form layout (not dialog)
```

**Proposals** (proposal-form.tsx)
```
Full page form (not dialog)
- Title + description + category
- Uses react-hook-form + Zod
- Server action for createProposal
- useTransition() for async state
- Category loading from server
```

### Best Pattern for Articles

**From AnnouncementsClient + ProposalForm hybrid:**
1. Dialog wrapper manages open/close state
2. Form component separated (ArticleForm)
3. react-hook-form + Zod for validation
4. useTransition() for async submit
5. Server actions for database operations
6. Toast notifications for feedback
7. localStorage auto-save (new)
8. Auto-slug generation (new)
9. RichTextEditor for content (new)

## Implementation Checklist

### 1. Validation Schema
File: `lib/utils/validators.ts`
```
createArticleSchema already exists:
✓ title: min 5, max 500
✓ slug: min 5, max 200, regex
✓ excerpt: max 500, optional
✓ content: min 50, max 50000
✓ coverImage: url, optional
✓ status: enum ['draft', 'published', 'archived']
```

### 2. Server Actions
File: `app/actions/articles.ts`
```
✓ createArticle(formData: FormData)
✓ updateArticle(articleId: string, formData: FormData)
✓ deleteArticle(articleId: string)
- Auth checks present
- Zod validation present
- Tenant filtering present
- revalidatePath() calls present
```

### 3. Components to Create
```
components/organisms/dialogs/
  - article-form-dialog.tsx (new)
  - article-form.tsx (new)

lib/hooks/
  - use-form-autosave.ts (new)
```

### 4. Dependencies
All present in project:
- react-hook-form
- @hookform/resolvers
- zod
- sonner (toast)
- next/navigation (useRouter)
- Components: Dialog, Input, Textarea, Select, Button

### 5. New Features
```
- Auto-slug: Generate URL-safe slug from title
  * Decompose accents with normalize('NFD')
  * Replace spaces/special chars with dashes
  * Only in create mode

- Auto-save: Save draft to localStorage every 30s
  * useRef for debounce timer
  * Restore on page reload
  * Clear on successful submit
  * Only in create mode

- RichTextEditor: Already exists
  * TipTap-based WYSIWYG
  * Outputs HTML
  * Supports: bold, italic, links, lists, code, images

- ImageUpload: Already exists
  * File upload to Supabase storage
  * Shows current image preview
  * Max 5MB file size
```

## Code Snippets

### Dialog Wrapper Pattern
```typescript
const [isOpen, setIsOpen] = useState(false);
const [editingArticle, setEditingArticle] = useState<Article | null>(null);
const [isPending, startTransition] = useTransition();

const isEditMode = !!editingArticle;

const handleClose = (open: boolean) => {
  if (!isPending && open !== isOpen) {
    setIsOpen(open);
    if (!open) setEditingArticle(null);
  }
};
```

### Form Setup
```typescript
const form = useForm<CreateArticleFormData>({
  resolver: zodResolver(createArticleSchema),
  defaultValues: initialData ? { ...initialData } : { /* empty */ },
  mode: 'onChange',
});
```

### Auto-Slug
```typescript
const titleValue = form.watch('title');

useEffect(() => {
  if (!isEditMode && titleValue) {
    const slug = titleValue
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 200);
    form.setValue('slug', slug);
  }
}, [titleValue, isEditMode, form]);
```

### Submit Handler
```typescript
const handleSubmit = async (data: CreateArticleFormData) => {
  startTransition(async () => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)));

    const result = isEditMode
      ? await updateArticle(article!.id, formData)
      : await createArticle(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEditMode ? 'Aggiornato' : 'Creato');
      onOpenChange(false);
      router.refresh();
    }
  });
};
```

### Auto-Save Hook
```typescript
export function useFormAutoSave<T>(
  form: UseFormReturn<T>,
  { key, debounceMs = 30000 }
) {
  const timerRef = useRef<NodeJS.Timeout>();

  const saveToStorage = useCallback(() => {
    localStorage.setItem(key, JSON.stringify(form.getValues()));
  }, [form, key]);

  const debouncedSave = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveToStorage, debounceMs);
  }, [saveToStorage, debounceMs]);

  form.watch(() => debouncedSave());

  return {
    restoreFromStorage: useCallback(() => {
      const saved = localStorage.getItem(key);
      if (saved) {
        form.reset(JSON.parse(saved));
        return true;
      }
      return false;
    }, [form, key]),
    clearStorage: () => localStorage.removeItem(key),
  };
}
```

## Next Steps

1. **Create use-form-autosave hook**
   - Generic reusable auto-save for any form
   - Debounced save to localStorage
   - Restore and clear methods

2. **Create article-form.tsx component**
   - All FormField components
   - RichTextEditor integration
   - ImageUpload integration
   - Auto-slug generation
   - Auto-save hook usage

3. **Create article-form-dialog.tsx wrapper**
   - Dialog state management
   - Mode determination (create vs edit)
   - Submit handler with server actions
   - Toast notifications

4. **Integrate in articles page**
   - Add button to open dialog
   - List articles with edit actions
   - Pass selected article to dialog

5. **Test workflow**
   - Create new article
   - Auto-slug generation
   - Auto-save to localStorage
   - Edit existing article
   - Publish/draft/archive workflow

## Reference Files

- Dialog base: `components/ui/dialog.tsx`
- Dialog usage: `app/(admin)/admin/users/users-client.tsx`
- Form with validation: `components/organisms/proposal-form.tsx`
- Form patterns: `app/(admin)/admin/announcements/announcements-client.tsx`
- Validators: `lib/utils/validators.ts`
- Server actions: `app/actions/articles.ts`
- Editor: `app/(admin)/admin/articles/test-editor-client.tsx`

## Files Generated

- `ARTICLE_FORM_DIALOG_GUIDE.md` - Complete implementation guide
- `FORM_DIALOGS_PATTERNS.txt` - Pattern reference

