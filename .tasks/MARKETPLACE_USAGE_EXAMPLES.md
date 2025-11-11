# Marketplace Image Components - Usage Examples

Quick reference guide for using the new image components.

---

## MultiImageUpload Component

### Basic Usage

```tsx
'use client';

import { useState } from 'react';
import { MultiImageUpload } from '@/components/molecules/multi-image-upload';

export default function MyForm() {
  const [images, setImages] = useState<string[]>([]);

  return (
    <MultiImageUpload
      bucket="marketplace-images"
      currentImages={images}
      onImagesChange={setImages}
      maxImages={6}
      maxSizeMB={10}
      userId="user-123"
      itemId="item-456"
    />
  );
}
```

### With Form Integration

```tsx
'use client';

import { useState } from 'react';
import { MultiImageUpload } from '@/components/molecules/multi-image-upload';
import { toast } from 'sonner';

export default function CreateItemForm() {
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate images
    if (images.length === 0) {
      toast.error('Carica almeno 1 immagine');
      return;
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    formData.append('images', JSON.stringify(images));

    // Submit to server action
    const result = await createItem(formData);

    if (result.success) {
      toast.success('Item creato!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" required />

      <MultiImageUpload
        bucket="marketplace-images"
        currentImages={images}
        onImagesChange={setImages}
        maxImages={6}
        maxSizeMB={10}
      />

      <button type="submit">Crea</button>
    </form>
  );
}
```

### Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `bucket` | string | Yes | - | Supabase storage bucket name |
| `currentImages` | string[] | Yes | - | Array of current image URLs |
| `onImagesChange` | function | Yes | - | Callback when images change |
| `maxImages` | number | No | 6 | Maximum number of images |
| `maxSizeMB` | number | No | 10 | Max file size in MB |
| `label` | string | No | "Immagini" | Label for the component |
| `userId` | string | No | - | User ID for upload path |
| `itemId` | string | No | - | Item ID for upload path |

---

## ImageGallery Component

### Basic Usage

```tsx
import { ImageGallery } from '@/components/molecules/image-gallery';

export default function ProductDetail({ product }) {
  return (
    <div>
      <ImageGallery
        images={product.images}
        alt={product.title}
      />
    </div>
  );
}
```

### With Server Component

```tsx
import { ImageGallery } from '@/components/molecules/image-gallery';
import { getProduct } from '@/app/actions/products';

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Image Gallery */}
      <ImageGallery
        images={product.images || []}
        alt={product.title}
      />

      {/* Product Details */}
      <div>
        <h1>{product.title}</h1>
        <p>{product.description}</p>
      </div>
    </div>
  );
}
```

### Handling Empty State

```tsx
import { ImageGallery } from '@/components/molecules/image-gallery';

export default function ProductCard({ product }) {
  return (
    <div>
      {/* Gallery handles empty array gracefully */}
      <ImageGallery
        images={product.images || []}
        alt={product.title}
      />

      {/* Shows "Nessuna immagine disponibile" if empty */}
    </div>
  );
}
```

### Props Reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `images` | string[] | Yes | - | Array of image URLs |
| `alt` | string | No | "Immagine prodotto" | Alt text for images |

---

## Full Example: Complete CRUD Form

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MultiImageUpload } from '@/components/molecules/multi-image-upload';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { createMarketplaceItem } from '@/app/actions/marketplace';
import { toast } from 'sonner';

