"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Settings, ChevronRight, Tooltip as TooltipIcon, Cpu, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

const MACHINE_TYPES = [
    { id: "excavator", name: "Excavators", icon: "🚜" },
    { id: "bulldozer", name: "Bulldozers", icon: "🏗️" },
    { id: "loader", name: "Wheel Loaders", icon: "👷" },
    { id: "grader", name: "Motor Graders", icon: "🛤️" },
];

const BRANDS = ["Caterpillar", "Komatsu", "JCB", "Volvo", "Hyundai", "Doosan"];
const CATEGORIES = ["Engine Parts", "Hydraulic Parts", "Undercarriage", "Electrical", "Filters"];

export function PartsIntelligenceConsole() {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    return (
        <section className="py-24 md:py-32 relative overflow-hidden bg-navy">
            {/* Background Tech Decals */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 blur-[150px] rounded-full" />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full" />

                {/* SVG Grid Pattern */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <div className="container-premium relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 items-center">

                    {/* Left Side: Copy */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                <Cpu className="w-3 h-3" />
                                Parts Intelligence v2.0
                            </span>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 font-display leading-[1.1]">
                                Find the <span className="text-gold italic">Exact</span> Match for Your Fleet
                            </h2>
                            <p className="text-lg text-white/50 mb-10 leading-relaxed max-w-lg">
                                Skip the manual search. Use our intelligent filtering console to match OEM and aftermarket components specifically to your machine model.
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-gold">
                                        <Zap className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Instant Filter</span>
                                    </div>
                                    <p className="text-sm text-white/30">Zero latency database matching.</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-gold">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">OEM Verified</span>
                                    </div>
                                    <p className="text-sm text-white/30">Serialized compatibility checks.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Side: Interactive Console */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
                        >
                            {/* Glass Header */}
                            <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50 animate-pulse" />
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">System Online</span>
                                </div>
                                <Settings className="w-4 h-4 text-white/20 animate-spin-slow" />
                            </div>

                            <div className="space-y-8">
                                {/* 1. Machine Type Selection */}
                                <div>
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-4">01. Select Machine Type</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {MACHINE_TYPES.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setSelectedType(type.id)}
                                                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-3 ${selectedType === type.id
                                                        ? "bg-gold border-gold text-navy shadow-lg shadow-gold/20"
                                                        : "bg-white/5 border-white/5 text-white hover:border-white/20"
                                                    }`}
                                            >
                                                <span className="text-2xl">{type.icon}</span>
                                                <span className="text-[11px] font-bold uppercase tracking-tight">{type.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Brand & Category Selectors */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-4">02. Manufacturer</label>
                                        <select
                                            value={selectedBrand}
                                            onChange={(e) => setSelectedBrand(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer font-medium"
                                        >
                                            <option value="" className="bg-navy">All Brands</option>
                                            {BRANDS.map(brand => (
                                                <option key={brand} value={brand} className="bg-navy">{brand}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] block mb-4">03. Component Type</label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer font-medium"
                                        >
                                            <option value="" className="bg-navy">All Components</option>
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat} className="bg-navy">{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Search Button */}
                                <Link
                                    href={`/products?machineType=${selectedType || ""}&brand=${selectedBrand}&category=${selectedCategory}`}
                                    className="w-full group relative flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-gold to-[#D4AF37] text-navy font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-gold/20"
                                >
                                    <Search className="w-5 h-5" />
                                    INITIALIZE PARTS SEARCH
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                </Link>
                            </div>

                            {/* Decorative Elements */}
                            <div className="mt-8 flex justify-between items-center text-[9px] font-mono text-white/20 tracking-[0.2em]">
                                <span>DB_STATUS: CONNECTED</span>
                                <span>LATENCY: 12ms</span>
                                <span>VER_MOD: RC-402</span>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
