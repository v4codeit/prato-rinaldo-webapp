'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MapPin, Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface EventCardProps {
    event: any; // Using any for now to match existing page usage
}

export function EventCard({ event }: EventCardProps) {
    return (
        <Link href={`/events/${event.id}`} className="group block h-full">
            <div className="relative h-[300px] w-full overflow-hidden rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={event.cover_image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2969&auto=format&fit=crop'}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <div className="mb-auto flex justify-between items-start">
                        <Badge className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-0">
                            {event.category?.name || 'Evento'}
                        </Badge>
                        {event.is_private && (
                            <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-0">
                                Privato
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center gap-2 text-teal-300 text-sm font-medium">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(event.start_date), 'PPP', { locale: it })}</span>
                        </div>

                        <h3 className="text-2xl font-bold leading-tight group-hover:text-teal-200 transition-colors">
                            {event.title}
                        </h3>

                        <div className="flex items-center justify-between text-sm text-slate-200 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            {event.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span className="truncate max-w-[150px]">{event.location}</span>
                                </div>
                            )}
                            {event.max_attendees && (
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{event.max_attendees} posti</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
