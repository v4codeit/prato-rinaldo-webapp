"use client";

import React, { useState } from "react";
import { ArrowLeft, Upload, X, DollarSign, Type, AlignLeft, Tag } from "lucide-react";

interface NexusMarketplaceCreateProps {
    onBack: () => void;
}

export function NexusMarketplaceCreate({ onBack }: NexusMarketplaceCreateProps) {
    const [images, setImages] = useState<string[]>([]);

    const addImage = () => {
        setImages([...images, "https://images.unsplash.com/photo-1507473888900-52e1adad5481?q=80&w=1974&auto=format&fit=crop"]);
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
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
                <h2 className="text-xl font-black text-slate-900">Sell Item</h2>
                <div className="w-20" />
            </div>

            {/* Image Upload */}
            <div className="nexus-glass rounded-[30px] p-4 bg-white/40">
                <div className="flex gap-3 overflow-x-auto pb-2 demo-no-scrollbar">
                    {images.map((img, i) => (
                        <div key={i} className="relative shrink-0">
                            <div className="h-32 w-32 rounded-2xl overflow-hidden">
                                <img src={img} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                            </div>
                            <button
                                onClick={() => removeImage(i)}
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {images.length < 5 && (
                        <button
                            onClick={addImage}
                            className="h-32 w-32 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 hover:border-[#0ea5e9] hover:bg-white/50 transition-colors shrink-0"
                        >
                            <Upload className="h-8 w-8 text-slate-300" />
                            <span className="text-xs font-bold text-slate-400">Add Photo</span>
                        </button>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-3 ml-1">Add up to 5 photos</p>
            </div>

            {/* Form */}
            <div className="space-y-4">

                <FormField
                    icon={Type}
                    label="Item Title"
                    placeholder="Vintage Lamp"
                />

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        icon={DollarSign}
                        label="Price (€)"
                        placeholder="45"
                        type="number"
                    />
                    <div className="nexus-glass rounded-[24px] p-4 bg-white/40">
                        <div className="flex items-center gap-2 mb-2">
                            <Tag className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Condition</span>
                        </div>
                        <select className="w-full h-12 bg-white/50 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50">
                            <option>Like New</option>
                            <option>Good</option>
                            <option>Fair</option>
                            <option>For Parts</option>
                        </select>
                    </div>
                </div>

                <div className="nexus-glass rounded-[24px] p-4 bg-white/40">
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-3">Category</span>
                    <div className="flex flex-wrap gap-2">
                        <CategoryPill label="Furniture" active />
                        <CategoryPill label="Electronics" />
                        <CategoryPill label="Clothing" />
                        <CategoryPill label="Garden" />
                        <CategoryPill label="Books" />
                        <CategoryPill label="Other" />
                    </div>
                </div>

                <div className="nexus-glass rounded-[24px] p-4 bg-white/40">
                    <div className="flex items-center gap-2 mb-3">
                        <AlignLeft className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                    </div>
                    <textarea
                        placeholder="Describe your item, including condition, size, and any other relevant details..."
                        className="w-full h-32 bg-white/50 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 resize-none"
                    />
                </div>

            </div>

            {/* Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7] to-transparent md:relative md:bg-none md:p-0">
                <button className="w-full max-w-md mx-auto h-14 rounded-2xl bg-[#0ea5e9] text-white font-bold uppercase tracking-wider shadow-lg shadow-sky-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Publish Listing
                </button>
            </div>

        </div>
    );
}

function FormField({ icon: Icon, label, placeholder, type = "text" }: any) {
    return (
        <div className="nexus-glass rounded-[24px] p-4 bg-white/40">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
            </div>
            <input
                type={type}
                placeholder={placeholder}
                className="w-full h-12 bg-white/50 rounded-xl px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50"
            />
        </div>
    );
}

function CategoryPill({ label, active }: any) {
    return (
        <button className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${active ? 'bg-[#0ea5e9] text-white shadow-lg shadow-sky-200' : 'bg-white/50 text-slate-500 hover:bg-white/70'}`}>
            {label}
        </button>
    );
}
