"use client";

import React, { useState } from "react";
import { ArrowLeft, Plus, X, HelpCircle, Calendar } from "lucide-react";

interface NexusAgoraCreateProps {
    onBack: () => void;
}

export function NexusAgoraCreate({ onBack }: NexusAgoraCreateProps) {
    const [options, setOptions] = useState<string[]>(["", ""]);

    const addOption = () => {
        setOptions([...options, ""]);
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    return (
        <div className="space-y-6 pb-32">

            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-[#0ea5e9] transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-bold text-sm">Cancel</span>
                </button>
                <h2 className="text-xl font-black text-slate-900">Create Poll</h2>
                <div className="w-20" />
            </div>

            {/* Question */}
            <div className="nexus-glass rounded-[30px] p-6 bg-white/40">
                <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="h-5 w-5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase">Poll Question</span>
                </div>
                <input
                    type="text"
                    placeholder="What would you like to ask the community?"
                    className="w-full h-14 bg-white/50 rounded-xl px-4 text-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/50 font-bold"
                />
                <textarea
                    placeholder="Add context or details (optional)..."
                    className="w-full h-24 bg-white/50 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/50 resize-none mt-3"
                />
            </div>

            {/* Options */}
            <div className="nexus-glass rounded-[30px] p-6 bg-white/40">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Options</h3>
                <div className="space-y-3">
                    {options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                            <div className="flex-1 flex items-center gap-3 bg-white/50 rounded-xl px-4 h-12">
                                <span className="text-sm font-bold text-slate-400">{String.fromCharCode(65 + index)}</span>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                        const newOptions = [...options];
                                        newOptions[index] = e.target.value;
                                        setOptions(newOptions);
                                    }}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1 bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
                                />
                            </div>
                            {options.length > 2 && (
                                <button
                                    onClick={() => removeOption(index)}
                                    className="h-12 w-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {options.length < 6 && (
                    <button
                        onClick={addOption}
                        className="mt-3 w-full h-12 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center gap-2 text-slate-400 hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="font-bold text-sm">Add Option</span>
                    </button>
                )}
            </div>

            {/* Settings */}
            <div className="nexus-glass rounded-[30px] p-6 bg-white/40">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Poll Settings</h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-slate-600 mb-2 block">Duration</label>
                        <div className="grid grid-cols-3 gap-2">
                            <DurationButton label="1 Day" active />
                            <DurationButton label="3 Days" />
                            <DurationButton label="1 Week" />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-slate-600 mb-2 block">Visibility</label>
                        <div className="grid grid-cols-2 gap-2">
                            <VisibilityButton label="All Residents" active />
                            <VisibilityButton label="Owners Only" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                        <div>
                            <p className="font-bold text-sm text-slate-800">Anonymous Voting</p>
                            <p className="text-xs text-slate-500">Hide voter identities</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b5cf6]"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7] to-transparent md:relative md:bg-none md:p-0">
                <button className="w-full max-w-md mx-auto h-14 rounded-2xl bg-[#8b5cf6] text-white font-bold uppercase tracking-wider shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Create Poll
                </button>
            </div>

        </div>
    );
}

function DurationButton({ label, active }: any) {
    return (
        <button className={`h-10 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${active ? 'bg-[#8b5cf6] text-white shadow-lg shadow-purple-200' : 'bg-white/50 text-slate-500 hover:bg-white/70'}`}>
            {label}
        </button>
    );
}

function VisibilityButton({ label, active }: any) {
    return (
        <button className={`h-10 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${active ? 'bg-[#8b5cf6] text-white shadow-lg shadow-purple-200' : 'bg-white/50 text-slate-500 hover:bg-white/70'}`}>
            {label}
        </button>
    );
}
