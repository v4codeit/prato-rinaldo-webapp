"use client";

import React from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NexusFeed() {
    return (
        <div className="h-[600px] w-full pb-20">

            {/* Horizontal Stories */}
            <div className="flex gap-4 overflow-x-auto pb-6 demo-no-scrollbar">
                <StoryItem name="You" active />
                <StoryItem name="Admin" />
                <StoryItem name="Giulia" />
                <StoryItem name="Marco" />
                <StoryItem name="Luca" />
            </div>

            {/* Feed Stream */}
            <div className="space-y-6">
                <FeedCard
                    author="Giulia Bianchi"
                    time="2h ago"
                    content="Found this little guy near the park! 🐱 Anyone recognize him?"
                    image="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop"
                    tags={["Lost & Found", "Pets"]}
                />
                <FeedCard
                    author="System Alert"
                    time="4h ago"
                    content="⚠️ MAINTENANCE: Water supply will be interrupted tomorrow 09:00-13:00."
                    isAlert
                />
                <FeedCard
                    author="Marco Verdi"
                    time="Yesterday"
                    content="Selling my old bike. DM for price! 🚲"
                    image="https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=2008&auto=format&fit=crop"
                    tags={["Marketplace"]}
                />
            </div>
        </div>
    );
}

function StoryItem({ name, active }: { name: string, active?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-2 shrink-0">
            <div className={`h-16 w-16 rounded-full border-2 p-1 ${active ? 'border-[#0ea5e9]' : 'border-slate-200'}`}>
                <div className="h-full w-full rounded-full bg-slate-200" />
            </div>
            <span className="text-xs font-mono text-slate-500">{name}</span>
        </div>
    );
}

function FeedCard({ author, time, content, image, tags, isAlert }: any) {
    return (
        <div className={`nexus-glass rounded-[30px] overflow-hidden ${isAlert ? 'border-[#ec4899]/50 bg-[#fbcfe8]/20' : 'bg-white/40'}`}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200" />
                        <div>
                            <h4 className={`font-bold ${isAlert ? 'text-[#ec4899]' : 'text-slate-900'}`}>{author}</h4>
                            <span className="text-xs text-slate-400 font-mono">{time}</span>
                        </div>
                    </div>
                    <MoreHorizontal className="text-slate-400" />
                </div>

                <p className="text-sm leading-relaxed text-slate-700 mb-4">{content}</p>

                {tags && (
                    <div className="flex gap-2 mb-4">
                        {tags.map((tag: string) => (
                            <span key={tag} className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/50 text-[#0ea5e9] border border-[#bae6fd]">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {image && (
                <div className="h-48 w-full bg-slate-100 relative">
                    <img src={image} alt="Post" className="h-full w-full object-cover" />
                </div>
            )}

            <div className="p-4 flex gap-4 border-t border-slate-100">
                <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#ec4899] transition-colors">
                    <Heart className="h-4 w-4" /> LIKE
                </button>
                <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#0ea5e9] transition-colors">
                    <MessageCircle className="h-4 w-4" /> COMMENT
                </button>
            </div>
        </div>
    );
}
