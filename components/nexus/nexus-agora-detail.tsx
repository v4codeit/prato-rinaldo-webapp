"use client";

import React, { useState } from "react";
import { ArrowLeft, Vote, CheckCircle2, Users, Clock, MessageCircle } from "lucide-react";

interface NexusAgoraDetailProps {
    onBack: () => void;
}

export function NexusAgoraDetail({ onBack }: NexusAgoraDetailProps) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [hasVoted, setHasVoted] = useState(false);

    const options = [
        { id: 1, label: "Yes, approve it", percent: 65, votes: 92 },
        { id: 2, label: "No, keep as is", percent: 35, votes: 50 },
    ];

    const handleVote = () => {
        if (selectedOption !== null) {
            setHasVoted(true);
        }
    };

    return (
        <div className="space-y-6 pb-32">

            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-[#0ea5e9] transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-bold text-sm">Back to Agora</span>
            </button>

            {/* Poll Header */}
            <div className="nexus-glass rounded-[30px] p-6 bg-gradient-to-br from-[#8b5cf6]/20 to-[#d946ef]/20 border-none relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                    <Vote className="h-5 w-5 text-[#8b5cf6]" />
                    <span className="text-xs font-bold text-[#8b5cf6] uppercase tracking-widest">Active Poll</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-3 leading-tight">New Parking Regulations</h1>
                <p className="text-slate-700 leading-relaxed">
                    Should we allocate 5 guest spots for electric vehicle charging only? This would help promote sustainable transportation in our community.
                </p>

                <div className="mt-6 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-4 w-4" />
                        <span>Ends in 2 days</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <Users className="h-4 w-4" />
                        <span>142 votes</span>
                    </div>
                </div>
            </div>

            {/* Voting Options */}
            <div className="space-y-3">
                {options.map((option) => (
                    <VoteOption
                        key={option.id}
                        {...option}
                        isSelected={selectedOption === option.id}
                        onClick={() => !hasVoted && setSelectedOption(option.id)}
                        showResults={hasVoted}
                    />
                ))}
            </div>

            {!hasVoted && (
                <button
                    onClick={handleVote}
                    disabled={selectedOption === null}
                    className={`w-full h-14 rounded-2xl font-bold uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${selectedOption !== null
                            ? 'bg-[#8b5cf6] text-white shadow-purple-200 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                >
                    <Vote className="h-5 w-5" />
                    Submit Vote
                </button>
            )}

            {hasVoted && (
                <div className="nexus-glass rounded-[30px] p-6 bg-[#dcfce7] text-center">
                    <CheckCircle2 className="h-12 w-12 text-[#16a34a] mx-auto mb-3" />
                    <h3 className="text-xl font-black text-slate-900 mb-1">Vote Submitted!</h3>
                    <p className="text-sm text-slate-600">Thank you for participating in community governance.</p>
                </div>
            )}

            {/* Comments */}
            <div className="nexus-glass rounded-[30px] p-6 bg-white/40">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Discussion ({8})</h3>
                <div className="space-y-4">
                    <Comment
                        author="Anna Rossi"
                        time="1h ago"
                        content="Great idea! This will encourage more residents to switch to electric vehicles."
                    />
                    <Comment
                        author="Luca Bianchi"
                        time="3h ago"
                        content="What about visitors who don't have electric cars? We should keep some regular guest spots."
                    />
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/50">
                    <div className="flex gap-3">
                        <input
                            placeholder="Add your thoughts..."
                            className="flex-1 h-12 bg-white/50 rounded-xl px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/50"
                        />
                        <button className="h-12 w-12 rounded-xl bg-[#8b5cf6] text-white flex items-center justify-center hover:scale-110 transition-transform">
                            <MessageCircle className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}

function VoteOption({ label, percent, votes, isSelected, onClick, showResults }: any) {
    return (
        <button
            onClick={onClick}
            className={`relative h-16 w-full nexus-glass rounded-2xl overflow-hidden transition-all ${isSelected ? 'ring-2 ring-[#8b5cf6] bg-white/60' : 'bg-white/40 hover:bg-white/60'
                } ${showResults ? 'cursor-default' : 'cursor-pointer'}`}
        >
            {showResults && (
                <div
                    className="absolute top-0 left-0 h-full bg-[#8b5cf6] opacity-20 transition-all duration-1000"
                    style={{ width: `${percent}%` }}
                />
            )}
            <div className="absolute inset-0 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    {isSelected && !showResults && (
                        <div className="h-5 w-5 rounded-full border-2 border-[#8b5cf6] flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-[#8b5cf6]" />
                        </div>
                    )}
                    {!isSelected && !showResults && (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                    )}
                    <span className="font-bold text-slate-800">{label}</span>
                </div>
                {showResults && (
                    <div className="text-right">
                        <p className="font-mono text-lg font-bold text-[#8b5cf6]">{percent}%</p>
                        <p className="text-xs text-slate-400">{votes} votes</p>
                    </div>
                )}
            </div>
        </button>
    );
}

function Comment({ author, time, content }: any) {
    return (
        <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900">{author}</span>
                    <span className="text-xs text-slate-400">{time}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
            </div>
        </div>
    );
}
