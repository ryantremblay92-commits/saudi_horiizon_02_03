"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import {
    Save,
    Globe,
    Bell,
    Shield,
    Store,
    Search,
    FileText,
    MapPin,
    Loader2,
    ChevronRight,
    Settings,
    Lock,
    ToggleLeft,
    ToggleRight,
    CheckCircle2,
    AlertCircle,
    Clock,
    Zap,
    Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSettingsPage() {
    const { isInitialized } = useAuth();
    const [initialLoading, setInitialLoading] = useState(true);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('store');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [storeInfo, setStoreInfo] = useState({
        name: 'Saudi Horizon',
        tagline: 'Premium Heavy Equipment Parts Supplier',
        email: 'info@saudihorizon.com',
        phone: '+966 11 123 4567',
        whatsapp: '+966 50 123 4567',
        address: 'Riyadh, Saudi Arabia',
        businessHours: 'Sun-Thu: 8:00 AM - 6:00 PM',
        description: 'Leading supplier of genuine heavy equipment parts for Caterpillar, Komatsu, Volvo, and more.'
    });

    const [seo, setSeo] = useState({
        metaTitle: 'Saudi Horizon - Heavy Equipment Parts Supplier',
        metaDescription: 'Genuine heavy equipment parts for Caterpillar, Komatsu, Volvo, and more. Fast delivery across Saudi Arabia.',
        keywords: 'heavy equipment parts, caterpillar parts, komatsu, volvo, excavator parts, dozer parts',
        ogImage: '/images/og-image.jpg'
    });

    const [content, setContent] = useState({
        heroTitle: 'Premium Heavy Equipment Parts',
        heroSubtitle: 'Genuine parts for Caterpillar, Komatsu, Volvo & more',
        heroCta: 'Request a Quote',
        feature1Title: 'Genuine Parts',
        feature1Desc: '100% authentic OEM parts',
        feature2Title: 'Fast Delivery',
        feature2Desc: 'Across Saudi Arabia',
        feature3Title: 'Expert Support',
        feature3Desc: 'Technical expertise',
        footerAbout: 'Saudi Horizon is a leading supplier of heavy equipment parts in the Middle East.',
        footerContact: 'Contact us: info@saudihorizon.com'
    });

    const [general, setGeneral] = useState({
        appName: 'Saudi Horizon',
        appUrl: 'https://saudihorizon.com',
        supportEmail: 'support@saudihorizon.com',
        currency: 'SAR',
        timezone: 'Asia/Riyadh',
        language: 'en'
    });

    const [notifications, setNotifications] = useState({
        orderNotifications: true,
        lowStockAlerts: true,
        newUserRegistrations: false,
        quoteRequests: true,
        marketingEmails: false
    });

    const [security, setSecurity] = useState({
        twoFactorAuth: false,
        sessionTimeout: '30 minutes',
        passwordPolicy: true,
        loginAttemptsLockout: '5 attempts'
    });

    const getHeaders = (): HeadersInit => {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    useEffect(() => {
        if (isInitialized) {
            loadSettings();
        }
    }, [isInitialized]);

    const loadSettings = async () => {
        try {
            setInitialLoading(true);
            const response = await fetch('/api/admin/settings', { headers: getHeaders() });
            if (!response.ok) throw new Error('Failed to load');
            const data = await response.json();
            const s = data.settings || {};
            if (s.store) setStoreInfo(prev => ({ ...prev, ...s.store }));
            if (s.seo) setSeo(prev => ({ ...prev, ...s.seo }));
            if (s.content) setContent(prev => ({ ...prev, ...s.content }));
            if (s.general) setGeneral(prev => ({ ...prev, ...s.general }));
            if (s.notifications) setNotifications(prev => ({ ...prev, ...s.notifications }));
            if (s.security) setSecurity(prev => ({ ...prev, ...s.security }));
        } catch (err) {
            console.error('Error loading settings:', err);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async (section: string, data: any) => {
        setSavingSection(section);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ section, data })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to save');
            }
            toast.success(`Protocol "${section}" committed to vault`);
        } catch (err: any) {
            toast.error(err.message || 'Commit failed');
        } finally {
            setSavingSection(null);
        }
    };

    const tabs = [
        { id: 'store', label: 'Store Protocol', icon: Store },
        { id: 'seo', label: 'SEO Matrix', icon: Search },
        { id: 'content', label: 'Content Grid', icon: FileText },
        { id: 'general', label: 'Core Config', icon: Globe },
        { id: 'notifications', label: 'Signal Routes', icon: Bell },
        { id: 'security', label: 'Security Layer', icon: Shield },
    ];

    const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</label>
            {children}
        </div>
    );

    const inputClass = "w-full bg-white/[0.03] border border-white/10 text-white placeholder-white/20 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-gold/50 focus:bg-gold/5 transition-all font-sans backdrop-blur-sm";

    const SaveButton = ({ section, data }: { section: string; data: any }) => (
        <button
            onClick={() => handleSave(section, data)}
            disabled={savingSection === section}
            className="flex items-center gap-3 px-8 py-4 bg-gold hover:bg-gold/90 text-navy rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-xl shadow-gold/20"
        >
            {savingSection === section
                ? <><Loader2 className="w-4 h-4 animate-spin" />Committing...</>
                : <><Save className="w-4 h-4" />Commit to Vault</>
            }
        </button>
    );

    if (initialLoading) return (
        <AdminLayout title="System Configuration" description="Configure operational parameters">
            <div className="flex flex-col items-center justify-center py-32">
                <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-gold/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                    <Settings className="absolute inset-0 m-auto w-8 h-8 text-gold animate-pulse" />
                </div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Loading Configuration Vault...</p>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout
            title="System Overrides"
            description="Operational parameters and mainframe protocol management"
            onRefresh={loadSettings}
        >
            <div className="relative z-10">
                {/* Systemic Status Header */}
                <div className="flex flex-wrap items-center gap-6 mb-10 p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3 px-5 border-r border-white/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Mainframe: Synchronized</span>
                    </div>
                    <div className="flex items-center gap-3 px-5 border-r border-white/10">
                        <Lock className="w-4 h-4 text-gold" />
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Vault: Secure</span>
                    </div>
                    <div className="flex items-center gap-3 px-5 border-r border-white/10 hidden md:flex">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Encryption: Active</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4 pr-3">
                        {mounted && (
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">Last Commit: {new Date().toLocaleTimeString()}</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-10">
                    {/* Tab Rail */}
                    <div className="xl:w-72 space-y-3 flex-shrink-0">
                        <div className="px-4 mb-4">
                            <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Override Modules</h3>
                        </div>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-left transition-all relative group overflow-hidden ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-gold/20 to-gold/5 text-gold border border-gold/20 shadow-[0_0_30px_rgba(255,215,0,0.1)]'
                                    : 'bg-white/[0.02] border border-white/5 text-white/40 hover:text-white hover:bg-white/[0.06]'
                                    }`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div layoutId="activeTabGlow" className="absolute inset-0 bg-gold/5 opacity-50 blur-xl" />
                                )}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-navy/40 border border-gold/30' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                    <tab.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-gold fill-gold/20' : ''}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                                    {activeTab === tab.id && <span className="text-[8px] font-medium text-gold/60 uppercase tracking-widest mt-0.5">Active Link</span>}
                                </div>
                                <ChevronRight className={`w-4 h-4 ml-auto transition-all ${activeTab === tab.id ? 'translate-x-1 opacity-100' : 'opacity-0 -translate-x-2'}`} />
                            </button>
                        ))}
                    </div>

                    {/* Content Panel */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="glass-premium rounded-[3.5rem] border border-white/5 p-12 relative overflow-hidden"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                                {activeTab === 'store' && (
                                    <div className="space-y-10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                                            <div>
                                                <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Store Protocol</h2>
                                                <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-2">Core Merchant Identity Matrix</p>
                                            </div>
                                            <SaveButton section="store" data={storeInfo} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FieldRow label="Merchant Designation">
                                                <input className={inputClass} value={storeInfo.name} onChange={e => setStoreInfo({ ...storeInfo, name: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="Brand Vision Vector">
                                                <input className={inputClass} value={storeInfo.tagline} onChange={e => setStoreInfo({ ...storeInfo, tagline: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="Inbound Signal (Email)">
                                                <input type="email" className={inputClass} value={storeInfo.email} onChange={e => setStoreInfo({ ...storeInfo, email: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="Voice Command Link">
                                                <input className={inputClass} value={storeInfo.phone} onChange={e => setStoreInfo({ ...storeInfo, phone: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="WhatsApp Encryption Node">
                                                <input className={inputClass} value={storeInfo.whatsapp} onChange={e => setStoreInfo({ ...storeInfo, whatsapp: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="Operational Duty Cycle">
                                                <input className={inputClass} value={storeInfo.businessHours} onChange={e => setStoreInfo({ ...storeInfo, businessHours: e.target.value })} />
                                            </FieldRow>
                                            <div className="md:col-span-2">
                                                <FieldRow label="Physical Terminal Coordinate">
                                                    <input className={inputClass} value={storeInfo.address} onChange={e => setStoreInfo({ ...storeInfo, address: e.target.value })} />
                                                </FieldRow>
                                            </div>
                                            <div className="md:col-span-2">
                                                <FieldRow label="Brand Narrative Protocol">
                                                    <textarea className={`${inputClass} resize-none`} rows={4} value={storeInfo.description} onChange={e => setStoreInfo({ ...storeInfo, description: e.target.value })} />
                                                </FieldRow>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'seo' && (
                                    <div className="space-y-10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                                            <div>
                                                <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">SEO Matrix</h2>
                                                <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-2">Crawler Signal Parameters</p>
                                            </div>
                                            <SaveButton section="seo" data={seo} />
                                        </div>
                                        <div className="grid grid-cols-1 gap-10">
                                            <FieldRow label={`Mainframe Identity Title (${seo.metaTitle.length}/60)`}>
                                                <input className={inputClass} value={seo.metaTitle} onChange={e => setSeo({ ...seo, metaTitle: e.target.value })} />
                                                <div className="h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden border border-white/5">
                                                    <div className="h-full bg-gradient-to-r from-gold/50 to-gold rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,215,0,0.3)]" style={{ width: `${Math.min((seo.metaTitle.length / 60) * 100, 100)}%` }} />
                                                </div>
                                            </FieldRow>
                                            <FieldRow label={`Index Narrative Description (${seo.metaDescription.length}/160)`}>
                                                <textarea className={`${inputClass} resize-none`} rows={4} value={seo.metaDescription} onChange={e => setSeo({ ...seo, metaDescription: e.target.value })} />
                                                <div className="h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden border border-white/5">
                                                    <div className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.3)]" style={{ width: `${Math.min((seo.metaDescription.length / 160) * 100, 100)}%` }} />
                                                </div>
                                            </FieldRow>
                                            <FieldRow label="Search Engine Signal Tokens (CSV)">
                                                <input className={inputClass} value={seo.keywords} onChange={e => setSeo({ ...seo, keywords: e.target.value })} placeholder="keyword1, keyword2, ..." />
                                            </FieldRow>
                                            <FieldRow label="OpenGraph Visual Asset URL">
                                                <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group/og">
                                                    <input className={`${inputClass} flex-1`} value={seo.ogImage} onChange={e => setSeo({ ...seo, ogImage: e.target.value })} placeholder="https://..." />
                                                    <div className="w-20 h-14 rounded-xl bg-navy/40 border border-white/10 overflow-hidden flex-shrink-0 relative group-hover/og:border-gold/30 transition-all">
                                                        {seo.ogImage ? <img src={seo.ogImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Globe className="w-5 h-5 text-white/10" /></div>}
                                                    </div>
                                                </div>
                                            </FieldRow>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'content' && (
                                    <div className="space-y-10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                                            <div>
                                                <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Content Grid</h2>
                                                <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-2">Tactical Copy & Visual Directives</p>
                                            </div>
                                            <SaveButton section="content" data={content} />
                                        </div>
                                        <div className="space-y-12">
                                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative overflow-hidden group/hero">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full" />
                                                <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                    <Zap className="w-3 h-3" />
                                                    Hero Module Configuration
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <FieldRow label="Primary Deployment Title">
                                                        <input className={inputClass} value={content.heroTitle} onChange={e => setContent({ ...content, heroTitle: e.target.value })} />
                                                    </FieldRow>
                                                    <FieldRow label="Call-to-Action Protocol">
                                                        <input className={inputClass} value={content.heroCta} onChange={e => setContent({ ...content, heroCta: e.target.value })} />
                                                    </FieldRow>
                                                    <div className="md:col-span-2">
                                                        <FieldRow label="Secondary Support Narrative">
                                                            <textarea className={`${inputClass} resize-none`} rows={3} value={content.heroSubtitle} onChange={e => setContent({ ...content, heroSubtitle: e.target.value })} />
                                                        </FieldRow>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6">Value Proposition Nodes</p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {[1, 2, 3].map(n => (
                                                        <div key={n} className="space-y-4 p-6 bg-white/[0.02] rounded-3xl border border-white/5 group/node hover:border-white/10 transition-all">
                                                            <p className="text-[10px] font-black text-white/10 uppercase tracking-widest flex items-center justify-between">
                                                                Node 0{n}
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover/node:bg-blue-400 transition-colors" />
                                                            </p>
                                                            <input className={`${inputClass} px-4 py-3`} placeholder="Operational Title" value={(content as any)[`feature${n}Title`]} onChange={e => setContent({ ...content, [`feature${n}Title`]: e.target.value } as any)} />
                                                            <textarea className={`${inputClass} px-4 py-3 resize-none text-xs`} rows={3} placeholder="Functional Objective" value={(content as any)[`feature${n}Desc`]} onChange={e => setContent({ ...content, [`feature${n}Desc`]: e.target.value } as any)} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'general' && (
                                    <div className="space-y-10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                                            <div>
                                                <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Core Configuration</h2>
                                                <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-2">Fundamental System Parameters</p>
                                            </div>
                                            <SaveButton section="general" data={general} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FieldRow label="System Identity">
                                                <input className={inputClass} value={general.appName} onChange={e => setGeneral({ ...general, appName: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="Deployment URL">
                                                <input className={inputClass} value={general.appUrl} onChange={e => setGeneral({ ...general, appUrl: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="Support Channel">
                                                <input type="email" className={inputClass} value={general.supportEmail} onChange={e => setGeneral({ ...general, supportEmail: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="Base Currency Code">
                                                <input className={inputClass} value={general.currency} onChange={e => setGeneral({ ...general, currency: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="Mainframe Time Zone">
                                                <input className={inputClass} value={general.timezone} onChange={e => setGeneral({ ...general, timezone: e.target.value })} />
                                            </FieldRow>
                                            <FieldRow label="Primary System Language">
                                                <input className={inputClass} value={general.language} onChange={e => setGeneral({ ...general, language: e.target.value })} />
                                            </FieldRow>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                                            <div>
                                                <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Signal Routes</h2>
                                                <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-2">Alert & Notification Nodes</p>
                                            </div>
                                            <SaveButton section="notifications" data={notifications} />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {([
                                                { key: 'orderNotifications', label: 'Order Intercept', desc: 'Alert triggered on new order intake', icon: Zap },
                                                { key: 'lowStockAlerts', label: 'Critical Inventory Alert', desc: 'Signal fires when asset levels are depleted', icon: AlertCircle },
                                                { key: 'newUserRegistrations', label: 'Node Authentication', desc: 'Alert on new personnel registration', icon: ToggleRight },
                                                { key: 'quoteRequests', label: 'Quote Protocol Signal', desc: 'Notify on inbound quote requests', icon: CheckCircle2 },
                                                { key: 'marketingEmails', label: 'Campaign Broadcast', desc: 'Enable promotional signal dispatch', icon: Globe },
                                            ] as const).map((item) => (
                                                <div key={item.key} className="flex items-center justify-between p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group overflow-hidden relative">
                                                    <div className="flex items-center gap-6 relative z-10">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${notifications[item.key] ? 'bg-gold/10 border border-gold/30' : 'bg-white/5 border border-white/10'}`}>
                                                            <item.icon className={`w-5 h-5 ${notifications[item.key] ? 'text-gold' : 'text-white/20'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-gold transition-colors">{item.label}</p>
                                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">{item.desc}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                                        className={`relative w-16 h-8 rounded-full transition-all peer z-10 ${notifications[item.key] ? 'bg-gold shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'bg-white/10'}`}
                                                    >
                                                        <span className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-white transition-all shadow-md ${notifications[item.key] ? 'translate-x-8' : 'translate-x-0'}`} />
                                                    </button>
                                                    {notifications[item.key] && <div className="absolute inset-0 bg-gold/5 blur-2xl pointer-events-none" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                                            <div>
                                                <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Security Layer</h2>
                                                <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-2">Authentication & Access Control</p>
                                            </div>
                                            <SaveButton section="security" data={security} />
                                        </div>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-gold/20 transition-all relative overflow-hidden">
                                                <div className="relative z-10">
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">Dual-Factor Authentication</p>
                                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Require 2FA on all administrative access attempts</p>
                                                </div>
                                                <button
                                                    onClick={() => setSecurity(prev => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }))}
                                                    className={`relative w-16 h-8 rounded-full transition-all z-10 ${security.twoFactorAuth ? 'bg-gold shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'bg-white/10'}`}
                                                >
                                                    <span className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-white transition-all shadow-md ${security.twoFactorAuth ? 'translate-x-8' : 'translate-x-0'}`} />
                                                </button>
                                                {security.twoFactorAuth && <div className="absolute inset-0 bg-gold/5 blur-3xl pointer-events-none" />}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        Session Timeout Protocol
                                                    </p>
                                                    <select
                                                        value={security.sessionTimeout}
                                                        onChange={e => setSecurity({ ...security, sessionTimeout: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-gold/50 transition-all"
                                                    >
                                                        <option value="15 minutes">15 Standard Cycles</option>
                                                        <option value="30 minutes">30 Standard Cycles</option>
                                                        <option value="1 hour">60 Extended Cycles</option>
                                                        <option value="4 hours">Operational Shift</option>
                                                    </select>
                                                </div>

                                                <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                                                        <Lock className="w-3 h-3" />
                                                        Lockout Threshold
                                                    </p>
                                                    <select
                                                        value={security.loginAttemptsLockout}
                                                        onChange={e => setSecurity({ ...security, loginAttemptsLockout: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-gold/50 transition-all"
                                                    >
                                                        <option value="3 attempts">3 Strike Policy</option>
                                                        <option value="5 attempts">5 Strike Policy</option>
                                                        <option value="10 attempts">10 Strike Policy</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-gold/20 transition-all relative overflow-hidden">
                                                <div className="relative z-10">
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">Credential Entropy Policy</p>
                                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Enforce high-complexity password constraints</p>
                                                </div>
                                                <button
                                                    onClick={() => setSecurity(prev => ({ ...prev, passwordPolicy: !prev.passwordPolicy }))}
                                                    className={`relative w-16 h-8 rounded-full transition-all z-10 ${security.passwordPolicy ? 'bg-gold shadow-[0_0_20px_rgba(255,215,0,0.3)]' : 'bg-white/10'}`}
                                                >
                                                    <span className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-white transition-all shadow-md ${security.passwordPolicy ? 'translate-x-8' : 'translate-x-0'}`} />
                                                </button>
                                                {security.passwordPolicy && <div className="absolute inset-0 bg-gold/5 blur-3xl pointer-events-none" />}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
