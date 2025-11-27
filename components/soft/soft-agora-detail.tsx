"use client";

import React, { useState } from "react";
import { ArrowLeft, Vote } from "lucide-react";

export function SoftAgoraDetail({ onBack }: { onBack: () => void }) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [hasVoted, setHasVoted] = useState(false);

    const handleVote = () => {
        if (selectedOption !== null) {
            setHasVoted(true);
        }
    };

    return (
        <div className="space-y-6 pb-20">

            <button
                onClick={onBack}
                className="flex items-center gap-2 text-soft-navy/60 hover:text-soft-navy font-semibold transition-colors"
            >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
                Back
            </button>

            {/* Poll header */}
            <div className="soft-card gradient-lavender p-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white/90 shadow-button flex items-center justify-center">
                        <Vote className="h-6 w-6 text-soft-navy" strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold text-soft-navy/60 text-sm uppercase tracking-wide">Active Poll</span>
                </div>

                <h1 className="soft-title text-3xl text-soft-navy mb-4 leading-tight">
                    New Parking Regulations
                </h1>

                <p className="text-soft-navy/70 font-medium leading-relaxed mb-6">
                    Should we allocate 5 guest spots for electric vehicle charging only? This would help promote sustainable transportation.
                </p>

                <div className="flex gap-4 text-sm text-soft-navy/60 font-semibold">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-soft-navy" />
                        <span>142 votes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-soft-navy" />
                        <span>2 days left</span>
                    </div>
                </div>
            </div>

            {/* Voting options */}
            <div className="space-y-3">
                <VoteOption
                    label="Yes, approve it"
                    percent={65}
                    votes={92}
                    isSelected={selectedOption === 1}
                    onClick={() => !hasVoted && setSelectedOption(1)}
                    showResults={hasVoted}
                />
                <VoteOption
                    label="No, keep as is"
                    percent={35}
                    votes={50}
                    isSelected={selectedOption === 2}
                    onClick={() => !hasVoted && setSelectedOption(2)}
                    showResults={hasVoted}
                />
            </div>

            {/* Vote button */}
            {!hasVoted && (
                <button
                    onClick={handleVote}
                    disabled={selectedOption === null}
                    className={`w-full h-16 rounded-[999px] font-bold text-lg transition-all duration-200 ${selectedOption !== null
                            ? 'bg-soft-navy text-white shadow-float hover:scale-105 active:scale-95'
                            : 'bg-soft-navy/20 text-soft-navy/40 cursor-not-allowed'
                        }`}
                >
                    Submit Vote
                </button>
            )}

            {/* Success message */}
            {hasVoted && (
                <div className="soft-card gradient-mint p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/90 shadow-button flex items-center justify-center text-4xl mx-auto mb-4">
                        ✓
                    </div>
                    <h2 className="soft-title text-2xl text-soft-navy mb-2">Vote Submitted!</h2>
                    <p className="text-soft-navy/70 font-medium">Thank you for participating</p>
                </div>
            )}

        </div>
    );
}

function VoteOption({ label, percent, votes, isSelected, onClick, showResults }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full h-16 relative rounded-[999px] overflow-hidden transition-all duration-200 ${isSelected ? 'shadow-float ring-4 ring-soft-mint/30' : 'shadow-button'
                } ${!showResults && 'hover:scale-[1.02]'}`}
        >
            {showResults && (
                <div
                    className="absolute left-0 top-0 h-full gradient-mint transition-all duration-500"
                    style={{ width: `${percent}%` }}
                />
            )}

            <div className={`absolute inset-0 flex items-center justify-between px-6 ${!showResults && 'bg-white/90 backdrop-blur-sm'}`}>
                <div className="flex items-center gap-3">
                    {!showResults && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-soft-navy bg-soft-navy' : 'border-soft-navy/30'}`}>
                            {isSelected && <div className="w-3 h-3 rounded-full bg-white" />}
                        </div>
                    )}
                    <span className="font-semibold text-soft-navy">{label}</span>
                </div>
                {showResults && (
                    <div className="font-bold text-soft-navy">
                        {percent}% <span className="text-sm font-medium">({votes})</span>
                    </div>
                )}
            </div>
        </button>
    );
}
