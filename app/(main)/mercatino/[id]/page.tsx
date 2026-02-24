import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageGallery } from '@/components/molecules/image-gallery';
import { getMercatinoItemById, trackMercatinoView } from '@/app/actions/mercatino';
import { ContactDialog, ContactButtons } from '@/components/mercatino/contact-buttons';
import { DonationBadgeAnimated, DonationBadge } from '@/components/mercatino/donation-badge';
import {
  Euro,
  MapPin,
  Package,
  Home,
  Gift,
  Pencil,
  ArrowLeft,
  Eye,
  Maximize2,
  BedDouble,
  Building,
  Car,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getShortName, getInitials } from '@/lib/utils/format';
import {
  ROUTES,
  MERCATINO_CONDITION_LABELS,
  MERCATINO_LISTING_TYPE_LABELS,
  MERCATINO_REAL_ESTATE_TYPE_LABELS,
  MERCATINO_OBJECT_TYPE_LABELS,
} from '@/lib/utils/constants';
import { headers } from 'next/headers';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { item } = await getMercatinoItemById(id);

  if (!item) {
    return { title: 'Annuncio non trovato' };
  }

  const marketplaceItem = item as any;
  return {
    title: `${marketplaceItem.title} | Mercatino`,
    description: marketplaceItem.description?.slice(0, 160) || 'Annuncio su Mercatino Prato Rinaldo',
  };
}

