'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ProfessionalProfileWithActions, ProfessionalStats } from '@/types/bacheca';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/format';
import {
  Edit,
  ExternalLink,
  Briefcase,
  Tag,
  Award,
  Phone,
  Mail,
  MapPin,
  Globe,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileDisplayProps {
  professional: ProfessionalProfileWithActions;
  stats: ProfessionalStats;
}

/**
 * Professional Profile Display Component
 *
 * Full profile view with:
 * - Profile information and fields
 * - Status badge and messaging
 * - Action buttons (edit, view public)
 * - Stats card
 * - Portfolio images grid
 *
 * Mobile-first responsive: stacked on mobile, 2-column on desktop
 */
export function ProfileDisplay({ professional, stats }: ProfileDisplayProps) {
  const router = useRouter();

  // Status configuration
  const statusConfig = {
    pending: {
      icon: AlertCircle,
      variant: 'secondary' as const,
      label: 'In Revisione',
      message: 'Il tuo profilo è in attesa di approvazione. Ti contatteremo presto!',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    approved: {
      icon: CheckCircle,
      variant: 'default' as const,
      label: 'Approvato',
      message: 'Il tuo profilo è pubblico e visibile a tutti i membri.',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    rejected: {
      icon: XCircle,
      variant: 'destructive' as const,
      label: 'Rifiutato',
      message: 'Il tuo profilo non soddisfa i requisiti. Contatta il supporto per maggiori informazioni.',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  };

  const currentStatus = statusConfig[professional.status];
  const StatusIcon = currentStatus.icon;

  // Format contact info
  const formatContact = (contact: string | null, label: string) => {
    return contact || `${label} non disponibile`;
  };

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      <Card
        className={cn(
          'border-2',
          currentStatus.bgColor,
          currentStatus.borderColor
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <StatusIcon className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">Stato del Profilo:</CardTitle>
                <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
              </div>
              <CardDescription className="text-sm">
                {currentStatus.message}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Grid - Mobile: stack, Desktop: 2-column */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Info (2/3 width on desktop) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Header Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Logo/Avatar */}
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0">
                  <AvatarImage src={professional.logo_url || ''} alt={professional.business_name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(professional.business_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Business Name and Category */}
                <div className="flex-1 space-y-2 w-full sm:w-auto">
                  <CardTitle className="text-xl md:text-2xl">
                    {professional.business_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm md:text-base">{professional.category}</span>
                  </div>
                </div>

                {/* Action Buttons - Mobile: full width, Desktop: right aligned */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => router.push(`/community-pro/${professional.id}/edit`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifica
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => router.push(`/community-pro/${professional.id}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Visualizza Profilo</span>
                    <span className="sm:hidden">Vedi Profilo</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Descrizione</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {professional.description}
                </p>
              </div>

              {/* Services */}
              {professional.services && professional.services.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Servizi Offerti</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {professional.services.map((service, index) => (
                      <Badge key={index} variant="secondary" className="text-xs md:text-sm">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {professional.certifications && professional.certifications.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Certificazioni</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {professional.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-xs md:text-sm">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-3 pt-4 border-t">
                {professional.contact_phone && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-muted-foreground">Telefono</div>
                      <a href={`tel:${professional.contact_phone}`} className="font-semibold hover:text-primary">
                        {professional.contact_phone}
                      </a>
                    </div>
                  </div>
                )}
                {professional.contact_email && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-muted-foreground">Email</div>
                      <a href={`mailto:${professional.contact_email}`} className="font-semibold hover:text-primary truncate block">
                        {professional.contact_email}
                      </a>
                    </div>
                  </div>
                )}
                {professional.website && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-muted-foreground">Sito Web</div>
                      <a
                        href={professional.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline truncate block"
                      >
                        {professional.website}
                      </a>
                    </div>
                  </div>
                )}
                {professional.address && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-muted-foreground">Indirizzo</div>
                      <div className="font-semibold">{professional.address}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Images */}
          {professional.portfolio_images && professional.portfolio_images.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <CardTitle>Portfolio</CardTitle>
                  <Badge variant="secondary">{professional.portfolio_images.length}</Badge>
                </div>
                <CardDescription>Galleria dei tuoi lavori</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {professional.portfolio_images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity cursor-pointer group"
                    >
                      <Image
                        src={imageUrl}
                        alt={`Portfolio ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Stats Card (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Statistiche</CardTitle>
              <CardDescription>Panoramica del tuo profilo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Stato Profilo</div>
                <Badge variant={currentStatus.variant} className="text-sm">
                  {currentStatus.label}
                </Badge>
              </div>

              {/* Reviews Count */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Recensioni</div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold">
                    {stats.reviewsCount}
                  </span>
                </div>
                {stats.reviewsCount === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Inizia a ricevere recensioni dai tuoi clienti
                  </p>
                )}
              </div>

              {/* Portfolio Count */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Immagini Portfolio</div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {professional.portfolio_images?.length || 0}
                  </span>
                </div>
                {(!professional.portfolio_images || professional.portfolio_images.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    Aggiungi foto per mostrare i tuoi lavori
                  </p>
                )}
              </div>

              {/* Membership Info */}
              <div className="pt-4 border-t space-y-2">
                <div className="text-sm text-muted-foreground">Membro dal</div>
                <div className="text-sm font-medium">
                  {new Date(professional.created_at).toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              {/* Last Updated */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Ultimo Aggiornamento</div>
                <div className="text-sm font-medium">
                  {new Date(professional.updated_at).toLocaleDateString('it-IT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
