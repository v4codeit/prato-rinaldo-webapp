"use client";

import React from "react";
import { FileText, Phone, Wrench, Shield, ChevronRight, Building, MessageSquare } from "lucide-react";

export const PopCondo = () => {
    const documents = [
        { title: "Meeting Minutes - Aug", type: "PDF", size: "2.4 MB", color: "bg-[#FFD88D]" },
        { title: "Financial Report Q2", type: "XLS", size: "1.1 MB", color: "bg-[#B8E6E1]" },
        { title: "Pool Rules 2024", type: "PDF", size: "0.5 MB", color: "bg-[#FFB7B2]" },
    ];

    return (
        <div className="p-6 pt-12 pb-24 space-y-6 bg-[#D4C5F9] min-h-full">

            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white border-2 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Building size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black">My Condo</h1>
                    <p className="font-bold text-black/60">Block B, Apt 402</p>
                </div>
            </div>

            {/* Admin Contact Card */}
            <div className="bg-white border-2 border-black rounded-[24px] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8E6E1] rounded-full blur-2xl opacity-50 -translate-y-1/2 translate-x-1/2" />

                <h2 className="text-xl font-black mb-4 relative z-10">Building Manager</h2>
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 bg-gray-200 border-2 border-black rounded-full flex items-center justify-center font-black">
                        MR
                    </div>
                    <div>
                        <h3 className="font-bold">Mario Rossi</h3>
                        <p className="text-xs font-bold text-gray-400">+39 333 1234567</p>
                    </div>
                </div>

                <div className="flex gap-3 relative z-10">
                    <button className="flex-1 bg-black text-white py-3 rounded-xl font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
                        <Phone size={18} /> Call
                    </button>
                    <button className="flex-1 bg-white text-black py-3 rounded-xl font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
                        <MessageSquare size={18} /> Chat
                    </button>
                </div>
            </div>

            {/* Quick Access Grid */}
            <h3 className="text-xl font-black mt-8">Quick Access</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FFB7B2] border-2 border-black rounded-[20px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center mb-3">
                        <Wrench size={20} />
                    </div>
                    <h4 className="font-black text-sm">Report Issue</h4>
                </div>
                <div className="bg-[#A0C4FF] border-2 border-black rounded-[20px] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center mb-3">
                        <Shield size={20} />
                    </div>
                    <h4 className="font-black text-sm">Visitors</h4>
                </div>
            </div>

            {/* Documents List */}
            <h3 className="text-xl font-black mt-8">Latest Documents</h3>
            <div className="space-y-3">
                {documents.map((doc, i) => (
                    <div key={i} className="bg-white border-2 border-black rounded-xl p-3 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className={`w-10 h-10 ${doc.color} border-2 border-black rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform`}>
                            <FileText size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">{doc.title}</h4>
                            <p className="text-xs font-bold text-gray-400">{doc.type} • {doc.size}</p>
                        </div>
                        <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
                    </div>
                ))}
            </div>

        </div>
    );
};
