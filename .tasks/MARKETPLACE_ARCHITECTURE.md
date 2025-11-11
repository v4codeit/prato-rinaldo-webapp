# Marketplace Image System - Architecture Diagram

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                                                                   │
│  ┌──────────────────────────┐    ┌──────────────────────────┐  │
│  │  Create/Edit Form        │    │   Detail Page             │  │
│  │  /marketplace/new        │    │   /marketplace/[id]       │  │
│  │                          │    │                           │  │
│  │  ┌──────────────────┐   │    │   ┌──────────────────┐   │  │
│  │  │ MultiImageUpload │   │    │   │  ImageGallery    │   │  │
│  │  │                  │   │    │   │                  │   │  │
│  │  │ - Drag & Drop    │   │    │   │  - Main Image    │   │  │
│  │  │ - File Browser   │   │    │   │  - Thumbnails    │   │  │
│  │  │ - Validation     │   │    │   │  - Navigation    │   │  │
│  │  │ - Preview Grid   │   │    │   │  - Lightbox      │   │  │
│  │  └──────────────────┘   │    │   └──────────────────┘   │  │
│  └──────────────────────────┘    └──────────────────────────┘  │
└───────────────────────┬──────────────────────┬──────────────────┘
                        │                      │
                        │ Upload Images        │ Fetch Images
                        ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE STORAGE                              │
│                                                                   │
│  Bucket: marketplace-images                                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │  {userId}/                                         │         │
│  │    └── {itemId}/                                   │         │
│  │          ├── image-1730620800000-abc123.jpg        │         │
│  │          ├── image-1730620801000-def456.png        │         │
│  │          └── image-1730620802000-ghi789.webp       │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                   │
│  RLS Policies:                                                   │
│  ├─ Upload: Owner only (auth.uid() = folder name)               │
│  ├─ Read: Public                                                 │
│  └─ Delete: Owner only (auth.uid() = folder name)               │
│                                                                   │
│  Public URLs:                                                    │
│  https://project.supabase.co/storage/v1/object/public/...       │
└───────────────────────┬───────────────────────────────────────┬─┘
                        │                                       │
                        │ Save URLs                             │ Read URLs
                        ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
│                                                                   │
│  Table: marketplace_items                                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │  id              UUID PRIMARY KEY                   │         │
│  │  seller_id       UUID → users(id)                   │         │
│  │  title           TEXT                               │         │
│  │  description     TEXT                               │         │
│  │  price           INTEGER                            │         │
│  │  images          JSONB  ← ["url1", "url2", "url3"]  │         │
│  │  status          TEXT (pending/approved/rejected)   │         │
│  │  created_at      TIMESTAMP                          │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### MultiImageUpload Component

```
┌─────────────────────────────────────────────────────────┐
│              MultiImageUpload                            │
│                                                          │
│  Props:                                                  │
│  ├─ bucket: "marketplace-images"                        │
│  ├─ currentImages: string[]                             │
│  ├─ onImagesChange: (images) => void                    │
│  ├─ maxImages: 6                                        │
│  ├─ maxSizeMB: 10                                       │
│  ├─ userId: string                                      │
│  └─ itemId: string                                      │
│                                                          │
│  State:                                                  │
│  ├─ uploading: boolean                                  │
│  └─ dragActive: boolean                                 │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Upload Zone (Drag & Drop)              │    │
│  │                                                 │    │
│  │  [Upload Icon]                                  │    │
│  │  "Trascina le immagini qui o sfoglia"          │    │
│  │  "JPEG, PNG o WebP (max 10MB)"                 │    │
│  │  "0 / 6 immagini caricate"                     │    │
│  │                                                 │    │
│  │  <input type="file" multiple accept="image/*"> │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Preview Grid                            │    │
│  │                                                 │    │
│  │  ┌───────┐  ┌───────┐  ┌───────┐              │    │
│  │  │ [IMG] │  │ [IMG] │  │ [IMG] │              │    │
│  │  │   [X] │  │   [X] │  │   [X] │              │    │
│  │  │Copert │  │   2   │  │   3   │              │    │
│  │  └───────┘  └───────┘  └───────┘              │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Event Handlers:                                        │
│  ├─ onDragOver → setDragActive(true)                   │
│  ├─ onDragLeave → setDragActive(false)                 │
│  ├─ onDrop → handleFiles(files)                        │
│  ├─ onChange → handleFiles(files)                      │
│  └─ onRemove → removeImage(index)                      │
│                                                          │
│  Upload Flow:                                           │
│  1. validateFile(file) → Check type & size             │
│  2. uploadFile(file) → Upload to Supabase              │
│  3. getPublicUrl(path) → Get URL                       │
│  4. onImagesChange([...images, url]) → Update state    │
│  5. toast.success() → Notify user                      │
└─────────────────────────────────────────────────────────┘
```

