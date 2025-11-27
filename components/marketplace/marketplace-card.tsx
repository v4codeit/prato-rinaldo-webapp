'use client';

import Link from 'next/link';
import { Euro, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface MarketplaceCardProps {
    item: any; // Using any to match existing usage
}

export function MarketplaceCard({ item }: MarketplaceCardProps) {
    return (
        <Link href={`/marketplace/${item.id}`} className="group block mb-6 break-inside-avoid">
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300">
                {/* Image */}
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=2070&auto=format&fit=crop'}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Price Tag */}
                    <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 backdrop-blur-md text-slate-900 hover:bg-white border-0 text-lg font-bold px-3 py-1 shadow-sm">
                            €{item.price}
                        </Badge>
                    </div>

                    {/* Like Button (Visual only for now) */}
                    <button className="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-white hover:text-rose-500 transition-colors">
                        <Heart className="h-5 w-5" />
                    </button>

                    {/* Sold Badge */}
                    {item.is_sold && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-xl uppercase tracking-widest border-2 border-white px-4 py-2 rounded-lg transform -rotate-12">
                                Venduto
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 leading-tight group-hover:text-teal-600 transition-colors">
                            {item.title}
                        </h3>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-white shadow-sm">
                                <AvatarImage src={item.seller?.avatar} />
                                <AvatarFallback className="text-[10px] bg-slate-100">
                                    {getInitials(item.seller?.name || 'S')}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">
                                {item.seller?.name?.split(' ')[0]}
                            </span>
                        </div>

                        <Badge variant="secondary" className="text-[10px] px-2 h-5 bg-slate-100 text-slate-500">
                            {item.condition}
                        </Badge>
                    </div>
                </div>
            </div>
        </Link>
    );
}
