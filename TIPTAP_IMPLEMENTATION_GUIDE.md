# TipTap Implementation Guide for Prato Rinaldo

## Installation Commands

pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm add @tiptap/extension-markdown @tiptap/extension-image
pnpm add @tiptap/extension-code-block-lowlight lowlight

## File Structure to Create

app/actions/editor.ts - Server Action for image uploads
components/organisms/tiptap-editor.tsx - Main editor component
app/(private)/agora/[id]/edit/page.tsx - Server component
app/(private)/agora/[id]/edit/editor-client.tsx - Client component

## Key Implementation Points

1. Image Upload via Server Action
   - Validates file type and size
   - Uploads to Supabase Storage bucket
   - Returns signed URL for security

2. Editor Component Features
   - Bold, Italic, Code Block, Lists
   - Image paste/drop support
   - Markdown export
   - Mobile responsive

3. Integration with Prato Rinaldo
   - Proposal descriptions (Agora)
   - Event details
   - Marketplace items
   - Community resources
   - Forum posts (Bacheca)

4. Supabase Storage Setup
   - Create bucket: article-images
   - Set RLS policies for authentication
   - Use signed URLs for security

5. Performance Optimization
   - Tree-shakeable extensions
   - Dynamic import for lazy loading
   - Cache control headers

## Next Steps

1. Install TipTap packages
2. Create server action for uploads
3. Build editor component
4. Test image upload flow
5. Integrate into existing pages
6. Add collaborative editing if needed

