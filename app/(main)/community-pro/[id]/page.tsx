import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getProfessionalById } from '@/app/actions/service-profiles';
import { Star, Phone, Mail, MapPin, Globe, Award, Pencil } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ReviewForm } from '@/components/molecules/review-form';
import { ReviewsList } from '@/components/molecules/reviews-list';
import { createClient } from '@/lib/supabase/server';
import { getShortName } from '@/lib/utils/format';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getProfessionalById(id);

  if (!result.professional) {
    return {
      title: 'Professionista non trovato',
    };
  }

  return {
    title: `${result.professional.business_name} - Community Pro`,
    description: result.professional.description,
  };
}

export default async function ProfessionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getProfessionalById(id);

  if (!result.professional) {
    notFound();
  }

  const { professional, reviews } = result;

  // Check if current user is the profile owner
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user && professional.user_id === user.id;

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Image
                src={professional.logo_url || professional.user?.avatar || '/default-avatar.png'}
                alt={professional.business_name || 'Professional'}
                width={80}
                height={80}
                className={professional.logo_url ? 'rounded-lg object-cover' : 'rounded-full'}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl mb-2">{professional.business_name}</CardTitle>
                    <CardDescription className="text-base">
                      {getShortName(professional.user?.name || '')}
                    </CardDescription>
                  </div>
                  {isOwner && (
                    <Link href={`/community-pro/${professional.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifica
                      </Button>
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{professional.category}</Badge>
                  {professional.avg_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{professional.avg_rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({professional.reviews_count} recensioni)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Descrizione</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {professional.description}
              </p>
            </div>

            {professional.services && professional.services.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Servizi</h3>
                <div className="flex flex-wrap gap-2">
                  {professional.services.map((service: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {professional.certifications && professional.certifications.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certificazioni
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {professional.certifications.map((cert: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Portfolio Section */}
            {professional.portfolio_images && professional.portfolio_images.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Portfolio</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {professional.portfolio_images.map((imageUrl: string, index: number) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-lg border">
                      <Image
                        src={imageUrl}
                        alt={`${professional.business_name} portfolio ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contatti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {professional.contact_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${professional.contact_phone}`} className="hover:underline">
                  {professional.contact_phone}
                </a>
              </div>
            )}
            {professional.contact_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${professional.contact_email}`} className="hover:underline">
                  {professional.contact_email}
                </a>
              </div>
            )}
            {professional.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{professional.address}</span>
              </div>
            )}
            {professional.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={professional.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {professional.website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section - Client Component */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recensioni ({reviews.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReviewForm professionalId={id} />
            <ReviewsList reviews={reviews} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
