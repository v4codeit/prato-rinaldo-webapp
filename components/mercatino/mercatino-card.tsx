'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Heart, Eye, Home, Gift, Euro, MapPin, Maximize2, BedDouble, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { ROUTES, MERCATINO_CONDITION_LABELS, MERCATINO_LISTING_TYPE_LABELS, MERCATINO_OBJECT_TYPE_LABELS, MERCATINO_REAL_ESTATE_TYPE_LABELS } from '@/lib/utils/constants';
import { DonationBadge } from './donation-badge';
import type { MercatinoFeedItem } from '@/types/feed';

// Props interface supports both direct data and MercatinoFeedItem
export interface MercatinoCardProps {
  item: MercatinoFeedItem | {
    id: string;
    title: string;
    price: number;
    images?: string[];
    condition?: string;
    is_sold?: boolean;
    listing_type?: 'real_estate' | 'objects';
    real_estate_type?: 'rent' | 'sale' | null;
    object_type?: 'sale' | 'gift' | null;
    square_meters?: number;
    rooms?: number;
    address_zone?: string;
    has_donated?: boolean;
    view_count?: number;
    category_id?: string | null;
    category_name?: string | null;
    seller?: {
      id?: string;
      name?: string;
      avatar?: string | null;
    };
  };
  variant?: 'grid' | 'list' | 'compact';
  showViewCount?: boolean;
  onLike?: (id: string) => void;
}

// Helper to normalize data from different sources
function normalizeItem(item: MercatinoCardProps['item']) {
  // Check if it's a MercatinoFeedItem (has metadata property)
  if ('metadata' in item) {
    return {
      id: item.id,
      title: item.title,
      price: item.metadata.price,
      images: item.metadata.images,
      condition: item.metadata.condition,
      isSold: item.metadata.isSold,
      listingType: item.metadata.listingType,
      realEstateType: item.metadata.realEstateType,
      objectType: item.metadata.objectType,
      squareMeters: item.metadata.squareMeters,
      rooms: item.metadata.rooms,
      addressZone: item.metadata.addressZone,
      hasDonated: item.metadata.hasDonated,
      viewCount: item.metadata.viewCount,
      categoryName: item.metadata.categoryName,
      seller: item.author,
    };
  }

  // Direct database format
  return {
    id: item.id,
    title: item.title,
    price: item.price,
    images: item.images,
    condition: item.condition,
    isSold: item.is_sold,
    listingType: item.listing_type,
    realEstateType: item.real_estate_type,
    objectType: item.object_type,
    squareMeters: item.square_meters,
    rooms: item.rooms,
    addressZone: item.address_zone,
    hasDonated: item.has_donated,
    viewCount: item.view_count,
    categoryName: item.category_name,
    seller: item.seller,
  };
}

// Default placeholder image
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=2070&auto=format&fit=crop';

