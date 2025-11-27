"use client";

import React from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

export function SoftFeed() {
    return (
        <div className="space-y-6 pb-20">

            {/* Create post */}
            <div className="soft-card p-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-lavender flex items-center justify-center shrink-0">
                        <span className="text-xl">👤</span>
                    </div>
                    <input
                        placeholder="What's on your mind?"
                        className="flex-1 h-12 px-4 rounded-[999px] bg-soft-mint/20 border-2 border-transparent focus:border-soft-mint focus:bg-white transition-all outline-none font-medium text-soft-navy placeholder:text-soft-navy/40"
                    />
                </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
                <Post
                    author="Anna Rossi"
                    time="2h ago"
                    avatar="🧑‍🦰"
                    content="Looking forward to the community BBQ this Saturday! Who's bringing dessert? 🍰"
                    likes={24}
                    comments={7}
                    gradient="gradient-peach"
                />

                <Post
                    author="Marco Verdi"
                    time="5h ago"
                    avatar="👨"
                    content="Lost cat! Orange tabby, answers to 'Felix'. Please contact me if you see him around Block B. Thank you!"
                    likes={18}
                    comments={12}
                    gradient="gradient-lavender"
                />

                <Post
                    author="Luca Bianchi"
                    time="1d ago"
                    avatar="👦"
                    content="Big thank you to everyone who helped with the garden cleanup yesterday. It looks amazing now!"
                    likes={45}
                    comments={15}
                    gradient="gradient-mint"
                />
            </div>

        </div>
    );
}

function Post({ author, time, avatar, content, likes, comments, gradient }: any) {
    return (
        <div className="soft-card p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 ${gradient} rounded-full flex items-center justify-center shadow-button shrink-0`}>
                        <span className="text-2xl">{avatar}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-soft-navy">{author}</h3>
                        <p className="text-sm text-soft-navy/50">{time}</p>
                    </div>
                </div>
                <button className="w-10 h-10 rounded-full hover:bg-soft-mint/20 transition-colors flex items-center justify-center">
                    <MoreHorizontal className="h-5 w-5 text-soft-navy/40" strokeWidth={2.5} />
                </button>
            </div>

            {/* Content */}
            <p className="text-soft-navy leading-relaxed font-medium mb-4">{content}</p>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <ActionButton icon={Heart} count={likes} color="bg-soft-pink" />
                <ActionButton icon={MessageCircle} count={comments} color="bg-soft-blue" />
                <ActionButton icon={Share2} count={0} color="bg-soft-lavender" />
            </div>

        </div>
    );
}

function ActionButton({ icon: Icon, count, color }: any) {
    return (
        <button className={`h-10 px-4 ${color} rounded-[999px] shadow-button hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2`}>
            <Icon className="h-4 w-4 text-soft-navy" strokeWidth={2.5} />
            {count > 0 && <span className="text-sm font-semibold text-soft-navy">{count}</span>}
        </button>
    );
}