export default function NewMarketplacePage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  // Get user ID on mount
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate images
    if (images.length === 0) {
      toast.error('Carica almeno 1 immagine');
      return;
    }

    if (images.length > 6) {
      toast.error('Massimo 6 immagini');
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append('images', JSON.stringify(images));

    const result = await createMarketplaceItem(formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success('Annuncio creato!');
      router.push('/marketplace');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        name="title"
        placeholder="Titolo"
        required
        className="w-full px-3 py-2 border rounded"
      />

      <textarea
        name="description"
        placeholder="Descrizione"
        required
        className="w-full px-3 py-2 border rounded"
      />

      {/* Image Upload */}
      <div>
        <label className="block font-medium mb-2">
          Foto Prodotto *
        </label>
        <MultiImageUpload
          bucket="marketplace-images"
          currentImages={images}
          onImagesChange={setImages}
          maxImages={6}
          maxSizeMB={10}
          userId={userId}
          itemId={`temp-${Date.now()}`}
        />
        <p className="text-sm text-muted-foreground mt-2">
          Carica da 1 a 6 foto. La prima sarà la copertina.
        </p>
      </div>

      <input
        name="price"
        type="number"
        placeholder="Prezzo"
        required
        className="w-full px-3 py-2 border rounded"
      />

      <Button type="submit" disabled={loading}>
        {loading ? 'Creazione...' : 'Crea Annuncio'}
      </Button>
    </form>
  );
}
```

---

## Server Action Example

```typescript
// app/actions/marketplace.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { createMarketplaceItemSchema } from '@/lib/utils/validators';

export async function createMarketplaceItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Non autenticato' };
  }

  // Parse images from JSON string
  const imagesJson = formData.get('images') as string;
  const images = imagesJson ? JSON.parse(imagesJson) : [];

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string),
    categoryId: formData.get('categoryId') as string,
    condition: formData.get('condition') as string,
    isPrivate: formData.get('isPrivate') === 'true',
    images, // Array of URLs
    committeePercentage: parseInt(formData.get('committeePercentage') as string || '0'),
  };

  // Validate with Zod
  const parsed = createMarketplaceItemSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  // Insert into database
  const { data, error } = await supabase
    .from('marketplace_items')
    .insert({
      ...parsed.data,
      seller_id: user.id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return { error: 'Errore durante la creazione' };
  }

  return { success: true, itemId: data.id };
}
```

---

## Validation Schema

```typescript
// lib/utils/validators.ts
import { z } from 'zod';