### ImageGallery Component

```
┌─────────────────────────────────────────────────────────┐
│              ImageGallery                                │
│                                                          │
│  Props:                                                  │
│  ├─ images: string[]                                    │
│  └─ alt: string                                         │
│                                                          │
│  State:                                                  │
│  ├─ currentIndex: number                                │
│  └─ lightboxOpen: boolean                               │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Main Image Display                      │    │
│  │                                                 │    │
│  │  [◄]      ┌───────────────────┐      [►]      │    │
│  │           │                   │                │    │
│  │           │   Main Image      │                │    │
│  │           │   (aspect-square) │                │    │
│  │           │                   │                │    │
│  │           └───────────────────┘                │    │
│  │           "3 / 6"  "Clicca per ingrandire"     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Thumbnail Grid                          │    │
│  │                                                 │    │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │    │
│  │  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │+1│          │    │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘               │    │
│  │   ▲ Active                                     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Lightbox (Dialog Modal)                 │    │
│  │                                                 │    │
│  │  [X] Close                    "← → Naviga ESC" │    │
│  │                                                 │    │
│  │  [◄]     ┌─────────────────────────┐     [►]  │    │
│  │          │                         │          │    │
│  │          │   Fullscreen Image      │          │    │
│  │          │   (object-contain)      │          │    │
│  │          │                         │          │    │
│  │          └─────────────────────────┘          │    │
│  │                                                 │    │
│  │          "3 / 6"                               │    │
│  │                                                 │    │
│  │  [1] [2] [3] [4] [5] [6]  ← Thumbnail strip   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Event Handlers:                                        │
│  ├─ onClick(thumbnail) → setCurrentIndex(i)            │
│  ├─ onClick(main) → setLightboxOpen(true)              │
│  ├─ onPrevious → setCurrentIndex(i - 1)                │
│  ├─ onNext → setCurrentIndex(i + 1)                    │
│  ├─ onKeyDown(ArrowLeft) → handlePrevious()            │
│  ├─ onKeyDown(ArrowRight) → handleNext()               │
│  └─ onKeyDown(Escape) → setLightboxOpen(false)         │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Upload Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Drag/Drop or Browse
     │
     ▼
┌─────────────────┐
│ MultiImageUpload│
│  Component      │
└────┬────────────┘
     │
     │ 2. Validate File
     │    - Check type (JPEG/PNG/WebP)
     │    - Check size (<10MB)
     │    - Check count (<6)
     │
     ▼
     ├─ ✗ Invalid → Toast Error
     │
     └─ ✓ Valid
        │
        │ 3. Upload to Supabase
        │
        ▼
   ┌──────────────────┐
   │ Supabase Storage │
   │  marketplace-    │
   │    images/       │
   └────┬─────────────┘
        │
        │ 4. Get Public URL
        │
        ▼
   ┌──────────────────┐
   │  Public URL      │
   │  https://...     │
   └────┬─────────────┘
        │
        │ 5. Update State
        │
        ▼
   ┌──────────────────┐
   │  images: [       │
   │    "url1",       │
   │    "url2"        │
   │  ]               │
   └────┬─────────────┘
        │
        │ 6. On Form Submit
        │
        ▼
   ┌──────────────────┐
   │  FormData        │
   │  images: JSON    │
   └────┬─────────────┘
        │
        │ 7. Server Action
        │
        ▼
   ┌──────────────────┐
   │  Validate with   │
   │  Zod Schema      │
   └────┬─────────────┘
        │
        ├─ ✗ Invalid → Error Response
        │
        └─ ✓ Valid
           │
           │ 8. Save to Database
           │
           ▼
      ┌──────────────────┐
      │  marketplace_    │
      │    items         │
      │  images: JSONB   │
      └──────────────────┘
```

### Display Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Visit /marketplace/[id]
     │
     ▼
