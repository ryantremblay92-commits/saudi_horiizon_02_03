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
    LayoutDashboard,
    Loader2
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
                throw new Error(errorData.error || errorData.message || 'Failed to connect to dashboard');
            }
            const data = await response.json();
            setStats(data);
        } catch (err: any) {
            console.error('Failed to load admin stats:', err);
            setError(err.message || 'Connection error');
            toast.error(err.message || 'Update error');
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
            <AdminLayout title="Dashboard" onRefresh={loadStats}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-gold/10 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-gold animate-spin" />
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const statCards = [
        {
            title: 'Monthly Revenue',
            value: formatCurrency(stats?.totalRevenue || 0),
            icon: DollarSign,
            trend: '+12.5%',
            positive: true,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/5',
            spark: [40, 45, 42, 50, 48, 55, 60]
        },
        {
            title: 'Total Customers',
            value: stats?.totalUsers || 0,
            icon: Users,
            trend: '+3.2%',
            positive: true,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/5',
            spark: [80, 82, 81, 85, 84, 88, 90]
        },
        {
            title: 'Active Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingCart,
            trend: '+24%',
            positive: true,
            color: 'text-gold',
            bg: 'bg-gold/5',
            spark: [20, 35, 40, 30, 55, 65, 80]
        },
        {
            title: 'Total Products',
            value: stats?.totalProducts || 0,
            icon: Package,
            trend: '-1.4%',
            positive: false,
            color: 'text-slate-400',
            bg: 'bg-white/5',
            spark: [100, 95, 98, 92, 90, 88, 85]
        }
    ];

    return (
        <AdminLayout
            title="Dashboard"
            description="Manage your orders, inventory, and customer data."
            onRefresh={loadStats}
        >
            <div className="space-y-8 relative z-10 pb-20">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-[#0A1017] border border-white/[0.03] p-6 rounded-3xl hover:border-white/[0.08] transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-2xl ${card.bg}`}>
                                    <card.icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-bold ${card.positive ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {card.trend}
                                    {card.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-xs font-semibold text-slate-500 mb-1">{card.title}</p>
                                <h3 className="text-2xl font-bold text-white tracking-tight">
                                    {mounted ? card.value : '---'}
                                </h3>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/[0.02]">
                                <Sparkline color={card.color} data={card.spark} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Revenue & Activity Chart */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-[#0A1017] border border-white/[0.03] rounded-[2.5rem] p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">Store Performance</h3>
                                    <p className="text-xs text-slate-500 font-medium">Insights into sales and order volume</p>
                                </div>
                                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/[0.02]">
                                    {['Revenue', 'Orders'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setOverviewTab(tab === 'Revenue' ? 'revenue' : 'orders')}
                                            className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${(overviewTab === 'revenue' && tab === 'Revenue') || (overviewTab === 'orders' && tab === 'Orders')
                                                ? 'bg-gold text-navy shadow-lg'
                                                : 'text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="min-h-[300px]">
                                <AnimatePresence mode="wait">
                                    {overviewTab === 'revenue' ? (
                                        <motion.div
                                            key="revenue"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="space-y-6"
                                        >
                                            {(stats?.monthlyRevenue || []).slice(-5).map((month, idx) => (
                                                <div key={idx} className="group">
                                                    <div className="flex items-center justify-between mb-2 px-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{month._id}</span>
                                                        <span className="text-sm font-bold text-white">{formatCurrency(month.sales || 0)}</span>
                                                    </div>
                                                    <div className="h-2 bg-white/[0.02] rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.max(5, (month.sales / Math.max(...stats!.monthlyRevenue.map(m => m.sales))) * 100)}%` }}
                                                            transition={{ duration: 1, ease: "circOut" }}
                                                            className="h-full bg-gold rounded-full relative"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="orders"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="space-y-3"
                                        >
                                            {stats?.recentOrders?.slice(0, 5).map((order, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-all group cursor-pointer"
                                                    onClick={() => router.push('/admin/orders')}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center border border-white/10 group-hover:border-gold/30 transition-all">
                                                            <ShoppingCart className="w-5 h-5 text-slate-500 group-hover:text-gold" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold text-sm tracking-tight capitalize">{order.status} Order</p>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ID: {order._id.slice(-8)} • {order.user?.email || 'Guest'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-white font-bold">{formatCurrency(order.totalAmount)}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">{formatDate(order.createdAt)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Inventory Quick Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#0A1017] border border-white/[0.03] rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:border-gold/30 transition-all" onClick={() => router.push('/admin/products/new')}>
                                <div>
                                    <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-1">Product Inventory</p>
                                    <h4 className="text-xl font-bold text-white tracking-tight">Add New Product</h4>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gold/5 flex items-center justify-center group-hover:bg-gold transition-colors">
                                    <Plus className="w-6 h-6 text-gold group-hover:text-navy" />
                                </div>
                            </div>
                            <div className="bg-[#0A1017] border border-white/[0.03] rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:border-indigo-500/30 transition-all" onClick={() => router.push('/admin/analytics')}>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Analysis & Reports</p>
                                    <h4 className="text-xl font-bold text-white tracking-tight">Go to Analytics</h4>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                    <BarChart3 className="w-6 h-6 text-indigo-500 group-hover:text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Sidebar - Recent Alerts & Status */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#0A1017] border border-white/[0.03] rounded-[2.5rem] p-8 h-full">
                            <div className="flex items-center gap-2 mb-8">
                                <Activity className="w-5 h-5 text-gold" />
                                <h3 className="text-lg font-bold text-white tracking-tight">Store Status</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Network Node */}
                                <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-blue-400" />
                                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Store Status</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse"></div>
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Online</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <div key={i} className={`h-1 flex-1 rounded-full ${i < 7 ? 'bg-gold/40' : 'bg-white/5'}`} />
                                        ))}
                                    </div>
                                </div>

                                {/* Urgent Alert */}
                                <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl group cursor-pointer hover:bg-red-500/10 transition-all" onClick={() => router.push('/admin/orders?status=pending')}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Pending Action</span>
                                        <ShieldAlert className="w-4 h-4 text-red-500/50" />
                                    </div>
                                    <p className="text-2xl font-bold text-white mb-1">
                                        {stats?.recentOrders?.filter(o => o.status === 'pending').length || 0}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium">Orders awaiting processing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