export function MercatinoCard({
  item,
  variant = 'grid',
  showViewCount = false,
  onLike,
}: MercatinoCardProps) {
  const data = normalizeItem(item);
  const isRealEstate = data.listingType === 'real_estate';
  const isGift = data.objectType === 'gift';

  // Format price
  const priceDisplay = isGift
    ? 'Regalo'
    : data.price === 0
      ? 'Gratis'
      : `€${data.price.toLocaleString('it-IT')}`;

  // Get type badge text
  const getTypeBadge = () => {
    if (isRealEstate && data.realEstateType) {
      return MERCATINO_REAL_ESTATE_TYPE_LABELS[data.realEstateType] || data.realEstateType;
    }
    if (data.objectType) {
      return MERCATINO_OBJECT_TYPE_LABELS[data.objectType] || data.objectType;
    }
    return null;
  };

  const typeBadge = getTypeBadge();

  // Grid variant (default - 2 columns on mobile)
  if (variant === 'grid') {
    return (
      <Link
        href={`${ROUTES.MERCATINO}/${data.id}` as Route}
        className="group block break-inside-avoid"
      >
        <div className="relative rounded-3xl overflow-hidden bg-white border hover:shadow-lg transition-all duration-300">
          {/* Image Container */}
          <div className="relative aspect-square bg-slate-100 overflow-hidden">
            <img
              src={data.images?.[0] || DEFAULT_IMAGE}
              alt={data.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Like Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLike?.(data.id);
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-white transition-colors"
              aria-label="Mi piace"
            >
              <Heart className="h-4 w-4" />
            </button>

            {/* Price Badge */}
            <Badge
              className={cn(
                "absolute bottom-3 left-3 backdrop-blur-sm border-0 font-bold shadow-sm",
                isGift
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-white/90 text-slate-900 hover:bg-white"
              )}
            >
              {isGift && <Gift className="h-3 w-3 mr-1" />}
              {priceDisplay}
            </Badge>

            {/* Type Badge (Real Estate / Gift) */}
            {typeBadge && !isGift && (
              <Badge
                variant="secondary"
                className="absolute bottom-3 right-3 bg-slate-900/80 text-white backdrop-blur-sm border-0 text-[10px]"
              >
                {isRealEstate && <Home className="h-3 w-3 mr-1" />}
                {typeBadge}
              </Badge>
            )}

            {/* Sold Overlay */}
            {data.isSold && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                <span className="text-white font-bold text-lg uppercase tracking-widest border-2 border-white px-4 py-2 rounded-lg transform -rotate-12">
                  Venduto
                </span>
              </div>
            )}

            {/* Donation Badge */}
            {data.hasDonated && (
              <div className="absolute top-3 left-3">
                <DonationBadge variant="icon" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Category (Demo style) */}
            {data.categoryName && !isRealEstate && (
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {data.categoryName}
              </div>
            )}

            {/* Title */}
            <h3 className="font-bold text-slate-900 leading-tight line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
              {data.title}
            </h3>

            {/* Real Estate Info */}
            {isRealEstate && (data.squareMeters || data.rooms) && (
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                {data.squareMeters && (
                  <span className="flex items-center gap-1">
                    <Maximize2 className="h-3 w-3" />
                    {data.squareMeters} m²
                  </span>
                )}
                {data.rooms && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3 w-3" />
                    {data.rooms} locali
                  </span>
                )}
              </div>
            )}

            {/* Address Zone */}
            {data.addressZone && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{data.addressZone}</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              {/* Seller */}
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-white shadow-sm">
                  <AvatarImage src={data.seller?.avatar || undefined} />
                  <AvatarFallback className="text-[10px] bg-slate-100">
                    {getInitials(data.seller?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-500 font-medium truncate max-w-[80px]">
                  {data.seller?.name?.split(' ')[0] || 'Utente'}
                </span>
              </div>

              {/* Condition or View Count */}
              <div className="flex items-center gap-2">
                {showViewCount && data.viewCount !== undefined && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Eye className="h-3 w-3" />
                    {data.viewCount}
                  </span>
                )}
                {data.condition && !isRealEstate && (
                  <Badge variant="secondary" className="text-[10px] px-2 h-5 bg-slate-100 text-slate-500">
                    {MERCATINO_CONDITION_LABELS[data.condition] || data.condition}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // List variant (horizontal card)
  if (variant === 'list') {
    return (
      <Link
        href={`${ROUTES.MERCATINO}/${data.id}` as Route}
        className="group block"
      >
        <div className="flex gap-4 p-4 rounded-2xl bg-white border hover:shadow-md transition-all">
          {/* Image */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
            <img
              src={data.images?.[0] || DEFAULT_IMAGE}
              alt={data.title}
              className="w-full h-full object-cover"
            />
            {data.isSold && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold uppercase">Venduto</span>
              </div>
            )}
            {data.hasDonated && (
              <div className="absolute top-1 left-1">
                <DonationBadge variant="icon" size="sm" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                {data.title}
              </h3>
              <span className={cn(
                "font-bold text-sm whitespace-nowrap",
                isGift ? "text-emerald-600" : "text-slate-900"
              )}>
                {priceDisplay}
              </span>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              {typeBadge && (
                <Badge variant="outline" className="text-[10px] h-5">
                  {typeBadge}
                </Badge>
              )}
              {data.condition && !isRealEstate && (
                <span>{MERCATINO_CONDITION_LABELS[data.condition] || data.condition}</span>
              )}
              {isRealEstate && data.squareMeters && (
                <span>{data.squareMeters} m²</span>
              )}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={data.seller?.avatar || undefined} />
                <AvatarFallback className="text-[8px] bg-slate-100">
                  {getInitials(data.seller?.name || 'U')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-slate-500">
                {data.seller?.name || 'Utente'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Compact variant (minimal, for sidebar)
  return (
    <Link
      href={`${ROUTES.MERCATINO}/${data.id}` as Route}
      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={data.images?.[0] || DEFAULT_IMAGE}
          alt={data.title}
          className="w-full h-full object-cover"
        />
        {data.hasDonated && (
          <div className="absolute -top-1 -left-1">
            <DonationBadge variant="dot" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-slate-900 truncate group-hover:text-emerald-600">
          {data.title}
        </h4>
        <p className={cn(
          "text-xs font-semibold",
          isGift ? "text-emerald-600" : "text-slate-600"
        )}>
          {priceDisplay}
        </p>
      </div>
    </Link>
  );
}