┌─────────────────┐
│  Server Action  │
│  getItemById()  │
└────┬────────────┘
     │
     │ 2. Query Database
     │
     ▼
┌─────────────────┐
│  marketplace_   │
│    items        │
│  images: JSONB  │
└────┬────────────┘
     │
     │ 3. Return Data
     │    images: ["url1", "url2"]
     │
     ▼
┌─────────────────┐
│  Detail Page    │
│  Component      │
└────┬────────────┘
     │
     │ 4. Pass to Gallery
     │
     ▼
┌─────────────────┐
│  ImageGallery   │
│  Component      │
└────┬────────────┘
     │
     │ 5. Render Images
     │    - Main image (index 0)
     │    - Thumbnails (all)
     │
     ▼
┌─────────────────┐
│  Next.js Image  │
│  Optimization   │
└────┬────────────┘
     │
     │ 6. Load from Supabase
     │
     ▼
┌─────────────────┐
│  Supabase CDN   │
│  (Public URL)   │
└────┬────────────┘
     │
     │ 7. Display to User
     │
     ▼
┌─────────────────┐
│   Rendered      │
│   Gallery       │
└─────────────────┘
```

---

## State Management

### Form State (Create/Edit Page)

```typescript
// Parent component state
const [images, setImages] = useState<string[]>([]);

// Flow:
// 1. User uploads → Supabase Storage → URL returned
// 2. URL added to images array → setImages([...images, url])
// 3. Component re-renders with new thumbnail
// 4. On submit → JSON.stringify(images) → FormData
// 5. Server receives JSON string → JSON.parse() → array
```

### Gallery State (Detail Page)

```typescript
// Gallery component state
const [currentIndex, setCurrentIndex] = useState(0);
const [lightboxOpen, setLightboxOpen] = useState(false);

// Flow:
// 1. Click thumbnail → setCurrentIndex(i) → main image changes
// 2. Click main → setLightboxOpen(true) → modal opens
// 3. Keyboard arrow → setCurrentIndex(i ± 1) → navigate
// 4. Press ESC → setLightboxOpen(false) → modal closes
```

---

## Security Architecture

### RLS Policies (Row Level Security)

```sql
-- Storage Object Policies

-- 1. Upload Policy (INSERT)
CREATE POLICY "marketplace_images_insert_owner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
-- Ensures user can only upload to their own folder

-- 2. Read Policy (SELECT)
CREATE POLICY "marketplace_images_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace-images');
-- Anyone can view images (public marketplace)

-- 3. Delete Policy (DELETE)
CREATE POLICY "marketplace_images_delete_owner"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
-- Ensures user can only delete their own images
```

### Validation Layers

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Client-Side Validation                │
│  ├─ File type check (JPEG/PNG/WebP)             │
│  ├─ File size check (<10MB)                     │
│  ├─ Count check (<6 images)                     │
│  └─ Instant feedback to user                    │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Layer 2: Storage RLS Policies                  │
│  ├─ User authentication required                │
│  ├─ Path validation (user folder only)          │
│  └─ Bucket-level restrictions                   │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Layer 3: Server-Side Validation (Zod)          │
│  ├─ URL format validation                       │
│  ├─ Array length validation (1-6)               │
│  ├─ Type validation (string[])                  │
│  └─ Business logic validation                   │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Layer 4: Database Constraints                  │
│  ├─ JSONB type enforcement                      │
│  ├─ NOT NULL constraints                        │
│  └─ Foreign key constraints                     │
└─────────────────────────────────────────────────┘
```

---

## Performance Optimization

### Image Loading Strategy

```
Priority Loading:
┌──────────────────────────────────────┐
│  Main Image (currentIndex)           │
│  ├─ priority={true}                  │
│  ├─ loading="eager"                  │
│  └─ sizes="50vw"                     │
└──────────────────────────────────────┘

Lazy Loading:
┌──────────────────────────────────────┐
│  Thumbnails                          │
│  ├─ loading="lazy"                   │
│  ├─ sizes="10vw"                     │
│  └─ Load on scroll/demand            │
└──────────────────────────────────────┘

Responsive Sizes:
┌──────────────────────────────────────┐
│  Mobile:   100vw (full width)        │
│  Tablet:   50vw  (half width)        │
│  Desktop:  33vw  (third width)       │
└──────────────────────────────────────┘
```

