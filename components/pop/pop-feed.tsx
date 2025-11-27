"use client";

import React from "react";
import { Search, Filter, Heart, MessageCircle, Share2, MoreHorizontal, PenTool, Plus } from "lucide-react";

export const PopFeed = () => {
    const posts = [
        {
            id: 1,
            author: "Marco Rossi",
            role: "Admin",
            content: "📢 Attention everyone! The pool maintenance is scheduled for tomorrow morning at 9 AM. Please keep the area clear.",
            tag: "Announcement",
            color: "bg-[#FFD88D]",
            likes: 24,
            comments: 5
        },
        {
            id: 2,
            author: "Giulia Bianchi",
            role: "Resident",
            content: "Has anyone seen a small orange cat? 🐱 He answers to 'Garfield' and loves lasagna. Last seen near Block B.",
            tag: "Lost & Found",
            color: "bg-[#FFB7B2]",
            likes: 12,
            comments: 8
        },
        {
            id: 3,
            author: "Luca Verdi",
            role: "Resident",
            content: "Selling my old bike! 🚲 Perfect condition, just needs new tires. DM me for details.",
            tag: "Marketplace",
            color: "bg-[#B8E6E1]",
            likes: 8,
            comments: 2
        }
    ];

    return (
        <div className="p-6 pt-12 pb-24 space-y-6 bg-[#FFD88D] min-h-full relative">

            {/* Floating Action Button */}
            <button className="fixed bottom-24 right-6 w-14 h-14 bg-black text-white border-2 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] z-40 hover:scale-110 transition-transform active:scale-90">
                <Plus size={28} />
            </button>

            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black">Community Feed</h1>
                <button className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
                    <Filter size={20} />
                </button>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button className="px-4 py-2 bg-black text-white border-2 border-black rounded-full font-bold text-sm whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    All Posts
                </button>
                <button className="px-4 py-2 bg-[#B8E6E1] text-black border-2 border-black rounded-full font-bold text-sm whitespace-nowrap hover:brightness-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Announcements
                </button>
                <button className="px-4 py-2 bg-[#FFB7B2] text-black border-2 border-black rounded-full font-bold text-sm whitespace-nowrap hover:brightness-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Events
                </button>
            </div>

            {/* Posts */}
            <div className="space-y-6">
                {posts.map((post) => (
                    <div key={post.id} className="bg-white border-2 border-black rounded-[24px] overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 group">

                        {/* Post Header */}
                        <div className={`p-4 border-b-2 border-black flex justify-between items-start ${post.color}`}>
                            <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                    {post.author.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-sm">{post.author}</h3>
                                    <span className="text-xs font-bold opacity-60 uppercase tracking-wide">{post.role}</span>
                                </div>
                            </div>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors border-2 border-transparent hover:border-black">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        {/* Post Content */}
                        <div className="p-5">
                            <div className="mb-4">
                                <span className={`inline-block px-3 py-1 rounded-full border-2 border-black text-xs font-black uppercase tracking-wide mb-3 ${post.color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                    {post.tag}
                                </span>
                                <p className="font-bold text-gray-800 leading-relaxed text-lg">
                                    {post.content}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4 border-t-2 border-gray-100">
                                <button className="flex items-center gap-2 text-gray-500 hover:text-[#FFB7B2] transition-colors group/btn">
                                    <div className="p-2 rounded-full group-hover/btn:bg-[#FFB7B2]/20 transition-colors">
                                        <Heart size={20} className="group-hover/btn:fill-[#FFB7B2] group-hover/btn:stroke-[#FFB7B2]" />
                                    </div>
                                    <span className="font-bold text-sm">{post.likes}</span>
                                </button>
                                <button className="flex items-center gap-2 text-gray-500 hover:text-[#A0C4FF] transition-colors group/btn">
                                    <div className="p-2 rounded-full group-hover/btn:bg-[#A0C4FF]/20 transition-colors">
                                        <MessageCircle size={20} className="group-hover/btn:stroke-[#A0C4FF]" />
                                    </div>
                                    <span className="font-bold text-sm">{post.comments}</span>
                                </button>
                                <button className="flex items-center gap-2 text-gray-500 hover:text-[#FFD88D] transition-colors ml-auto group/btn">
                                    <div className="p-2 rounded-full group-hover/btn:bg-[#FFD88D]/20 transition-colors">
                                        <Share2 size={20} className="group-hover/btn:stroke-[#FFD88D]" />
                                    </div>
                                </button>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
};
