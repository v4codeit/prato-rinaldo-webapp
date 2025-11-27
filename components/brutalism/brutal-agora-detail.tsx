"use client";

import React, { useState } from "react";
import { ArrowLeft, Vote } from "lucide-react";

export function BrutalAgoraDetail({ onBack }: { onBack: () => void }) {
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
                className="flex items-center gap-2 font-bold uppercase hover:translate-x-[-4px] transition-all duration-100"
            >
                <ArrowLeft className="h-6 w-6" strokeWidth={3} />
                BACK
            </button>

            {/* Poll header */}
            <div className="bg-magenta border-[6px] border-black shadow-[12px_12px_0_black] p-8">
                <div className="flex items-center gap-2 mb-4">
                    <Vote className="h-8 w-8" strokeWidth={3} />
                    <span className="brutal-mono text-xs uppercase tracking-wider font-bold">ACTIVE POLL</span>
                </div>

                <h1 className="brutal-title text-4xl uppercase mb-4 leading-tight">
                    NEW PARKING REGULATIONS
                </h1>

                <p className="font-bold leading-relaxed mb-6">
                    Should we allocate 5 guest spots for electric vehicle charging only? This would help promote sustainable transportation in our community.
                </p>

                <div className="flex gap-4 brutal-mono text-xs uppercase font-bold">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-black border-[2px] border-white" />
                        <span>142 VOTES</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-black border-[2px] border-white" />
                        <span>2 DAYS LEFT</span>
                    </div>
                </div>
            </div>

            {/* Voting options */}
            <div className="space-y-4">
                <VoteOption
                    label="YES, APPROVE IT"
                    percent={65}
                    votes={92}
                    isSelected={selectedOption === 1}
                    onClick={() => !hasVoted && setSelectedOption(1)}
                    showResults={hasVoted}
                />
                <VoteOption
                    label="NO, KEEP AS IS"
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
                    className={`w-full h-20 border-[4px] border-black shadow-[8px_8px_0_black] brutal-title text-2xl uppercase transition-all duration-100 ${selectedOption !== null
                            ? 'bg-black text-white hover:shadow-[4px_4px_0_black] hover:translate-x-[4px] hover:translate-y-[4px]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    SUBMIT VOTE
                </button>
            )}

            {/* Success message */}
            {hasVoted && (
                <div className="bg-green border-[6px] border-black shadow-[8px_8px_0_black] p-8 text-center">
                    <div className="h-20 w-20 bg-black text-white border-[4px] border-white flex items-center justify-center brutal-title text-5xl mx-auto mb-4">
                        ✓
                    </div>
                    <h2 className="brutal-title text-3xl uppercase mb-2">VOTE SUBMITTED</h2>
                    <p className="font-bold">Thank you for participating!</p>
                </div>
            )}

        </div>
    );
}

function VoteOption({ label, percent, votes, isSelected, onClick, showResults }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full h-20 relative bg-white border-[4px] overflow-hidden transition-all duration-100 ${isSelected ? 'border-black shadow-[6px_6px_0_black]' : 'border-black shadow-[3px_3px_0_black]'
                } ${!showResults && 'hover:shadow-[6px_6px_0_black]'}`}
        >
            {showResults && (
                <div
                    className="absolute left-0 top-0 h-full bg-black transition-all duration-500"
                    style={{ width: `${percent}%` }}
                />
            )}

            <div className="absolute inset-0 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    {!showResults && (
                        <div className={`h-6 w-6 border-[3px] border-black ${isSelected ? 'bg-black' : 'bg-white'}`} />
                    )}
                    <span className={`font-bold uppercase ${showResults && percent > 50 ? 'text-white' : 'text-black'}`}>
                        {label}
                    </span>
                </div>
                {showResults && (
                    <div className={`brutal-mono font-bold ${percent > 50 ? 'text-white' : 'text-black'}`}>
                        {percent}% ({votes})
                    </div>
                )}
            </div>
        </button>
    );
}
