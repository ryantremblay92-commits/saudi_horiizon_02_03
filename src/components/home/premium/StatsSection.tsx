'use client';

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function Counter({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!inView) return;

        let start = 0;
        const duration = 2000;
        const increment = value / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [inView, value]);

    return (
        <span className="text-5xl md:text-6xl lg:text-7xl font-bold text-gradient-gold block mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {count}{suffix}
        </span>
    );
}

export function StatsSection() {
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    const stats = [
        { value: 15, suffix: "+", label: t('home.stats.experience'), detail: t('home.stats.experience_detail') },
        { value: 1000, suffix: "+", label: t('home.stats.clients'), detail: t('home.stats.clients_detail') },
        { value: 720, suffix: "+", label: t('home.stats.products'), detail: t('home.stats.products_detail') },
        { value: 98, suffix: "%", label: t('home.stats.delivery'), detail: t('home.stats.delivery_detail') },
    ];

    return (
        <section
            ref={containerRef}
            className="py-20 md:py-28 lg:py-32 relative overflow-hidden"
        >
            <div className="container-premium">
                <div className="bg-white/5 rounded-[2.5rem] border border-white/5 p-12 md:p-20 lg:p-24 relative overflow-hidden mx-auto w-full">
                    {/* Background Texture */}
                    <div className="absolute inset-0 gradient-accent-glow opacity-20" />
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                            backgroundSize: '80px 80px'
                        }}
                    />

                    <div className="relative z-10">
                        {/* Section Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-24 max-w-3xl mx-auto"
                        >
                            <span className="micro-label mb-6 block tracking-[0.3em] uppercase">{t('home.stats.label')}</span>
                            <h2 className="heading-md mb-6">{t('home.stats.title')}</h2>
                            <div className="w-16 h-1 bg-gold/40 mx-auto rounded-full" />
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                                    className="text-center group"
                                >
                                    <Counter
                                        value={stat.value}
                                        suffix={stat.suffix}
                                        inView={isInView}
                                    />
                                    <div className="space-y-3">
                                        <div className="text-xs font-black text-white/40 tracking-[0.25em] group-hover:text-gold/60 transition-colors uppercase">
                                            {stat.label}
                                        </div>
                                        <p className="text-sm text-white/30 max-w-[180px] mx-auto leading-relaxed font-medium">
                                            {stat.detail}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Bottom Trust Note */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : {}}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="mt-24 pt-12 border-t border-white/5 text-center"
                        >
                            <p className="text-sm text-white/20 font-bold tracking-widest uppercase">
                                {t('home.stats.trust_note')}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
