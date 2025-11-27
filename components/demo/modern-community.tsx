"use client";

import React, { useState, useEffect } from "react";
import { Search, ArrowLeft, MessageSquare, MoreVertical, Send, Paperclip, Smile, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const TOPICS = [
    {
        id: 1,
        name: "generale",
        description: "Chat generale della community",
        unread: 0,
        lastMessage: "Mario: Ciao a tutti!",
        time: "10:30",
        avatar: "👥"
    },
    {
        id: 2,
        name: "eventi-quartiere",
        description: "Organizzazione eventi locali",
        unread: 3,
        lastMessage: "Giulia: Festa sabato prossimo?",
        time: "09:15",
        avatar: "🎉"
    },
    {
        id: 3,
        name: "mercatino",
        description: "Compravendita tra vicini",
        unread: 0,
        lastMessage: "Luca: Vendo bicicletta",
        time: "Ieri",
        avatar: "🛒"
    },
    {
        id: 4,
        name: "segnalazioni",
        description: "Problemi e manutenzioni",
        unread: 0,
        lastMessage: "Anna: Ascensore rotto",
        time: "Ieri",
        avatar: "⚠️"
    },
    {
        id: 5,
        name: "giardinaggio",
        description: "Cura delle aree verdi",
        unread: 12,
        lastMessage: "Marco: Nuove piante!",
        time: "Lun",
        avatar: "🌱"
    },
    {
        id: 6,
        name: "animali-domestici",
        description: "Pet lovers corner",
        unread: 5,
        lastMessage: "Sara: Chi porta a spasso Max?",
        time: "Dom",
        avatar: "🐕"
    },
];

const MESSAGES = [
    { id: 1, user: "Mario Rossi", avatar: "/assets/avatars/1.png", content: "Ciao a tutti! Qualcuno sa quando passeranno per la raccolta del verde?", time: "10:30", isMe: false },
    { id: 2, user: "Giulia Bianchi", avatar: "/assets/avatars/2.png", content: "Dovrebbero passare domani mattina verso le 8.", time: "10:32", isMe: false },
    { id: 3, user: "Me", avatar: "/assets/avatars/me.png", content: "Grazie Giulia! Metterò fuori i sacchi stasera.", time: "10:35", isMe: true },
    { id: 4, user: "Luca Verdi", avatar: "/assets/avatars/3.png", content: "Ricordatevi che devono essere sacchi trasparenti!", time: "10:40", isMe: false },
];

interface ModernCommunityProps {
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function ModernCommunity({ onFullscreenChange }: ModernCommunityProps) {
    const [view, setView] = useState<"topics" | "chat">("topics");
    const [selectedTopic, setSelectedTopic] = useState<typeof TOPICS[0] | null>(null);

    // Notifica il parent quando cambia la modalità fullscreen
    useEffect(() => {
        onFullscreenChange?.(view === "chat");
    }, [view, onFullscreenChange]);

    const handleTopicClick = (topic: typeof TOPICS[0]) => {
        setSelectedTopic(topic);
        setView("chat");
    };

    const handleBackToTopics = () => {
        setView("topics");
        setSelectedTopic(null);
    };

    // Vista Topics List (come WhatsApp)
    if (view === "topics") {
        return (
            <div className="animate-in fade-in slide-in-from-left-10 duration-300">
                <div className="space-y-4 pb-24">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Community</h1>
                            <p className="text-slate-500">{TOPICS.length} canali attivi</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Cerca un canale..."
                            className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
                        />
                    </div>

                    {/* Topics List (WhatsApp style) */}
                    <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                        {TOPICS.map((topic, index) => (
                            <div
                                key={topic.id}
                                onClick={() => handleTopicClick(topic)}
                                className={cn(
                                    "flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors border-b last:border-none group",
                                    topic.unread > 0 && "bg-blue-50/30"
                                )}
                            >
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform">
                                    {topic.avatar}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={cn(
                                            "font-bold text-slate-900",
                                            topic.unread > 0 && "text-blue-700"
                                        )}>
                                            #{topic.name}
                                        </h3>
                                        <span className="text-xs text-slate-400">{topic.time}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 truncate">{topic.lastMessage}</p>
                                </div>

                                {/* Unread Badge */}
                                {topic.unread > 0 && (
                                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{topic.unread}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Vista Chat Fullscreen
    return (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-right-full duration-300">
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center justify-between px-4 bg-white sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-slate-100"
                        onClick={handleBackToTopics}
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-700" />
                    </Button>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl">
                        {selectedTopic?.avatar}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">#{selectedTopic?.name}</h3>
                        <p className="text-xs text-slate-500">{selectedTopic?.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                        ))}
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-5 w-5 text-slate-500" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-[calc(100vh-128px)]">
                <div className="p-6 space-y-6 max-w-4xl mx-auto">
                    {MESSAGES.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-4", msg.isMe && "flex-row-reverse")}>
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm flex-shrink-0">
                                <AvatarImage src={msg.avatar} />
                                <AvatarFallback>{msg.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="max-w-md">
                                <div className={cn("flex items-baseline gap-2 mb-1", msg.isMe && "justify-end")}>
                                    <span className="font-bold text-sm text-slate-900">{msg.user}</span>
                                    <span className="text-xs text-slate-400">{msg.time}</span>
                                </div>
                                <div className={cn(
                                    "p-4 rounded-2xl text-sm shadow-sm",
                                    msg.isMe
                                        ? "bg-blue-600 text-white rounded-tr-none"
                                        : "bg-slate-100 text-slate-800 rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-slate-50 border rounded-2xl p-2 flex items-end gap-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-slate-600 flex-shrink-0">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <textarea
                            placeholder="Scrivi un messaggio..."
                            className="flex-1 bg-transparent border-none resize-none focus:ring-0 p-2 max-h-32 min-h-[40px] text-sm outline-none"
                            rows={1}
                        />
                        <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-slate-600 flex-shrink-0">
                            <Smile className="h-5 w-5" />
                        </Button>
                        <Button size="icon" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md flex-shrink-0">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