export const createMarketplaceItemSchema = z.object({
  title: z.string().min(5).max(500),
  description: z.string().min(20),
  price: z.number().int().min(0),
  categoryId: z.string().uuid(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  isPrivate: z.boolean().default(false),
  committeePercentage: z.number().int().min(0).max(100).default(0),

  // Images validation
  images: z
    .array(z.string().url('URL immagine non valido'))
    .min(1, 'Carica almeno 1 immagine')
    .max(6, 'Massimo 6 immagini')
    .default([]),
});
```

---

## Styling Customization

### Custom Upload Zone Colors

```tsx
<MultiImageUpload
  bucket="marketplace-images"
  currentImages={images}
  onImagesChange={setImages}
  className="border-blue-500 hover:border-blue-600"
/>
```

### Custom Gallery Layout

```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  <ImageGallery images={images} alt={title} />
</div>
```

---

## Accessibility Features

Both components include:
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ Focus management
- ✅ Alt text on all images

### Keyboard Shortcuts

**ImageGallery:**
- `←` Previous image
- `→` Next image
- `ESC` Close lightbox
- `Tab` Navigate controls
- `Enter/Space` Activate buttons

**MultiImageUpload:**
- `Tab` Navigate to upload zone
- `Enter/Space` Open file browser

---

## Error Handling

### Upload Errors

```tsx
<MultiImageUpload
  bucket="marketplace-images"
  currentImages={images}
  onImagesChange={(newImages) => {
    setImages(newImages);
    // Optional: Track successful uploads
    console.log(`${newImages.length} images uploaded`);
  }}
/>
```

Common errors handled automatically:
- ✅ Invalid file type → Toast error
- ✅ File too large → Toast error
- ✅ Max images exceeded → Toast error
- ✅ Upload failed → Toast error + console log

### Gallery Errors

```tsx
<ImageGallery
  images={product.images || []}  // Fallback to empty array
  alt={product.title || 'Prodotto'}  // Fallback alt text
/>
```

Shows empty state if no images provided.

---

## Performance Tips

### Optimize Upload Performance

```tsx
// Compress images before upload (future enhancement)
const compressImage = async (file: File) => {
  // Implementation using canvas or image library
};

// Current: Files uploaded as-is
// Recommendation: Add compression in future version
```

### Optimize Gallery Performance

```tsx
// Images already optimized via Next.js Image
// Automatically lazy loads
// Automatically responsive

<ImageGallery
  images={images}
  alt={title}
  // Uses Next.js Image with:
  // - sizes="(max-width: 768px) 100vw, 50vw"
  // - priority={index === 0}
  // - loading="lazy" for others
/>
```

---

## Common Patterns

### Pattern 1: Edit Form with Existing Images

```tsx
'use client';

import { useState, useEffect } from 'react';
import { MultiImageUpload } from '@/components/molecules/multi-image-upload';

export default function EditForm({ item }) {
  // Initialize with existing images
  const [images, setImages] = useState<string[]>(item.images || []);

  return (
    <form>
      <MultiImageUpload
        bucket="marketplace-images"
        currentImages={images}
        onImagesChange={setImages}
        maxImages={6}
        userId={item.seller_id}
        itemId={item.id}
      />
    </form>
  );
}
```

### Pattern 2: Multiple Galleries on Same Page

```tsx
export default function ComparisonPage({ product1, product2 }) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2>{product1.title}</h2>
        <ImageGallery images={product1.images} alt={product1.title} />
      </div>

      <div>
        <h2>{product2.title}</h2>
        <ImageGallery images={product2.images} alt={product2.title} />
      </div>
    </div>
  );
}
```

### Pattern 3: Conditional Upload

```tsx
export default function ConditionalForm() {
  const [showUpload, setShowUpload] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  return (
    <form>
      <label>
        <input
          type="checkbox"
          checked={showUpload}
          onChange={(e) => setShowUpload(e.target.checked)}
        />
        Aggiungi immagini
      </label>

      {showUpload && (
        <MultiImageUpload
          bucket="marketplace-images"
          currentImages={images}
          onImagesChange={setImages}
        />
      )}
    </form>
  );
}
```

---

## Troubleshooting

### Issue: Images not uploading

**Check:**
1. Supabase bucket exists: `marketplace-images`
2. RLS policies configured correctly
3. User is authenticated
4. Environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: Gallery not displaying

**Check:**
1. Images array is valid: `images={product.images || []}`
2. URLs are public and accessible
3. Next.js Image domains configured in `next.config.js`

### Issue: Upload succeeds but form fails

**Check:**
1. Images added to FormData: `formData.append('images', JSON.stringify(images))`
2. Server action parses JSON: `JSON.parse(formData.get('images'))`
3. Validation schema matches: min 1, max 6 images

---

## Migration Guide

### Migrating from Old Image System

**Old:**
```tsx
<input type="file" name="image" />
```

**New:**
```tsx
const [images, setImages] = useState<string[]>([]);

<MultiImageUpload
  bucket="marketplace-images"
  currentImages={images}
  onImagesChange={setImages}
/>
```

**Server Action Update:**
```typescript
// OLD
const image = formData.get('image') as File;
// Upload and get URL

// NEW
const images = JSON.parse(formData.get('images') as string);
// Already uploaded, just use URLs
```

---

## FAQ

**Q: Can I use a different storage bucket?**
A: Yes, just change the `bucket` prop to your bucket name.

**Q: Can I customize the max file size?**
A: Yes, use the `maxSizeMB` prop.

**Q: Can I support more than 6 images?**
A: Yes, use the `maxImages` prop, but update the validator too.

**Q: Can I reorder images?**
A: Not yet. This is a planned future enhancement.

**Q: Can I use this for other content types (PDFs, videos)?**
A: Not currently. It's designed for images only (JPEG, PNG, WebP).

**Q: Does it work with React Native?**
A: No, it's built for Next.js web apps with shadcn/ui.

**Q: Can I disable drag & drop?**
A: Not directly, but you can hide the drop zone and only show the file browser button.

**Q: How do I handle image deletion from storage?**
A: Currently, deletion is manual. Implement a cleanup job or handle in the delete server action.

---

## Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Zod Validation](https://zod.dev/)

---

**Last Updated:** 2025-11-03
**Component Version:** 1.0.0
**Compatibility:** Next.js 14+, React 18+
