import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Users } from "lucide-react";


export default function Forum() {
  const { user, isAuthenticated } = useAuth();
  const { data: categories } = trpc.forum.listCategories.useQuery(undefined, {
    enabled: isAuthenticated && user?.verificationStatus === 'approved',
  });

  if (!isAuthenticated || user?.verificationStatus !== 'approved') {
    if (typeof window !== 'undefined') {
      window.location.href = "/login";
    }
    return null;
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Forum</h1>
        <p className="text-lg text-muted-foreground">Discuti con gli altri residenti di Prato Rinaldo</p>
      </div>

      {categories && categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {category.name}
                    </CardTitle>
                    {category.description && (
                      <CardDescription className="mt-2">{category.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    0 discussioni
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nessuna categoria forum disponibile al momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

