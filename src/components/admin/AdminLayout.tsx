"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Settings,
    Menu,
    X,
    Bell,
    Search,
    Download,
    RefreshCw,
    Truck,
    LogOut,
    User,
    BarChart3,
    Box,
    Cookie,
    Image,
    FileText,
    Activity,
    ShieldAlert,
    Globe,
    Zap,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    onRefresh?: () => void;
    onExport?: () => void;
    actions?: React.ReactNode;
}

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Cookie Consent', href: '/admin/cookie-consent', icon: Cookie },
    { name: 'Banners', href: '/admin/banners', icon: Image },
    { name: 'News', href: '/admin/news', icon: FileText },
    { name: 'Inventory', href: '/admin/inventory', icon: Box },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Shipping', href: '/admin/shipping', icon: Truck },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children, title, description, onRefresh, onExport, actions }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [clockTime, setClockTime] = useState('');

    useEffect(() => {
        const tick = () => setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    // Update current navigation based on pathname
    const currentNav = navigation.map(item => ({
        ...item,
        current: item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href))
    }));

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-[#060B12] text-slate-200 overflow-hidden font-sans selection:bg-gold/30 selection:text-gold">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </div>
            )}

            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-72 flex-col bg-[#0A1017] border-r border-white-[0.05] flex-shrink-0 z-20 relative shadow-2xl">
                <div className="flex flex-col h-full relative z-10">
                    {/* Brand Section */}
                    <div className="flex items-center h-20 px-8 border-b border-white/[0.03] flex-shrink-0">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-gold/10">
                                <LayoutDashboard className="w-6 h-6 text-navy" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-base font-bold text-white tracking-tight">Admin System</span>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] leading-tight">Saudi Horizon</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-1.5">
                        <div className="px-4 mb-3">
                            <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Administration</span>
                        </div>
                        {currentNav.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 group relative ${item.current
                                    ? 'bg-gold/5 text-gold border border-gold/10'
                                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'
                                    }`}
                            >
                                <item.icon className={`mr-4 h-5 w-5 flex-shrink-0 transition-colors ${item.current ? 'text-gold' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                <span className="truncate tracking-tight">{item.name}</span>
                                {item.current && (
                                    <motion.div
                                        layoutId="sidebar-indicator"
                                        className="absolute left-0 w-1 h-5 bg-gold rounded-full shadow-[0_0_15px_rgba(197,160,89,0.5)]"
                                    />
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile Section */}
                    <div className="p-6 border-t border-white/[0.03] bg-black/10">
                        <div className="flex items-center space-x-3 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                            <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-gold/5">
                                <AvatarFallback className="bg-navy text-gold font-bold">
                                    {user?.email?.[0].toUpperCase() || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{user?.email || 'admin@saudihorizon.com'}</p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Admin Access</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-colors h-8 w-8"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-[#060B12]/80 backdrop-blur-xl border-b border-white/[0.03]">
                    <div className="flex h-20 items-center justify-between px-8">
                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden mr-4 text-slate-300 hover:text-white"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                                    {title || 'Dashboard Overview'}
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-black uppercase py-0 px-1.5 h-4">Active</Badge>
                                </h1>
                                {description && (
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            {/* Actions Group */}
                            <div className="flex items-center bg-white/[0.02] border border-white/[0.05] p-1 rounded-2xl gap-1">
                                {onExport && (
                                    <Button variant="ghost" size="sm" onClick={onExport} className="h-9 px-4 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                        <Download className="h-3.5 w-3.5 mr-2" />
                                        Export
                                    </Button>
                                )}

                                {onRefresh && (
                                    <Button variant="ghost" size="sm" onClick={onRefresh} className="h-9 px-4 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        Refresh
                                    </Button>
                                )}

                                {actions}
                            </div>

                            {/* Notifications & Status */}
                            <div className="flex items-center gap-6 border-l border-white/[0.05] pl-6">
                                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white transition-colors">
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-[10px] font-black text-white flex items-center justify-center rounded-full border-2 border-[#060B12]">
                                        3
                                    </span>
                                </Button>

                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-[9px] text-slate-600 uppercase tracking-[0.3em] font-black">System Status</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse"></div>
                                        <span className="text-[10px] text-white/40 font-mono font-bold">{clockTime}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-navy relative w-full">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />
                    <div className="py-8 relative z-10">
                        <div className="px-8 w-full">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div >
    );
}
