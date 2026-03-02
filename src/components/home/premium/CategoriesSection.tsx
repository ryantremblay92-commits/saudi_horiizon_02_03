"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const categories = [
    {
        id: "engine",
        image: "/images/home/engine.png",
        count: 156,
        featured: true,
    },
    {
        id: "hydraulics",
        image: "/images/home/hydraulics.png",
        count: 98,
        featured: false,
    },
    {
        id: "electrical",
        image: "/images/home/electrical.png",
        count: 124,
        featured: false,
    },
    {
        id: "transmission",
        image: "/images/home/transmission.png",
        count: 87,
        featured: false,
    },
    {
        id: "undercarriage",
        image: "/images/home/undercarriage.png",
        count: 112,
        featured: false,
    },
    {
        id: "attachments",
        image: "/images/home/attachments.png",
        count: 143,
        featured: true,
    },
];

export function CategoriesSection() {
    const { t } = useTranslation();
    const router = useRouter();
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    return (
        <section className="py-20 md:py-28 lg:py-32 relative overflow-hidden">
            <div className="container-premium">
                <div className="bg-white/5 rounded-[2rem] border border-white/5 p-8 md:p-12 lg:p-16 relative overflow-hidden">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16 relative z-10"
                    >
                        <div className="max-w-2xl">
                            <span className="micro-label mb-4 block">{t('home.categories.label')}</span>
                            <h2 className="heading-md">{t('home.categories.title')}</h2>
                        </div>
                        <Link
                            href="/categories"
                            className="btn-secondary whitespace-nowrap"
                        >
                            {t('home.categories.view_all')}
                            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        </Link>
                    </motion.div>

                    {/* Grid */}
                    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                        {categories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="group relative h-[440px] overflow-hidden rounded-3xl border border-white/10 cursor-pointer"
                                onClick={() => router.push(`/products?category=${category.id}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.push(`/products?category=${category.id}`);
                                    }
                                }}
                                aria-label={`View ${t(`home.categories.${category.id}.name`)} category`}
                            >
                                {/* Image */}
                                <div className="absolute inset-0">
                                    <img
                                        src={category.image}
                                        alt={t(`home.categories.${category.id}.name`)}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                    <div className="absolute top-8 right-8 rtl:left-8 rtl:right-auto">
                                        <div className="glass-premium px-5 py-2.5 rounded-full border border-white/10">
                                            <span className="text-gold font-bold text-sm tracking-tight">
                                                {category.count} <span className="text-white/60 font-normal">{t('home.categories.items')}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                                        <h3 className="text-3xl font-bold text-white tracking-tight">
                                            {t(`home.categories.${category.id}.name`)}
                                        </h3>
                                        <p className="text-white/60 line-clamp-2 text-base leading-relaxed max-w-[90%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                            {t(`home.categories.${category.id}.desc`)}
                                        </p>

                                        <div className="pt-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                            <Link
                                                href={`/products?category=${category.id}`}
                                                className="inline-flex items-center gap-3 px-7 py-3.5 bg-gold text-navy rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors group/btn"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {t('home.categories.explore')}
                                                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 rtl:rotate-180 rtl:group-hover/btn:-translate-x-1" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 border border-white/5 group-hover:border-gold/30 rounded-3xl transition-colors duration-500" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
