"use client";

import React from "react";
import { Search, Filter, Heart, ShoppingBag, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PRODUCTS = [
    {
        id: 1,
        title: "Bicicletta Vintage",
        price: "€120",
        seller: "Mario R.",
        image: "https://images.unsplash.com/photo-1485965120184-e224f723d621?q=80&w=2070&auto=format&fit=crop",
        category: "Sport",
        likes: 12
    },
    {
        id: 2,
        title: "Divano 3 Posti",
        price: "€250",
        seller: "Giulia B.",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop",
        category: "Arredamento",
        likes: 8
    },
    {
        id: 3,
        title: "Macchina Fotografica",
        price: "€450",
        seller: "Luca V.",
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop",
        category: "Elettronica",
        likes: 34
    },
    {
        id: 4,
        title: "Piante da Interno",
        price: "€15",
        seller: "Anna M.",
        image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=2072&auto=format&fit=crop",
        category: "Giardinaggio",
        likes: 45
    }
];

interface ModernMarketplaceProps {
    onNavigate?: (view: string) => void;
}

export function ModernMarketplace({ onNavigate }: ModernMarketplaceProps) {
    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Mercatino</h1>
                    <p className="text-slate-500">Compra e vendi nel vicinato</p>
                </div>
                <Button
                    onClick={() => onNavigate?.("marketplace-create")}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                >
                    <Plus className="h-4 w-4 mr-2" /> Vendi
                </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Cerca oggetti..."
                        className="pl-10 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-emerald-500/20"
                    />
                </div>
                <Button variant="outline" size="icon" className="rounded-2xl border-slate-200 bg-white">
                    <Filter className="h-5 w-5 text-slate-600" />
                </Button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 demo-no-scrollbar">
                <Badge variant="default" className="rounded-full px-4 py-2 text-sm cursor-pointer bg-slate-900 text-white hover:bg-slate-800">Tutti</Badge>
                <Badge variant="secondary" className="rounded-full px-4 py-2 text-sm cursor-pointer bg-white border hover:bg-slate-50">Arredamento</Badge>
                <Badge variant="secondary" className="rounded-full px-4 py-2 text-sm cursor-pointer bg-white border hover:bg-slate-50">Elettronica</Badge>
                <Badge variant="secondary" className="rounded-full px-4 py-2 text-sm cursor-pointer bg-white border hover:bg-slate-50">Abbigliamento</Badge>
                <Badge variant="secondary" className="rounded-full px-4 py-2 text-sm cursor-pointer bg-white border hover:bg-slate-50">Sport</Badge>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-4">
                {PRODUCTS.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white border rounded-3xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => onNavigate?.("marketplace-detail")}
                    >
                        <div className="relative aspect-square bg-slate-100">
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute top-3 right-3">
                                <button className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                                    <Heart className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="absolute bottom-3 left-3">
                                <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 hover:bg-white font-bold shadow-sm">
                                    {product.price}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <Tag className="h-3 w-3" /> {product.category}
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{product.title}</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">di {product.seller}</span>
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Heart className="h-3 w-3 fill-slate-300 text-slate-300" /> {product.likes}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
