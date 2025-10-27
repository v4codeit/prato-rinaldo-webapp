'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/molecules/form-field';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { getProfessionalById, createReview } from '@/app/actions/service-profiles';
import { Star, Phone, Mail, MapPin, Globe, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfessionalDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [professional, setProfessional] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    setLoading(true);
    const result = await getProfessionalById(params.id);

    if (result.professional) {
      setProfessional(result.professional);
      setReviews(result.reviews);
    }

    setLoading(false);
  }

  async function handleSubmitReview(formData: FormData) {
    setSubmitting(true);

    const result = await createReview(params.id, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Recensione inviata con successo');
      setShowReviewForm(false);
      loadData();
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!professional) {
    notFound();
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <img
                src={professional.user?.avatar || '/default-avatar.png'}
                alt={professional.user?.name}
                className="w-20 h-20 rounded-full"
              />
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{professional.business_name}</CardTitle>
                <CardDescription className="text-base">
                  {professional.user?.name}
                </CardDescription>
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

        {/* Reviews */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recensioni ({reviews.length})</CardTitle>
              <Button onClick={() => setShowReviewForm(!showReviewForm)}>
                {showReviewForm ? 'Annulla' : 'Scrivi Recensione'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showReviewForm && (
              <form action={handleSubmitReview} className="p-4 border rounded-lg space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Valutazione <span className="text-destructive">*</span></Label>
                  <select
                    id="rating"
                    name="rating"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Seleziona...</option>
                    <option value="5">⭐⭐⭐⭐⭐ Eccellente</option>
                    <option value="4">⭐⭐⭐⭐ Molto Buono</option>
                    <option value="3">⭐⭐⭐ Buono</option>
                    <option value="2">⭐⭐ Discreto</option>
                    <option value="1">⭐ Scarso</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Commento <span className="text-destructive">*</span></Label>
                  <textarea
                    id="comment"
                    name="comment"
                    required
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                    placeholder="Descrivi la tua esperienza..."
                  />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Invio...' : 'Invia Recensione'}
                </Button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nessuna recensione ancora. Sii il primo a lasciare una recensione!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div key={review.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3 mb-2">
                      <img
                        src={review.reviewer?.avatar || '/default-avatar.png'}
                        alt={review.reviewer?.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{review.reviewer?.name}</p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
