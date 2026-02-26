"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Package,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    BarChart3,
    Plus,
    ArrowRight,
    FileText,
    Activity,
    ShieldAlert,
    Cpu,
    Globe,
    Zap,
    ChevronRight,
    Search,
    Bell,
    Settings,
    LayoutDashboard
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminStats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    monthlyRevenue: Array<{ _id: string; sales: number; count: number }>;
    recentOrders: Array<{
        _id: string;
        user?: { email: string };
        totalAmount: number;
        status: string;
        createdAt: string;
    }>;
    stripeBalance?: {
        available: number;
        pending: number;
    };
    topProducts?: Array<{
        _id: string;
        totalSold: number;
        revenue: number;
    }>;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user, isInitialized } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overviewTab, setOverviewTab] = useState<'revenue' | 'orders'>('revenue');
    const [clockTime, setClockTime] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const tick = () => setClockTime(new Date().toLocaleTimeString());
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (isInitialized) {
            loadStats();
        }
    }, [isInitialized]);

    const loadStats = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('accessToken');
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/login');
                    throw new Error('Session expired');
                }
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Failed to connect to mainframe');
            }
            const data = await response.json();
            setStats(data);
        } catch (err: any) {
            console.error('Failed to load admin stats:', err);
            setError(err.message || 'Mainframe connection failure');
            toast.error(err.message || 'Sync error');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0
        }).format(amount).replace('SAR', 'SAR ');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const Sparkline = ({ color = "text-gold", data = [40, 35, 50, 45, 60, 55, 70] }) => {
        const height = 30;
        const width = 100;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className={`overflow-visible ${color}`} preserveAspectRatio="none">
                <path d={`M ${points}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
        );
    };

    if (loading) {
        return (
            <AdminLayout title="Mainframe" onRefresh={loadStats}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-gold/10 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Cpu className="w-8 h-8 text-gold animate-pulse" />
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const statCards = [
        {
            title: 'Global Revenue',
            value: formatCurrency(stats?.totalRevenue || 0),
            icon: DollarSign,
            trend: '+12.5%',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            spark: [40, 45, 42, 50, 48, 55, 60]
        },
        {
            title: 'Personnel Count',
            value: stats?.totalUsers || 0,
            icon: Users,
            trend: '+3.2%',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            spark: [80, 82, 81, 85, 84, 88, 90]
        },
        {
            title: 'Logistics Queue',
            value: stats?.totalOrders || 0,
            icon: ShoppingCart,
            trend: '+24%',
            color: 'text-gold',
            bg: 'bg-gold/10',
            spark: [20, 35, 40, 30, 55, 65, 80]
        },
        {
            title: 'Asset Inventory',
            value: stats?.totalProducts || 0,
            icon: Package,
            trend: '-1.4%',
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            spark: [100, 95, 98, 92, 90, 88, 85]
        }
    ];

    return (
        <AdminLayout
            title="Command Center"
            description="Real-time operational overview of the Saudi Horizon network"
            onRefresh={loadStats}
        >
            <div className="relative z-10">
                {/* Real-time Status Bar */}
                <div className="flex flex-wrap items-center gap-6 mb-10 p-4 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3 px-4 border-r border-white/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Global Network: Online</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 border-r border-white/10">
                        <Zap className="w-4 h-4 text-gold" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Mainframe Latency: 12ms</span>
                    </div>
                    <div className="flex items-center gap-3 px-4">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Nodes Active: 4/4</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2 pr-2">
                        {mounted && clockTime && (
                            <div className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{clockTime}</div>
                        )}
                    </div>
                </div>

                {/* Primary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {statCards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-premium p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center border border-white/10 group-hover:border-gold/30 transition-all`}>
                                        <card.icon className={`w-7 h-7 ${card.color}`} />
                                    </div>
                                    <Badge className="bg-white/5 text-emerald-400 border-emerald-500/20 text-[10px] font-black pointer-events-none">
                                        {card.trend}
                                    </Badge>
                                </div>
                                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{card.title}</p>
                                <h3 className="text-3xl font-black text-white font-display tracking-tight group-hover:text-gold transition-colors">
                                    {mounted ? card.value : '---'}
                                </h3>
                                <div className="mt-6 h-8 opacity-30 group-hover:opacity-100 transition-opacity">
                                    <Sparkline color={card.color} data={card.spark} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Fulfillment Flow */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-premium rounded-[3rem] border border-white/5 bg-white/[0.01] p-10">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight">Fulfillment Pipeline</h3>
                                    <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-1">Live Transaction Stream</p>
                                </div>
                                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                                    {['Movement', 'Live Queue'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setOverviewTab(tab === 'Movement' ? 'revenue' : 'orders')}
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${(overviewTab === 'revenue' && tab === 'Movement') || (overviewTab === 'orders' && tab === 'Live Queue')
                                                ? 'bg-gold text-navy shadow-xl'
                                                : 'text-white/40 hover:text-white'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {overviewTab === 'revenue' ? (
                                    <motion.div
                                        key="revenue"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-8"
                                    >
                                        {(stats?.monthlyRevenue || []).slice(-5).map((month, idx) => (
                                            <div key={idx} className="group">
                                                <div className="flex items-center justify-between mb-3 pl-1">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{month._id} Performance</span>
                                                    <span className="text-sm font-black text-white font-display">{formatCurrency(month.sales || 0)}</span>
                                                </div>
                                                <div className="h-4 bg-white/[0.02] rounded-full border border-white/5 p-1 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.max(5, (month.sales / Math.max(...stats!.monthlyRevenue.map(m => m.sales))) * 100)}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                        className="h-full bg-gradient-to-r from-gold/40 to-gold rounded-full shadow-[0_0_20px_rgba(255,215,0,0.3)] relative"
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                    </motion.div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="orders"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        {stats?.recentOrders?.slice(0, 5).map((order, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-pointer" onClick={() => router.push('/admin/orders')}>
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center border border-white/10 group-hover:border-gold/30 transition-all">
                                                        <ShoppingCart className="w-6 h-6 text-white/20 group-hover:text-gold" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-black text-sm tracking-tighter uppercase font-display">Contract #{order._id.slice(-8).toUpperCase()}</p>
                                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{order.user?.email || 'External Link'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-black font-display">{formatCurrency(order.totalAmount)}</p>
                                                    <Badge className="bg-gold/10 text-gold border-gold/20 text-[8px] font-black uppercase mt-1">
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Secondary Actions */}
                    <div className="space-y-10">
                        {/* Control Deck */}
                        <div className="glass-premium rounded-[3rem] border border-white/5 p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-gold/10 transition-colors" />
                            <h3 className="text-xl font-black text-white font-display mb-6 uppercase tracking-tight flex items-center gap-3">
                                <Zap className="w-5 h-5 text-gold" />
                                Command Deck
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { label: 'Asset Entry', desc: 'Secure listing initialization', icon: Plus, path: '/admin/products/new', color: 'text-gold' },
                                    { label: 'Personnel', desc: 'Registry management', icon: Users, path: '/admin/users', color: 'text-blue-400' },
                                    { label: 'Logistics', desc: 'Queue processing', icon: Package, path: '/admin/orders', color: 'text-purple-400' }
                                ].map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => router.push(action.path)}
                                        className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-gold/30 hover:bg-white/[0.06] transition-all group/btn"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center border border-white/10 group-hover/btn:border-current transition-all">
                                                <action.icon className={`w-6 h-6 ${action.color}`} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-white uppercase tracking-tight group-hover/btn:text-gold">{action.label}</p>
                                                <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{action.desc}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/20 group-hover/btn:text-gold group-hover/btn:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* High Priority Alerts */}
                        <div className="glass-premium rounded-[3rem] border border-white/5 p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-red-500/10 transition-colors" />
                            <h3 className="text-xl font-black text-white font-display mb-6 uppercase tracking-tight flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                                Security Alerts
                            </h3>
                            <div className="space-y-4">
                                <div className="p-6 rounded-3xl bg-white/[0.03] border-l-4 border-l-red-500 border-white/5 hover:bg-white/[0.06] transition-all cursor-pointer shadow-lg shadow-red-500/5" onClick={() => router.push('/admin/orders?status=pending')}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Priority One</span>
                                        <Bell className="w-4 h-4 text-red-500/40" />
                                    </div>
                                    <p className="text-3xl font-black text-white font-display mb-1">{stats?.recentOrders?.filter(o => o.status === 'pending').length || 0}</p>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Unprocessed Contracts</p>
                                </div>

                                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 relative group/item">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FileText className="w-4 h-4 text-blue-400" />
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Logistics Dispatch</span>
                                    </div>
                                    <p className="text-[11px] text-white/60 leading-relaxed italic font-medium">
                                        "Confirming hydraulic structural variance on ID #H2KW-01. Awaiting tech sign-off."
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">OPERATOR-7 • 12 MIN AGO</span>
                                        <div className="w-2 h-2 rounded-full bg-blue-500 group-hover/item:scale-125 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
