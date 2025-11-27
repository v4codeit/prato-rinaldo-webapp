"use client";

import React from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";

export function BrutalFeed() {
    return (
        <div className="space-y-8 pb-20">

            {/* Create post */}
            <div className="bg-yellow border-[4px] border-black shadow-[6px_6px_0_black] p-4">
                <input
                    placeholder="WHAT'S ON YOUR MIND?"
                    className="w-full h-14 px-4 border-[3px] border-black font-bold uppercase placeholder:text-black/50 focus:outline-none focus:border-cyan focus:shadow-[0_0_0_3px_#00FFFF]"
                />
            </div>

            {/* Posts */}
            <div className="space-y-6">
                <Post
                    author="ANNA ROSSI"
                    time="2H AGO"
                    content="Community BBQ this Saturday! Bring your family and friends. Food starts at 6PM on the rooftop."
                    likes={24}
                    comments={7}
                    offset="translate-x-0"
                />

                <Post
                    author="MARCO VERDI"
                    time="5H AGO"
                    content="Lost cat! Orange tabby, answers to 'Felix'. Last seen near Block B. Please contact me if you see him!"
                    likes={18}
                    comments={12}
                    offset="translate-x-8"
                />

                <Post
                    author="LUCA BIANCHI"
                    time="1D AGO"
                    content="Thank you to everyone who helped with the garden cleanup yesterday. It looks amazing!"
                    likes={45}
                    comments={15}
                    offset="translate-x-0"
                />
            </div>

        </div>
    );
}

function Post({ author, time, content, likes, comments, offset }: any) {
    return (
        <div className={`bg-white border-[4px] border-black shadow-[8px_8px_0_black] p-6 ${offset}`}>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 bg-magenta border-[3px] border-black flex items-center justify-center brutal-title text-2xl shrink-0">
                    {author.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold uppercase">{author}</h3>
                    <p className="brutal-mono text-xs opacity-60">{time}</p>
                </div>
            </div>

            {/* Content */}
            <p className="font-medium leading-relaxed mb-6">{content}</p>

            {/* Actions */}
            <div className="flex gap-3">
                <ActionButton icon={Heart} count={likes} bg="bg-red" />
                <ActionButton icon={MessageCircle} count={comments} bg="bg-cyan" />
                <ActionButton icon={Share2} count={0} bg="bg-yellow" />
            </div>

        </div>
    );
}

function ActionButton({ icon: Icon, count, bg }: any) {
    return (
        <button className={`h-12 px-4 ${bg} border-[3px] border-black shadow-[3px_3px_0_black] hover:shadow-[4px_4px_0_black] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-100 flex items-center gap-2 font-bold`}>
            <Icon className="h-4 w-4" strokeWidth={3} />
            {count > 0 && <span className="brutal-mono text-sm">{count}</span>}
        </button>
    );
}
