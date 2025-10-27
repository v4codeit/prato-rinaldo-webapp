import Link from 'next/link';
import { ROUTES } from '@/lib/utils/constants';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Pagina non trovata</h2>
        <p className="text-muted-foreground mb-8">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
