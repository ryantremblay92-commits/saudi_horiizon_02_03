"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import {
    Search,
    Download,
    Eye,
    Truck,
    X,
    Package,
    CheckCircle,
    XCircle,
    Calendar,
    ChevronRight,
    DollarSign,
    Clock,
    User,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
    _id: string;
    user?: { email: string; name?: string };
    items: Array<{ name: string; quantity: number; price: number; productId?: string }>;
    totalAmount: number;
    status: string;
    shippingAddress?: any;
    createdAt: string;
}

export default function AdminOrdersPage() {
    const { isInitialized } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isInitialized) {
            loadOrders();
        }
    }, [isInitialized]);

    const getHeaders = (): HeadersInit => {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const loadOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch('/api/orders?admin=true', { headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to load orders');
            }
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (err: any) {
            console.error('Failed to load orders:', err);
            toast.error('Failed to load orders');
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to update order status');
            }

            toast.success(`Protocol update: Order marked as ${newStatus}`);
            loadOrders();
            if (viewOrder?._id === orderId) {
                setViewOrder(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update status');
        }
    };

    const exportOrders = () => {
        if (filteredOrders.length === 0) {
            toast.error('Buffer empty: Nothing to export');
            return;
        }

        const headers = ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'];
        const rows = filteredOrders.map(order => [
            order._id,
            order.user?.email || 'Guest',
            order.items?.length || 0,
            order.totalAmount || 0,
            order.status,
            new Date(order.createdAt).toISOString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `shi_orders_manifest_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Manifest exported successfully');
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getNextStatus = (current: string): string | null => {
        const flow: Record<string, string> = {
            'pending': 'shipped',
            'shipped': 'delivered'
        };
        return flow[current] || null;
    };

    return (
        <AdminLayout
            title="Order Management"
            description="Manage and track customer orders"
            onRefresh={loadOrders}
        >
            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {['pending', 'shipped', 'delivered', 'cancelled'].map((status, index) => {
                    const count = orders.filter(o => o.status === status).length;
                    const colors: Record<string, string> = {
                        pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                        shipped: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                        delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                        cancelled: 'text-red-400 bg-red-500/10 border-red-500/20'
                    };
                    const icons: Record<string, any> = {
                        pending: Clock,
                        shipped: Truck,
                        delivered: ShieldCheck,
                        cancelled: XCircle
                    };
                    const Icon = icons[status];

                    return (
                        <motion.div
                            key={status}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                            className={`glass-premium p-6 rounded-[2rem] border transition-all cursor-pointer group hover:scale-[1.02] active:scale-95 ${statusFilter === status ? colors[status] : 'border-white/5 bg-white/[0.02]'}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${statusFilter === status ? 'bg-current/10 border-current/20' : 'bg-white/5 border-white/10'}`}>
                                    <Icon className={`w-6 h-6 ${statusFilter === status ? colors[status].split(' ')[0] : 'text-white/20'}`} />
                                </div>
                                {statusFilter === status && (
                                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                )}
                            </div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{status}</p>
                            <h4 className="text-3xl font-black text-white font-display">{count}</h4>
                        </motion.div>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-gold transition-colors" />
                    <Input
                        placeholder="Search by ID or customer email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-14 bg-white/[0.03] border-white/5 text-white rounded-[1.5rem] h-14 focus:ring-gold/20 focus:border-gold/40 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        className="h-14 px-8 border border-white/5 bg-white/[0.03] text-white/60 hover:text-white rounded-[1.5rem] font-bold uppercase tracking-widest text-[10px]"
                        onClick={exportOrders}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export Orders
                    </Button>
                </div>
            </div>

            {/* Table Container */}
            <div className="glass-premium rounded-[2.5rem] border border-white/5 bg-white/[0.01] overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-32 text-center">
                        <div className="relative w-16 h-16 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-gold/10 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-white/30 font-black uppercase tracking-[0.3em] animate-pulse">Loading orders...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/[0.03] border-b border-white/5">
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Order ID</th>
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Customer</th>
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Items</th>
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Total</th>
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Status</th>
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Order Date</th>
                                    <th className="px-8 py-7 text-right text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-6 bg-gold/40 rounded-full group-hover:bg-gold transition-colors" />
                                                    <span className="text-white font-mono text-sm font-black tracking-tighter group-hover:text-gold transition-colors">
                                                        #{order._id.slice(-8).toUpperCase()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                                                        <User className="w-4 h-4 text-white/20" />
                                                    </div>
                                                    <span className="text-white/60 font-bold text-sm tracking-tight">{order.user?.email || 'Guest Terminal'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <Badge variant="outline" className="bg-white/5 border-white/5 text-white/40 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {order.items?.length || 0} Units
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <span className="text-white font-black font-display text-lg">
                                                    {mounted ? formatCurrency(order.totalAmount || 0) : '---'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                    className="bg-navy/80 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer hover:border-gold/30 transition-all appearance-none text-center min-w-[120px]"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-white/40 text-[11px] font-bold tracking-tight">
                                                        {formatDate(order.createdAt).split('at')[0]}
                                                    </span>
                                                    <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                                                        {formatDate(order.createdAt).split('at')[1]}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-12 h-12 rounded-2xl text-white/20 hover:text-white hover:bg-white/5"
                                                        onClick={() => setViewOrder(order)}
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </Button>
                                                    {getNextStatus(order.status) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-12 h-12 rounded-2xl text-white/20 hover:text-blue-400 hover:bg-blue-500/10"
                                                            onClick={() => updateOrderStatus(order._id, getNextStatus(order.status)!)}
                                                        >
                                                            <Truck className="h-5 w-5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <div className="max-w-xs mx-auto">
                                                <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-6">
                                                    <Package className="w-10 h-10 text-white/10" />
                                                </div>
                                                <h5 className="text-white font-black font-display uppercase tracking-widest mb-2">No orders found</h5>
                                                <p className="text-white/30 text-xs font-bold leading-relaxed">Try adjusting your search or filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {viewOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-navy/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                        onClick={() => setViewOrder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-gray-900 border border-white/10 rounded-[3rem] max-w-2xl w-full p-10 max-h-[90vh] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.5)] custom-scrollbar"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-white font-display uppercase tracking-tight">Order Details</h3>
                                    <p className="text-gold text-xs font-black uppercase tracking-[0.3em] mt-2">Order #{viewOrder._id.slice(-8).toUpperCase()}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setViewOrder(null)} className="w-14 h-14 rounded-3xl bg-white/5 text-white/40 hover:text-white">
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Order Status</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                                            <Clock className="w-6 h-6 text-gold" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black uppercase tracking-widest text-sm">{viewOrder.status}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Order Total</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                            <DollarSign className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black font-display text-2xl">{formatCurrency(viewOrder.totalAmount || 0)}</p>
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Total Amount Paid</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-10">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 pl-2">Order Items</p>
                                <div className="space-y-3">
                                    {viewOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center border border-white/5">
                                                    <Package className="w-5 h-5 text-white/10 group-hover:text-gold transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm tracking-tight">{item.name || 'Product'}</p>
                                                    <p className="text-[10px] text-white/30 font-black tracking-widest">QTY: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="text-white font-black font-display">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Logistics Address */}
                            <div className="mb-10">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 pl-2">Shipping Address</p>
                                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                            <Truck className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <p className="text-white font-bold text-sm leading-relaxed tracking-tight">
                                            {typeof viewOrder.shippingAddress === 'string'
                                                ? viewOrder.shippingAddress
                                                : JSON.stringify(viewOrder.shippingAddress, null, 2)
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Protocol Actions */}
                            {viewOrder.status !== 'delivered' && viewOrder.status !== 'cancelled' && (
                                <div className="grid grid-cols-2 gap-4">
                                    {getNextStatus(viewOrder.status) && (
                                        <Button
                                            className="h-16 bg-gold hover:bg-white text-navy font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-gold/20 flex items-center justify-center gap-3"
                                            onClick={() => updateOrderStatus(viewOrder._id, getNextStatus(viewOrder.status)!)}
                                        >
                                            <Truck className="w-5 h-5" />
                                            Mark as {getNextStatus(viewOrder.status)}
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="h-16 border-white/5 bg-white/5 text-white/40 font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center gap-3"
                                        onClick={() => updateOrderStatus(viewOrder._id, 'cancelled')}
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Cancel Order
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
