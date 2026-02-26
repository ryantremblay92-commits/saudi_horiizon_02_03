"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    ShoppingCart,
    Package,
    Loader2,
    RefreshCw,
    AlertTriangle,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    ChevronDown,
    Filter,
    Box,
    Globe,
    Zap,
    MousePointer2,
    PieChart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface SalesData {
    period: string;
    summary: {
        totalRevenue: number;
        totalOrders: number;
        avgOrderValue: number;
    };
    salesTrend: Array<{ _id: string; sales: number; orders: number }>;
    topProducts: Array<{ _id: string; name: string; quantity: number; revenue: number }>;
    categoryBreakdown: Array<{ _id: string; revenue: number; orders: number }>;
}

interface UserData {
    totalUsers: number;
    newUsers30Days: number;
    activeUsers30Days: number;
    growthRate: string;
    usersByRole: Array<{ _id: string; count: number }>;
}

interface InventoryData {
    summary: {
        totalValue: number;
        totalProducts: number;
        totalStock: number;
        avgPrice: number;
    };
    outOfStockCount: number;
    lowStockProducts: Array<{ _id: string; name: string; stock: number; sku?: string }>;
    categoryDistribution: Array<{ _id: string; count: number; totalStock: number }>;
}

export default function AdminAnalyticsPage() {
    const router = useRouter();
    const { isInitialized } = useAuth();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30days');
    const [mounted, setMounted] = useState(false);
    const [salesData, setSalesData] = useState<SalesData | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
    const [activeSection, setActiveSection] = useState<'financial' | 'demographics' | 'logistics'>('financial');

    useEffect(() => {
        setMounted(true);
    }, []);

    const getHeaders = (): HeadersInit => {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    useEffect(() => {
        if (isInitialized) {
            loadAnalytics();
        }
    }, [period, isInitialized]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const headers = getHeaders();

            const [salesRes, usersRes, inventoryRes] = await Promise.allSettled([
                fetch(`/api/admin/analytics/sales?period=${period}`, { headers }),
                fetch('/api/admin/analytics/users', { headers }),
                fetch('/api/admin/analytics/inventory', { headers })
            ]);

            if (salesRes.status === 'fulfilled' && salesRes.value.ok) {
                setSalesData(await salesRes.value.json());
            }
            if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
                setUserData(await usersRes.value.json());
            }
            if (inventoryRes.status === 'fulfilled' && inventoryRes.value.ok) {
                setInventoryData(await inventoryRes.value.json());
            }
        } catch (err) {
            console.error('Failed to load analytics:', err);
            toast.error('Sync failure: Analytics intelligence backend unreachable');
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

    const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

    const BarChartSVG = ({ data, maxVal, color = "#C5A059" }: { data: Array<{ label: string; value: number }>; maxVal: number; color?: string }) => {
        if (!data || data.length === 0) return (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl">
                <BarChart3 className="w-8 h-8 text-white/5 mb-2" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Insufficient Data Points</p>
            </div>
        );

        const height = 160;
        const padding = 20;
        const barGap = 12;
        const barWidth = 32;
        const width = data.length * (barWidth + barGap) + padding * 2;

        return (
            <div className="overflow-x-auto pb-4 scrollbar-hide">
                <svg width={width} height={height + 40} className="overflow-visible">
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="1" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
                        </linearGradient>
                        <filter id="barGlow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    {data.map((d, i) => {
                        const h = maxVal > 0 ? (d.value / maxVal) * height : 0;
                        const x = padding + i * (barWidth + barGap);
                        const y = height - h + 10;

                        return (
                            <g key={i} className="group cursor-help">
                                <motion.rect
                                    initial={{ height: 0, y: height + 10 }}
                                    animate={{ height: h, y: y }}
                                    transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                                    x={x}
                                    width={barWidth}
                                    fill="url(#barGradient)"
                                    rx="6"
                                    filter="url(#barGlow)"
                                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                                />
                                <text
                                    x={x + barWidth / 2}
                                    y={height + 30}
                                    textAnchor="middle"
                                    className="text-[8px] font-black fill-white/20 uppercase tracking-tighter"
                                >
                                    {d.label.split('-').pop()}
                                </text>
                                <title>{d.label}: {d.value}</title>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    return (
        <AdminLayout
            title="Intelligence Briefing"
            description="Deep-spectrum operational analysis and resource projections"
            onRefresh={loadAnalytics}
        >
            <div className="relative z-10">
                {/* Protocol Selection & Timeline */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
                    <div className="flex bg-white/[0.03] p-1.5 rounded-[1.5rem] border border-white/5 backdrop-blur-md">
                        {[
                            { id: 'financial', label: 'Financial Core', icon: DollarSign },
                            { id: 'demographics', label: 'Network Reach', icon: Users },
                            { id: 'logistics', label: 'Supply Chain', icon: Package }
                        ].map((sec) => (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id as any)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === sec.id
                                    ? 'bg-gold text-navy shadow-xl shadow-gold/20'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <sec.icon className="w-4 h-4" />
                                {sec.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 bg-white/[0.03] p-1.5 rounded-[1.5rem] border border-white/5">
                        {['7days', '30days', '90days', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${period === p
                                    ? 'bg-white text-navy font-black shadow-lg'
                                    : 'text-white/30 hover:text-white'
                                    }`}
                            >
                                {p === '7days' ? 'W1' : p === '30days' ? 'M1' : p === '90days' ? 'Q1' : 'Y1'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-[3rem]">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 border-4 border-gold/10 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                            <PieChart className="absolute inset-0 m-auto w-8 h-8 text-gold animate-pulse" />
                        </div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-display">Decrypting Intelligence Streams...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                    >
                        {/* Dynamic KPI Layer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {activeSection === 'financial' && (
                                <>
                                    <StatBox
                                        label="Total Inflow"
                                        value={mounted ? formatCurrency(salesData?.summary.totalRevenue || 0) : '---'}
                                        sub={`Across ${salesData?.summary.totalOrders} units`}
                                        icon={TrendingUp}
                                        trend="+18.4%"
                                        color="text-emerald-400"
                                    />
                                    <StatBox
                                        label="Average Yield"
                                        value={mounted ? formatCurrency(salesData?.summary.avgOrderValue || 0) : '---'}
                                        sub="Per contract execution"
                                        icon={Activity}
                                        trend="+4.2%"
                                        color="text-gold"
                                    />
                                    <StatBox
                                        label="Market Velocity"
                                        value={(salesData?.summary.totalOrders || 0) / (period === '7days' ? 7 : period === '30days' ? 30 : 90)}
                                        sub="Daily transaction density"
                                        icon={Zap}
                                        trend="+12%"
                                        color="text-blue-400"
                                        isNumber
                                    />
                                    <StatBox
                                        label="Node Engagement"
                                        value="94.2%"
                                        sub="Network utilization rate"
                                        icon={Globe}
                                        trend="+0.8%"
                                        color="text-purple-400"
                                    />
                                </>
                            )}
                            {activeSection === 'demographics' && (
                                <>
                                    <StatBox
                                        label="Network Population"
                                        value={formatNumber(userData?.totalUsers || 0)}
                                        sub="Registered personnel"
                                        icon={Users}
                                        trend={userData?.growthRate + "%"}
                                        color="text-blue-400"
                                        isNumber
                                    />
                                    <StatBox
                                        label="New Authentication"
                                        value={formatNumber(userData?.newUsers30Days || 0)}
                                        sub="Last 30-cycle onboarding"
                                        icon={Zap}
                                        trend="+22%"
                                        color="text-emerald-400"
                                        isNumber
                                    />
                                    <StatBox
                                        label="Active Frequency"
                                        value={formatNumber(userData?.activeUsers30Days || 0)}
                                        sub="Signal activity (30d)"
                                        icon={Activity}
                                        trend="+11%"
                                        color="text-gold"
                                        isNumber
                                    />
                                    <StatBox
                                        label="Retention Vector"
                                        value="88.4%"
                                        sub="LTV Projection"
                                        icon={TrendingUp}
                                        trend="+1.2%"
                                        color="text-purple-400"
                                    />
                                </>
                            )}
                            {activeSection === 'logistics' && (
                                <>
                                    <StatBox
                                        label="Asset Valuation"
                                        value={mounted ? formatCurrency(inventoryData?.summary.totalValue || 0) : '---'}
                                        sub="Capital inventory pool"
                                        icon={Package}
                                        trend="+2.4%"
                                        color="text-purple-400"
                                    />
                                    <StatBox
                                        label="Inventory Mass"
                                        value={mounted ? formatNumber(inventoryData?.summary.totalStock || 0) : '---'}
                                        sub={`Across ${inventoryData?.summary.totalProducts} lines`}
                                        icon={Box}
                                        trend="-0.5%"
                                        color="text-blue-400"
                                        isNumber
                                    />
                                    <StatBox
                                        label="Critical Alerts"
                                        value={formatNumber(inventoryData?.outOfStockCount || 0)}
                                        sub="Total depleted assets"
                                        icon={AlertTriangle}
                                        trend="+2 units"
                                        color="text-red-500"
                                        isNumber
                                    />
                                    <StatBox
                                        label="Category Spread"
                                        value={inventoryData?.categoryDistribution.length || 0}
                                        sub="Departmental segments"
                                        icon={PieChart}
                                        trend="Stable"
                                        color="text-gold"
                                        isNumber
                                    />
                                </>
                            )}
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Trend Visualization */}
                            <div className="glass-premium rounded-[3rem] border border-white/5 p-10 flex flex-col">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight">Spectrum Trend</h3>
                                        <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-1">Live Waveform Analysis</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <BarChart3 className="w-6 h-6 text-gold" />
                                    </div>
                                </div>
                                <div className="flex-1 min-h-[250px] flex items-end justify-center">
                                    <BarChartSVG
                                        data={salesData?.salesTrend.map(d => ({ label: d._id, value: d.sales })) || []}
                                        maxVal={Math.max(...(salesData?.salesTrend.map(d => d.sales) || [0]))}
                                        color={activeSection === 'financial' ? '#C5A059' : activeSection === 'demographics' ? '#60A5FA' : '#C084FC'}
                                    />
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                    <span>T-0 Source Signal</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Sync Active</span>
                                    </div>
                                    <span>Verified Audit</span>
                                </div>
                            </div>

                            {/* Ranking Matrix */}
                            <div className="glass-premium rounded-[3rem] border border-white/5 p-10">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight">Performance Matrix</h3>
                                        <p className="text-gold text-[10px] font-black uppercase tracking-[0.3em] mt-1">Leaderboard Data</p>
                                    </div>
                                    <div className="flex bg-white/5 p-1 rounded-xl">
                                        <button className="px-4 py-2 rounded-lg text-[9px] font-black text-white uppercase tracking-widest bg-navy border border-white/10">Yield</button>
                                        <button className="px-4 py-2 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">Volume</button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {(salesData?.topProducts || []).slice(0, 5).map((product, idx) => (
                                        <div key={idx} className="group flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-gold/30 transition-all cursor-default">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center border border-white/10 group-hover:border-gold/30 transition-all">
                                                    <span className="text-xs font-black text-gold font-display">{idx + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="text-white font-black text-sm tracking-tighter uppercase font-display group-hover:text-gold transition-colors">{product.name || 'Unknown Asset'}</p>
                                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{product.quantity} Units Allocated</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-black font-display">{formatCurrency(product.revenue)}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">+12%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!salesData?.topProducts || salesData.topProducts.length === 0) && (
                                        <div className="py-20 text-center text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                            Matrix Empty: Insufficient Stream Flow
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Distribution Layer */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Departmental Yield */}
                            <div className="glass-premium rounded-[3rem] border border-white/5 p-8">
                                <h3 className="text-lg font-black text-white font-display uppercase tracking-tight mb-8">Departmental Yield</h3>
                                <div className="space-y-6">
                                    {(salesData?.categoryBreakdown || []).map((cat, i) => {
                                        const maxRev = salesData?.categoryBreakdown[0]?.revenue || 1;
                                        return (
                                            <div key={i} className="group">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{cat._id || 'Standard'}</span>
                                                    <span className="text-xs font-black text-white font-display">{formatCurrency(cat.revenue)}</span>
                                                </div>
                                                <div className="h-2.5 bg-white/5 rounded-full border border-white/5 p-0.5 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(cat.revenue / maxRev) * 100}%` }}
                                                        transition={{ duration: 1.5, delay: i * 0.1 }}
                                                        className="h-full bg-gradient-to-r from-gold/40 to-gold rounded-full shadow-[0_0_15px_rgba(255,215,0,0.2)]"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Personnel Access */}
                            <div className="glass-premium rounded-[3rem] border border-white/5 p-8">
                                <h3 className="text-lg font-black text-white font-display uppercase tracking-tight mb-8">Access Demographics</h3>
                                <div className="grid grid-cols-2 gap-4 h-[240px]">
                                    {[
                                        { label: 'Total Syncs', val: userData?.totalUsers, color: 'text-white' },
                                        { label: 'Active Link', val: userData?.activeUsers30Days, color: 'text-blue-400' },
                                        { label: 'New Signal', val: userData?.newUsers30Days, color: 'text-emerald-400' },
                                        { label: 'Velocity', val: userData?.growthRate + '%', color: 'text-gold' }
                                    ].map((box, i) => (
                                        <div key={i} className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-5 flex flex-col justify-center items-center hover:bg-white/[0.06] transition-all group">
                                            <span className={`text-2xl font-black font-display font-mono ${box.color} group-hover:scale-110 transition-transform`}>{box.val ?? '---'}</span>
                                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">{box.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Logistics Integrity */}
                            <div className="glass-premium rounded-[3rem] border border-white/5 p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-black text-white font-display uppercase tracking-tight">Supply Integrity</h3>
                                    <StatusBadge status={inventoryData?.outOfStockCount === 0 ? 'active' : 'pending'} />
                                </div>
                                <div className="space-y-4">
                                    {inventoryData?.lowStockProducts.slice(0, 4).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500 transition-all">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <span className="text-[11px] font-black text-white/60 uppercase tracking-tighter truncate max-w-[120px]">{item.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black text-white font-mono">{item.stock}</span>
                                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Units</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!inventoryData?.lowStockProducts || inventoryData.lowStockProducts.length === 0) && (
                                        <div className="py-12 text-center text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                            All Asset Channels Secure
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </AdminLayout>
    );
}

function StatBox({ label, value, sub, icon: Icon, trend, color, isNumber = false }: any) {
    return (
        <div className="glass-premium p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors" />
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-gold/30 transition-all">
                        <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div className="flex flex-col items-end">
                        <div className={`flex items-center gap-1 text-[10px] font-black ${trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {trend}
                        </div>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">VS PREV</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{label}</p>
                    <h3 className={`font-black text-white font-display tracking-tight group-hover:text-gold transition-colors ${isNumber ? 'text-3xl' : 'text-2xl'}`}>{value}</h3>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] mt-2 italic">{sub}</p>
                </div>
            </div>
        </div>
    );
}