// Loading skeleton
function DetailSkeleton() {
  return (
    <div className="container py-8 pb-24">
      <Skeleton className="h-8 w-32 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

// Main content component
async function MercatinoDetailContent({
  id,
  returnTo,
}: {
  id: string;
  returnTo: string;
}) {
  await connection();

  const { item } = await getMercatinoItemById(id);

  if (!item) {
    notFound();
  }

  const marketplaceItem = item as any;

  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user && marketplaceItem.seller_id === user.id;

  // Track view (server-side)
  // In production, this would use FingerprintJS on client side
  // For now, use a simple approach with user-agent
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const fingerprint = user?.id || `anon-${Date.now()}`;

  // Don't track owner's own views
  if (!isOwner) {
    await trackMercatinoView(id, fingerprint, undefined, userAgent);
  }

  // Determine item type
  const isRealEstate = marketplaceItem.listing_type === 'real_estate';
  const isGift = marketplaceItem.object_type === 'gift';

  // Format price
  const priceDisplay = isGift
    ? 'Regalo'
    : marketplaceItem.price === 0
      ? 'Prezzo trattabile'
      : `€${marketplaceItem.price.toLocaleString('it-IT')}`;

  // Get type label
  const getTypeLabel = () => {
    if (isRealEstate && marketplaceItem.real_estate_type) {
      return MERCATINO_REAL_ESTATE_TYPE_LABELS[marketplaceItem.real_estate_type];
    }
    if (marketplaceItem.object_type) {
      return MERCATINO_OBJECT_TYPE_LABELS[marketplaceItem.object_type];
    }
    return 'Vendita';
  };

  // Parse contact methods
  const contacts = (marketplaceItem.contact_methods || []).map((c: any) => ({
    method: c.method,
    value: c.value,
  }));

  return (
    <div className="container py-8 pb-24">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="rounded-full">
          <Link href={returnTo as Route}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {returnTo.includes('feed') || returnTo.includes('bacheca')
              ? 'Torna al Feed'
              : 'Torna al Mercatino'}
          </Link>
        </Button>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="relative">
            <ImageGallery
              images={marketplaceItem.images || []}
              alt={marketplaceItem.title}
            />

            {/* Donation Badge (on image) */}
            {marketplaceItem.has_donated && (
              <div className="absolute top-4 left-4 z-10">
                <DonationBadge variant="full" amount={marketplaceItem.donation_amount} />
              </div>
            )}

            {/* Sold Overlay */}
            {marketplaceItem.is_sold && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl backdrop-blur-sm">
                <span className="text-white font-bold text-2xl uppercase tracking-widest border-2 border-white px-6 py-3 rounded-lg transform -rotate-12">
                  Venduto
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              {/* Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className={isRealEstate
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : isGift
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
                  }
                >
                  {isRealEstate ? <Home className="h-3 w-3 mr-1" /> : isGift ? <Gift className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                  {getTypeLabel()}
                </Badge>

                {marketplaceItem.is_private && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    🔒 Privato
                  </Badge>
                )}

                {/* View Count */}
                {marketplaceItem.view_count > 0 && (
                  <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                    <Eye className="h-3 w-3" />
                    {marketplaceItem.view_count} visualizzazioni
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {marketplaceItem.title}
                </h1>
                {isOwner && (
                  <Link href={`${ROUTES.MERCATINO}/${marketplaceItem.id}/edit` as Route}>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifica
                    </Button>
                  </Link>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mt-4">
                {!isGift && <Euro className="h-8 w-8 text-emerald-600" />}
                {isGift && <Gift className="h-8 w-8 text-amber-500" />}
                <span className={`text-3xl md:text-4xl font-bold ${isGift ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {priceDisplay}
                </span>
              </div>

              {/* Donation Badge (if donated) */}
              {marketplaceItem.has_donated && marketplaceItem.committee_percentage > 0 && (
                <div className="mt-4">
                  <DonationBadgeAnimated amount={marketplaceItem.donation_amount} />
                </div>
              )}
            </div>

            {/* Description */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Descrizione</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {marketplaceItem.description}
                </p>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Dettagli</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Category */}
                {marketplaceItem.category && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Categoria:</span>
                    <span className="font-medium text-slate-900">{marketplaceItem.category.name}</span>
                  </div>
                )}

                {/* Condition (for objects) */}
                {!isRealEstate && marketplaceItem.condition && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Condizione:</span>
                    <Badge variant="secondary" className="text-xs">
                      {MERCATINO_CONDITION_LABELS[marketplaceItem.condition] || marketplaceItem.condition}
                    </Badge>
                  </div>
                )}

                {/* Real Estate Details */}
                {isRealEstate && (
                  <>
                    {marketplaceItem.square_meters && (
                      <div className="flex items-center gap-2 text-sm">
                        <Maximize2 className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Superficie:</span>
                        <span className="font-medium text-slate-900">{marketplaceItem.square_meters} m²</span>
                      </div>
                    )}
                    {marketplaceItem.rooms && (
                      <div className="flex items-center gap-2 text-sm">
                        <BedDouble className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Locali:</span>
                        <span className="font-medium text-slate-900">{marketplaceItem.rooms}</span>
                      </div>
                    )}
                    {marketplaceItem.floor !== undefined && marketplaceItem.floor !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Piano:</span>
                        <span className="font-medium text-slate-900">
                          {marketplaceItem.floor === 0 ? 'Terra' : marketplaceItem.floor < 0 ? `Seminterrato (${marketplaceItem.floor})` : marketplaceItem.floor}
                        </span>
                      </div>
                    )}
                    {marketplaceItem.has_elevator && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Ascensore:</span>
                        <Badge variant="outline" className="text-xs text-emerald-600">Sì</Badge>
                      </div>
                    )}
                    {marketplaceItem.has_garage && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Garage/Posto auto:</span>
                        <Badge variant="outline" className="text-xs text-emerald-600">Sì</Badge>
                      </div>
                    )}
                    {marketplaceItem.construction_year && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Anno costruzione:</span>
                        <span className="font-medium text-slate-900">{marketplaceItem.construction_year}</span>
                      </div>
                    )}
                    {marketplaceItem.address_zone && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Zona:</span>
                        <span className="font-medium text-slate-900">{marketplaceItem.address_zone}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Venditore</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-white shadow">
                    <AvatarImage
                      src={marketplaceItem.seller?.avatar || undefined}
                      alt={marketplaceItem.seller?.name}
                    />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {getInitials(marketplaceItem.seller?.name || 'Seller')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {getShortName(marketplaceItem.seller?.name || '')}
                    </p>
                    {marketplaceItem.seller?.bio && (
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {marketplaceItem.seller.bio}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Section */}
            {!isOwner && !marketplaceItem.is_sold && contacts.length > 0 && (
              <div className="space-y-3">
                <ContactDialog
                  contacts={contacts}
                  sellerName={marketplaceItem.seller?.name}
                  itemTitle={marketplaceItem.title}
                  itemId={marketplaceItem.id}
                />
              </div>
            )}

            {/* Back Button */}
            <Button variant="outline" className="w-full rounded-full" asChild>
              <Link href={returnTo as Route}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {returnTo.includes('feed') || returnTo.includes('bacheca')
                  ? 'Torna al Feed'
                  : 'Torna al Mercatino'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function MercatinoItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const returnTo = search.returnTo || ROUTES.MERCATINO;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <MercatinoDetailContent id={id} returnTo={returnTo} />
    </Suspense>
  );
}
