import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/molecules/empty-state';
import { getDocuments } from '@/app/actions/resources';
import { FileText, Download } from 'lucide-react';

export const metadata = {
  title: 'Documenti',
  description: 'Documenti ufficiali e modulistica',
};

export default async function DocumentsPage() {
  const { documents } = await getDocuments();

  return (
    <div className="container py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Documenti</h1>
        <p className="text-lg text-muted-foreground">
          Accedi ai documenti ufficiali, regolamenti e modulistica
        </p>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nessun documento disponibile"
          description="Al momento non ci sono documenti pubblicati"
        />
      ) : (
        <div className="space-y-4">
          {documents.map((doc: any) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{doc.title}</CardTitle>
                      <CardDescription>{doc.description}</CardDescription>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="outline">{doc.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doc.downloads_count} download
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Scarica
                    </a>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
