"use client";

import React from "react";
import { ArrowLeft, Vote, CheckCircle2, MessageSquare } from "lucide-react";

export const PopAgoraDetail = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="min-h-full bg-[#A0C4FF] p-6 pb-24 relative">

            <button
                onClick={onBack}
                className="absolute top-6 left-6 w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all z-10"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="mt-16 mb-6 text-center">
                <div className="w-20 h-20 bg-[#FFD88D] border-2 border-black rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                    <Vote size={40} />
                </div>
                <h1 className="text-2xl font-black leading-tight">Should we install new solar lights in the park?</h1>
            </div>

            <div className="bg-white border-2 border-black rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">

                <div className="space-y-4">
                    <button className="w-full group text-left">
                        <div className="flex justify-between mb-2 px-1">
                            <span className="font-bold text-sm">Yes, absolutely</span>
                            <span className="font-black text-sm">75%</span>
                        </div>
                        <div className="h-14 w-full bg-gray-100 border-2 border-black rounded-xl overflow-hidden relative group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <div className="absolute top-0 left-0 h-full bg-[#B8E6E1] w-[75%] border-r-2 border-black" />
                            <div className="absolute inset-0 flex items-center justify-end px-4">
                                <CheckCircle2 size={24} className="text-black" />
                            </div>
                        </div>
                    </button>

                    <button className="w-full group text-left opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between mb-2 px-1">
                            <span className="font-bold text-sm">No, too expensive</span>
                            <span className="font-black text-sm">25%</span>
                        </div>
                        <div className="h-14 w-full bg-gray-100 border-2 border-black rounded-xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-full bg-[#FFB7B2] w-[25%] border-r-2 border-black" />
                        </div>
                    </button>
                </div>

                <div className="pt-6 border-t-2 border-gray-100">
                    <h3 className="font-black text-lg mb-4">Discussion</h3>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-[#FFD88D] border-2 border-black rounded-full flex items-center justify-center font-black text-xs flex-shrink-0">
                                MK
                            </div>
                            <div className="bg-gray-50 border-2 border-black rounded-xl rounded-tl-none p-3">
                                <p className="text-sm font-bold">Great idea! It gets really dark in winter.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-[#FFB7B2] border-2 border-black rounded-full flex items-center justify-center font-black text-xs flex-shrink-0">
                                AL
                            </div>
                            <div className="bg-gray-50 border-2 border-black rounded-xl rounded-tl-none p-3">
                                <p className="text-sm font-bold">How much will it cost per household?</p>
                            </div>
                        </div>
                    </div>

                    <button className="w-full mt-4 bg-black text-white py-3 rounded-xl font-bold border-2 border-black flex items-center justify-center gap-2">
                        <MessageSquare size={18} /> Add Comment
                    </button>
                </div>

            </div>

        </div>
    );
};
