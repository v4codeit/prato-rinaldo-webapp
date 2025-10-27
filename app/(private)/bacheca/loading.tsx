import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function BachecaLoading() {
  return (
    <div className="container py-12">
      <Card>
        <CardContent className="py-24">
          <div className="flex flex-col items-center justify-center gap-4">
            <Spinner className="size-12" />
            <p className="text-muted-foreground">Caricamento bacheca personale...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