### Upload Optimization

```
Parallel Upload:
┌──────────────────────────────────────┐
│  Promise.all([                       │
│    uploadFile(file1),                │
│    uploadFile(file2),                │
│    uploadFile(file3)                 │
│  ])                                  │
│  └─ Faster than sequential           │
└──────────────────────────────────────┘

File Validation:
┌──────────────────────────────────────┐
│  Before Upload (Client)              │
│  ├─ Type check: ~1ms                 │
│  ├─ Size check: ~1ms                 │
│  └─ Count check: ~1ms                │
│  Total: ~3ms (instant feedback)      │
└──────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Try to upload file                  │
└──────┬───────────────────────────────┘
       │
       ├─→ ✗ Wrong type
       │     └─→ toast.error("Formato non supportato")
       │         └─→ File rejected, no upload
       │
       ├─→ ✗ Too large
       │     └─→ toast.error("File troppo grande")
       │         └─→ File rejected, no upload
       │
       ├─→ ✗ Too many
       │     └─→ toast.error("Massimo 6 immagini")
       │         └─→ Upload blocked
       │
       ├─→ ✗ Upload fails
       │     └─→ console.error(error)
       │         └─→ toast.error("Errore upload")
       │             └─→ State not updated
       │
       └─→ ✓ Success
             └─→ State updated
                 └─→ toast.success("Immagine caricata")
                     └─→ Thumbnail displayed
```

---

## Mobile Responsiveness

```
Desktop (>768px):
┌────────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │                 │  │                         │ │
│  │  Image Gallery  │  │  Product Details        │ │
│  │  (50% width)    │  │  (50% width)            │ │
│  │                 │  │                         │ │
│  └─────────────────┘  └─────────────────────────┘ │
└────────────────────────────────────────────────────┘

Mobile (<768px):
┌────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────┐   │
│  │                                            │   │
│  │  Image Gallery                             │   │
│  │  (100% width)                              │   │
│  │                                            │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │                                            │   │
│  │  Product Details                           │   │
│  │  (100% width)                              │   │
│  │                                            │   │
│  └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘

Touch Interactions:
├─ Tap thumbnail → Change main image
├─ Tap main image → Open lightbox
├─ Tap lightbox → Close (backdrop click)
├─ Swipe left/right → Navigate (future enhancement)
└─ Pinch zoom → Zoom in/out (future enhancement)
```

---

## Technology Stack Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Frontend Layer                    │
├─────────────────────────────────────────────────────┤
│  Next.js 14+ (App Router)                           │
│  ├─ React 18+ (Server & Client Components)          │
│  ├─ TypeScript (Type Safety)                        │
│  └─ Tailwind CSS (Styling)                          │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────┐
│                 Component Layer                      │
├─────────────────────────────────────────────────────┤
│  shadcn/ui Components                               │
│  ├─ Dialog (Radix UI)                               │
│  ├─ Button                                          │
│  ├─ Card                                            │
│  └─ Toast (Sonner)                                  │
│                                                      │
│  Custom Components                                  │
│  ├─ MultiImageUpload                                │
│  └─ ImageGallery                                    │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────┐
│                  Storage Layer                       │
├─────────────────────────────────────────────────────┤
│  Supabase Storage                                   │
│  ├─ Bucket: marketplace-images                      │
│  ├─ RLS Policies (Security)                         │
│  └─ CDN (Performance)                               │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────┐
│                 Database Layer                       │
├─────────────────────────────────────────────────────┤
│  Supabase PostgreSQL                                │
│  ├─ Table: marketplace_items                        │
│  ├─ Column: images (JSONB)                          │
│  └─ RLS Policies (Row Level Security)               │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────┐
│                Validation Layer                      │
├─────────────────────────────────────────────────────┤
│  Zod Schema Validation                              │
│  ├─ createMarketplaceItemSchema                     │
│  └─ Runtime type checking                           │
└─────────────────────────────────────────────────────┘
```

---

## File Structure

```
pratorinaldo-next/
│
├── app/
│   ├── (private)/
│   │   └── marketplace/
│   │       └── new/
│   │           └── page.tsx ───────────► Create form with MultiImageUpload
│   │
│   ├── (public)/
│   │   └── marketplace/
│   │       ├── page.tsx ───────────────► Listing page
│   │       └── [id]/
│   │           └── page.tsx ───────────► Detail page with ImageGallery
│   │
│   └── actions/
│       └── marketplace.ts ─────────────► Server actions (CRUD)
│
├── components/
│   ├── molecules/
│   │   ├── multi-image-upload.tsx ────► Upload component (NEW)
│   │   └── image-gallery.tsx ─────────► Gallery component (NEW)
│   │
│   └── ui/ ────────────────────────────► shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts ─────────────────► Client-side Supabase
│   │   └── server.ts ─────────────────► Server-side Supabase
│   │
│   └── utils/
│       └── validators.ts ─────────────► Zod schemas (UPDATED)
│
└── .tasks/
    ├── MARKETPLACE_TASKS.md ──────────► Original task document
    ├── MARKETPLACE_IMPLEMENTATION_REPORT.md ► Technical docs
    ├── MARKETPLACE_USAGE_EXAMPLES.md ─► Code examples
    ├── MARKETPLACE_SUMMARY.md ────────► Executive summary
    └── MARKETPLACE_ARCHITECTURE.md ───► This document
