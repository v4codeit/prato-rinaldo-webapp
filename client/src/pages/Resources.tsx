import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FileText, BookOpen, Download } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Resources() {
  const { user, isAuthenticated } = useAuth();
  const { data: documents } = trpc.resources.listDocuments.useQuery(undefined, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });
  const { data: tutorials } = trpc.resources.listTutorials.useQuery(undefined, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });

  if (!isAuthenticated || user?.verificationStatus !== 'approved') {
    if (typeof window !== 'undefined') {
      window.location.href = getLoginUrl();
    }
    return null;
  }

  return (
    <div className="container py-8 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Risorse</h1>
        <p className="text-lg text-muted-foreground">Guide, tutorial e documenti utili per la comunità</p>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Tutorial
        </h2>
        {tutorials && tutorials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tutorials.map((tutorial) => (
              <Card key={tutorial.id}>
                <CardHeader>
                  <CardTitle>{tutorial.title}</CardTitle>
                  {tutorial.category && <Badge variant="secondary">{tutorial.category}</Badge>}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{tutorial.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nessun tutorial disponibile al momento</p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Documenti
        </h2>
        {documents && documents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle>{doc.title}</CardTitle>
                      {doc.category && <CardDescription>{doc.category}</CardDescription>}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Scarica
                      </a>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nessun documento disponibile al momento</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

