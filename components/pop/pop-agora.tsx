"use client";

import React from "react";
import { Vote, CheckCircle2, Clock } from "lucide-react";

export const PopAgora = () => {
    return (
        <div className="p-6 pt-12 pb-24 space-y-6 bg-[#FAFAFA] min-h-full">

            <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 bg-[#A0C4FF] border-2 border-black rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                    <Vote size={32} />
                </div>
                <h1 className="text-3xl font-black">Community Voice</h1>
                <p className="font-bold text-gray-400">Your opinion matters!</p>
            </div>

            {/* Active Poll */}
            <div className="bg-white border-2 border-black rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 text-[#FFD88D]">
                    <Clock size={20} className="text-black" />
                    <span className="text-xs font-black text-black uppercase tracking-wider">Ends in 2 days</span>
                </div>

                <h2 className="text-xl font-black mb-6 leading-tight">Should we install new solar lights in the park?</h2>

                <div className="space-y-4">
                    <button className="w-full group">
                        <div className="flex justify-between mb-2 px-1">
                            <span className="font-bold text-sm">Yes, absolutely</span>
                            <span className="font-black text-sm">75%</span>
                        </div>
                        <div className="h-12 w-full bg-gray-100 border-2 border-black rounded-xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-full bg-[#B8E6E1] w-[75%] border-r-2 border-black transition-all group-hover:bg-[#9FE0D9]" />
                            <div className="absolute inset-0 flex items-center justify-end px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                    </button>

                    <button className="w-full group">
                        <div className="flex justify-between mb-2 px-1">
                            <span className="font-bold text-sm">No, too expensive</span>
                            <span className="font-black text-sm">25%</span>
                        </div>
                        <div className="h-12 w-full bg-gray-100 border-2 border-black rounded-xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-full bg-[#FFB7B2] w-[25%] border-r-2 border-black transition-all group-hover:bg-[#FFA099]" />
                        </div>
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-gray-100 flex justify-between items-center">
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-gray-400">124 voted</span>
                </div>
            </div>

            {/* Past Polls */}
            <h3 className="text-xl font-black mt-8">Past Decisions</h3>
            <div className="space-y-4">
                <div className="bg-white border-2 border-black rounded-xl p-4 flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-gray-200 border-2 border-black rounded-full flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Gym Renovation</h4>
                        <p className="text-xs font-bold text-green-600">Approved</p>
                    </div>
                </div>
            </div>

        </div>
    );
};