```

---

## Dependencies Graph

```
MultiImageUpload Component
├── Dependencies:
│   ├── react (useState, useCallback, useRef)
│   ├── next/image
│   ├── @/components/ui/button
│   ├── @/components/ui/card
│   ├── @/lib/supabase/client
│   ├── lucide-react (Icons)
│   ├── sonner (toast)
│   └── @/lib/utils (cn)
│
└── Used by:
    └── app/(private)/marketplace/new/page.tsx

ImageGallery Component
├── Dependencies:
│   ├── react (useState, useEffect, useCallback)
│   ├── next/image
│   ├── @/components/ui/button
│   ├── @/components/ui/dialog
│   ├── lucide-react (Icons)
│   └── @/lib/utils (cn)
│
└── Used by:
    └── app/(public)/marketplace/[id]/page.tsx

No circular dependencies ✓
No external package installs required ✓
```

---

## Deployment Pipeline

```
┌──────────────┐
│  Development │
└──────┬───────┘
       │
       │ git commit
       │
       ▼
┌──────────────┐
│  GitHub Repo │
└──────┬───────┘
       │
       │ git push
       │
       ▼
┌──────────────────────────────────┐
│  CI/CD (GitHub Actions)          │
│  ├─ npm install                  │
│  ├─ npm run type-check           │
│  ├─ npm run build                │
│  └─ Tests (future)               │
└──────┬───────────────────────────┘
       │
       │ ✓ Build success
       │
       ▼
┌──────────────────────────────────┐
│  Vercel Deployment               │
│  ├─ Deploy to staging            │
│  ├─ Preview URL generated        │
│  └─ Automatic domain assignment  │
└──────┬───────────────────────────┘
       │
       │ ✓ QA approval
       │
       ▼
┌──────────────────────────────────┐
│  Production                      │
│  ├─ Deploy to production domain  │
│  ├─ CDN distribution             │
│  └─ Live monitoring              │
└──────────────────────────────────┘

Environment Variables:
├── NEXT_PUBLIC_SUPABASE_URL
└── NEXT_PUBLIC_SUPABASE_ANON_KEY

Supabase Requirements:
├── Bucket: marketplace-images (public)
└── RLS Policies configured
```

---

## Future Enhancements Architecture

### Phase 1: Image Reordering

```
┌─────────────────────────────────────┐
│  MultiImageUpload (Enhanced)        │
│  ├─ react-beautiful-dnd             │
│  ├─ Drag to reorder thumbnails      │
│  └─ onReorder callback              │
└─────────────────────────────────────┘
```

### Phase 2: Image Processing

```
┌─────────────────────────────────────┐
│  Supabase Edge Function             │
│  ├─ On upload trigger               │
│  ├─ Resize (thumb, medium, large)   │
│  ├─ Compress (WebP conversion)      │
│  └─ Save multiple versions          │
└─────────────────────────────────────┘
```

### Phase 3: Advanced Gallery

```
┌─────────────────────────────────────┐
│  ImageGallery (Enhanced)            │
│  ├─ Swipe gestures (mobile)         │
│  ├─ Pinch zoom                      │
│  ├─ Slideshow mode                  │
│  └─ Image comparison slider         │
└─────────────────────────────────────┘
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-03
**Maintained By:** Development Team
