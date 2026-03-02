"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
    Bell,
    Search,
    ShoppingCart,
    Users,
    Box,
    FileText,
    Check,
    CheckCheck,
    Clock,
    Filter,
    ArrowRight,
    Loader2,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/notifications?limit=100${filter !== 'all' ? `&unreadOnly=${filter === 'unread'}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            toast.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/admin/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/admin/notifications/read-all', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast.success("All notifications marked as read");
            }
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const navigateToDetail = (notif: any) => {
        if (!notif.isRead) markAsRead(notif._id);

        switch (notif.type) {
            case 'order': router.push('/admin/orders'); break;
            case 'user': router.push('/admin/users'); break;
            case 'inventory': router.push('/admin/inventory'); break;
            case 'quote': router.push('/admin/quotes'); break;
            default: break;
        }
    };

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingCart className="w-5 h-5 text-emerald-500" />;
            case 'user': return <Users className="w-5 h-5 text-blue-500" />;
            case 'inventory': return <Box className="w-5 h-5 text-amber-500" />;
            case 'quote': return <FileText className="w-5 h-5 text-gold" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <AdminLayout
            title="Notification Center"
            description="View and manage all system activity and alerts"
            onRefresh={fetchNotifications}
        >
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Filter activity history..."
                            className="pl-11 bg-white/[0.03] border-white/5 text-white h-12 rounded-2xl focus:ring-gold/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-2xl border border-white/5">
                            {['all', 'unread'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-gold text-navy' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            onClick={markAllAsRead}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-gold"
                        >
                            <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
                        </Button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl min-h-[500px]">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div className="h-[500px] flex flex-col items-center justify-center gap-4 opacity-30">
                                <Loader2 className="w-10 h-10 animate-spin text-gold" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Activity...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="h-[500px] flex flex-col items-center justify-center gap-4 opacity-20">
                                <Bell className="w-16 h-16" />
                                <p className="text-sm font-bold tracking-tight">Your activity history is empty</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/[0.03]">
                                {filteredNotifications.map((notif, idx) => (
                                    <motion.div
                                        key={notif._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => navigateToDetail(notif)}
                                        className={`group relative p-8 flex items-start gap-6 hover:bg-white/[0.02] transition-all cursor-pointer ${!notif.isRead ? 'bg-gold/[0.02]' : ''}`}
                                    >
                                        {!notif.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" />
                                        )}

                                        <div className={`p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:scale-110 transition-transform`}>
                                            {getIcon(notif.type)}
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`text-sm font-bold tracking-tight transition-colors ${!notif.isRead ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                    {notif.title}
                                                </h3>
                                                <span className="text-[10px] font-medium text-slate-600 flex items-center gap-2">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                            <p className={`text-sm leading-relaxed ${!notif.isRead ? 'text-slate-300' : 'text-slate-500'}`}>
                                                {notif.message}
                                            </p>

                                            <div className="pt-2 flex items-center gap-4">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase border-white/5 text-slate-600 px-2">
                                                    ID: #{notif._id.slice(-6)}
                                                </Badge>
                                                {!notif.isRead && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                                                        className="text-[9px] font-black uppercase text-gold hover:text-white transition-colors flex items-center gap-1"
                                                    >
                                                        <Check className="w-3 h-3" /> Dismiss
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-red-400">
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )
                        }
                    </AnimatePresence>
                </div>
            </div>
        </AdminLayout>
    );
}
