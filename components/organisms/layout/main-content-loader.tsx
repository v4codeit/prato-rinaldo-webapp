/**
 * Main Content Loader (Minimal)
 *
 * Subtle loading fallback for Suspense boundaries.
 * Chosen style: "Fade sottile" - minimal, non-intrusive placeholder.
 *
 * This loader:
 * - Takes minimal space (py-24 for centering)
 * - No spinner (minimal choice)
 * - Subtle opacity for smooth appearance
 * - Maintains layout stability during transitions
 * - Accessibility: aria-live="polite" for screen readers
 */
export function MainContentLoader() {
  return (
    <div
      className="flex items-center justify-center py-24 opacity-70"
      role="status"
      aria-live="polite"
      aria-label="Caricamento contenuto"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Subtle animated dots (minimal indicator) */}
        <div className="flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
          <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse [animation-delay:300ms]" />
        </div>
        <span className="sr-only">Caricamento in corso...</span>
      </div>
    </div>
  );
}
