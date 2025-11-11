# WYSIWYG Editor Research for Prato Rinaldo Platform

**Date:** November 5, 2025  
**Platform Requirements:** Next.js 16 + React 19 + TypeScript + Supabase Storage Integration

## Executive Summary

After comprehensive research, **TipTap** emerges as the recommended choice for the Prato Rinaldo community platform, with **Lexical** as a strong alternative. Both editors excel in Next.js 16 compatibility, React 19 support, and the feature set required for community content management.

---

## 1. TIPTAP (RECOMMENDED)

### Overview
Headless, framework-agnostic rich text editor built on ProseMirror with 100+ extensions.

### Compatibility
- Next.js 16: Full support with official Next.js documentation
- React 19: Compatible (confirmed via reactjs-tiptap-editor package)
- TypeScript: Full support
- Server Components: Requires 'use client' wrapper (standard pattern)

### Bundle Size
- Core: 89.5 kB (minified + gzipped)
- With common extensions: ~120-150 kB
- Assessment: Moderate - acceptable for most use cases

### Features
- Markdown support (via @tiptap/extension-markdown)
- Code blocks with syntax highlighting (Highlight.js integration)
- Image upload integration (custom plugins)
- Drag-and-drop file management
- Real-time collaborative editing (via Yjs)
- 100+ extensions including tables, lists, mentions
- Mobile responsive out of the box
- Built-in undo/redo

### Supabase Integration
**Difficulty:** LOW-MODERATE
- No native Supabase Storage integration, but straightforward
- Create custom image upload extension
- Use existing Supabase Storage patterns from codebase
- Pattern: Form → Server Action → Supabase Storage → Return signed URL
- Excellent community documentation

### Learning Curve
Moderate - Good documentation and many examples

### Active Maintenance
YES - Regular updates, large active community, production-ready

### License
MIT (Open Source - Free)

### Pros
- Excellent documentation and huge community
- Built-in collaborative editing support
- Highly extensible and customizable
- Great for hybrid Markdown/WYSIWYG workflows
- Proven in production by many platforms
- Works seamlessly with shadcn/ui

### Cons
- Requires 'use client' directive (not compatible with Server Components)
- ProseMirror knowledge helpful for advanced customization
- Bundle size larger than Slate

---

## 2. LEXICAL (STRONG ALTERNATIVE)

### Overview
Meta's modern rich text editor framework designed for performance and scalability.

### Compatibility
- Next.js 16: Full support (confirmed via community examples)
- React 19: Full support (official React bindings)
- TypeScript: Full support
- Server Components: Requires 'use client' wrapper

### Bundle Size
- @lexical/core: ~50 kB (estimated)
- @lexical/rich-text with plugins: ~80-100 kB
- Assessment: BEST-IN-CLASS performance

### Features
- Markdown support (via plugins)
- Code blocks with syntax highlighting
- Image handling with custom plugins
- Advanced undo/redo with history
- Real-time collaboration support (via Yjs)
- Mobile responsive
- Plugin architecture (nodes + transforms)

### Supabase Integration
**Difficulty:** LOW-MODERATE
- Similar to TipTap - requires custom image plugin
- Meta's architecture makes plugin development cleaner
- Fewer community examples than TipTap

### Learning Curve
Moderate-Steep - Smaller community, requires understanding node/transform system

### Active Maintenance
YES - Backed by Meta, regular updates, production-ready

### License
MIT (Open Source - Free)

### Pros
- Smallest bundle size among comparable editors
- Meta's backing ensures long-term maintenance
- Modern architecture built from lessons of Draft.js
- Excellent performance characteristics
- Official React/Solid/Vue/Svelte bindings

### Cons
- Smaller community than TipTap
- Fewer third-party plugins/extensions
- Steeper learning curve
- Less collaborative editing examples

---

## 3. PLATE (SLATE-BASED)

### Overview
React-first, type-safe editor built on Slate.js with batteries included.

### Compatibility
- Next.js 16: Good support
- React 19: Compatible
- TypeScript: Full support with type safety
- Server Components: Requires 'use client' wrapper

### Bundle Size
- Slate core: ~80 kB (including dependencies)
- Full Plate with extensions: ~150-200 kB
- Assessment: Larger than TipTap

### Verdict
Not recommended due to bundle size and complexity overkill for Prato Rinaldo.

---

## 4. NOVEL (TIPTAP-BASED)

### Overview
Open-source Notion-style WYSIWYG editor with AI features built on TipTap.

### Compatibility
- Next.js 16: Full support (built with Next.js 15+)
- React 19: Compatible
- TypeScript: Full support
- Server Components: Requires 'use client' wrapper

### License
Apache-2.0 (Open Source - Free)

### Verdict
Good alternative if you want Notion-style blocks. For Prato Rinaldo, base TipTap offers more flexibility.

---

## 5. QUILL

### Compatibility
- Next.js 16: Good support (requires dynamic import)
- React 19: Compatible but requires careful SSR handling
- TypeScript: Partial (react-quill-new in TypeScript)
- Server Components: NOT compatible

### Bundle Size
- Core + CSS: ~100+ kB

### Verdict
NOT recommended due to SSR complications and React 19 compatibility concerns.

---

## BUNDLE SIZE COMPARISON

| Editor | Size | Assessment |
|--------|------|------------|
| Lexical | 50-100 kB | Smallest |
| Slate | ~80 kB | Small |
| TipTap | 89.5-150 kB | Moderate |
| Quill | 100+ kB | Large |
| Plate | 150-200 kB | Largest |

---

## FINAL RECOMMENDATION: TIPTAP

### Why TipTap for Prato Rinaldo:

1. **Next.js 16 + React 19 Perfect Fit**
   - Official Next.js documentation
   - React 19 fully compatible
   - TypeScript first-class support

2. **Feature Completeness**
   - Markdown + HTML hybrid editing
   - Code blocks with Highlight.js
   - Tables, lists, mentions, links
   - All features needed for community platform

3. **Supabase Integration**
   - Straightforward custom extension pattern
   - Can reuse existing Supabase Storage code patterns
   - Well-documented community examples

4. **Developer Experience**
   - Excellent documentation
   - Large, active community
   - Many shadcn/ui integration examples

5. **Bundle Size Sweet Spot**
   - 89.5 kB core is acceptable
   - Tree-shakeable
   - Performance acceptable for your use case

6. **Production Readiness**
   - Used by thousands of production platforms
   - Regular maintenance
   - MIT license (free)

7. **Extensibility**
   - 100+ community extensions
   - Easy to create custom extensions
   - Collaborative editing ready (via Yjs)

---

## INSTALLATION COMMANDS

```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm add @tiptap/extension-markdown @tiptap/extension-image
pnpm add @tiptap/extension-code-block-lowlight lowlight
pnpm add yjs y-prosemirror
```

---

## CONCLUSION

TipTap is the clear winner for Prato Rinaldo. Start with TipTap. If bundle size becomes critical, Lexical is a proven alternative.

