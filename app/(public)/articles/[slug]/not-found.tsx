import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/utils/constants';

export default function ArticleNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] py-12">
      <FileQuestion className="h-20 w-20 text-muted-foreground mb-6" />
      <h1 className="text-3xl font-bold mb-2">Articolo non trovato</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        L'articolo che stai cercando non esiste o è stato rimosso.
      </p>
      <Button asChild>
        <Link href={ROUTES.ARTICLES as any}>
          Torna agli Articoli
        </Link>
      </Button>
    </div>
  );
}
