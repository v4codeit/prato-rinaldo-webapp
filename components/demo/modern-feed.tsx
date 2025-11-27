"use client";

import React from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const FEED_ITEMS = [
    {
        id: 1,
        author: { name: "Giulia Bianchi", avatar: "/assets/avatars/1.png", role: "Resident" },
        time: "2 ore fa",
        content: "Ho trovato questo gattino vicino al parco giochi. Qualcuno lo riconosce? È molto dolce e sembra domestico.",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop",
        likes: 24,
        comments: 5,
        tags: ["Animali", "Smarrito"],
        type: "post"
    },
    {
        id: 2,
        author: { name: "Marco Verdi", avatar: "/assets/avatars/2.png", role: "Admin" },
        time: "4 ore fa",
        content: "⚠️ Attenzione: Domani mattina dalle 8:00 alle 12:00 ci sarà la potatura degli alberi in Viale dei Pini. Si prega di non parcheggiare.",
        likes: 45,
        comments: 0,
        tags: ["Avviso", "Manutenzione"],
        type: "alert"
    },
    {
        id: 3,
        author: { name: "Luigi Rossi", avatar: "/assets/avatars/3.png", role: "Resident" },
        time: "Ieri",
        content: "Vendo bicicletta da bambino usata pochissimo. Prezzo trattabile.",
        image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=2008&auto=format&fit=crop",
        price: "€50",
        likes: 8,
        comments: 2,
        tags: ["Mercatino", "Vendita"],
        type: "market"
    }
];

export function ModernFeed() {
    return (
        <div className="max-w-2xl mx-auto pb-24">

            {/* Feed Filters (Horizontal Scroll) */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 px-4 -mx-4 mb-4 border-b">
                <div className="flex gap-2 overflow-x-auto demo-no-scrollbar pb-1">
                    <Badge variant="default" className="rounded-full px-4 py-1.5 text-sm cursor-pointer hover:opacity-90 bg-slate-900 text-white hover:bg-slate-800">Tutti</Badge>
                    <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">Avvisi</Badge>
                    <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">Eventi</Badge>
                    <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">Mercatino</Badge>
                    <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">Foto</Badge>
                </div>
            </div>

            {/* Feed Items */}
            <div className="space-y-6">
                {FEED_ITEMS.map((item) => (
                    <FeedCard key={item.id} item={item} />
                ))}
            </div>

        </div>
    );
}

function FeedCard({ item }: { item: any }) {
    return (
        <div className="bg-card border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

            {/* Card Header */}
            <div className="p-4 flex justify-between items-start">
                <div className="flex gap-3">
                    <Avatar>
                        <AvatarImage src={item.author.avatar} />
                        <AvatarFallback>{item.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{item.author.name}</span>
                            {item.author.role === "Admin" && (
                                <Badge variant="destructive" className="text-[10px] h-4 px-1 rounded-sm">ADMIN</Badge>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="px-4 pb-2">
                {item.type === "market" && (
                    <div className="mb-2">
                        <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50">
                            {item.price}
                        </Badge>
                    </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>

                {/* Tags */}
                <div className="flex gap-2 mt-3">
                    {item.tags.map((tag: string) => (
                        <span key={tag} className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Image Attachment */}
            {item.image && (
                <div className="mt-3 relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                        src={item.image}
                        alt="Post content"
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                    />
                </div>
            )}

            {/* Actions Footer */}
            <div className="p-3 mt-1 border-t flex items-center justify-between">
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-50 gap-1.5">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">{item.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-50 gap-1.5">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">{item.comments}</span>
                    </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
