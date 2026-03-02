"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Filter,
    Plus,
    Eye,
    Shield,
    Mail,
    Calendar,
    X,
    Trash2,
    Activity,
    Users,
    Key,
    ShieldAlert,
    ShieldCheck,
    UserCheck,
    UserX,
    ChevronRight,
    Lock,
    Unlock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    _id: string;
    email: string;
    name?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt?: string;
}

export default function AdminUsersPage() {
    const { isInitialized } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [submitting, setSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isInitialized) {
            loadUsers();
        }
    }, [isInitialized]);

    const getHeaders = (): HeadersInit => {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch('/api/users', { headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to load users');
            }
            const data = await response.json();
            setUsers(data.users || []);
        } catch (err: any) {
            console.error('Failed to load users:', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to update user role');
            }

            toast.success(`Role updated to ${newRole}`);
            loadUsers();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update role');
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to update user status');
            }

            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
            loadUsers();
        } catch (err: any) {
            toast.error(err.message || 'Failed to toggle account status');
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete user');
            }

            toast.success('User deleted successfully');
            if (viewUser?._id === userId) setViewUser(null);
            loadUsers();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete user');
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addForm.name || !addForm.email || !addForm.password) {
            toast.error('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(addForm)
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to create user');
            }

            toast.success('User added successfully');
            setShowAddModal(false);
            setAddForm({ name: '', email: '', password: '', role: 'user' });
            loadUsers();
        } catch (err: any) {
            toast.error(err.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <AdminLayout
            title="User Management"
            description="Manage user accounts and permissions"
            onRefresh={loadUsers}
        >
            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Users', value: mounted ? users.length : '---', icon: Users, color: 'text-white' },
                    { label: 'Admins', value: mounted ? users.filter(u => u.role === 'admin').length : '---', icon: ShieldCheck, color: 'text-gold' },
                    { label: 'Active Users', value: mounted ? users.filter(u => u.isActive).length : '---', icon: Activity, color: 'text-emerald-400' },
                    { label: 'Inactive Users', value: mounted ? users.filter(u => !u.isActive).length : '---', icon: Lock, color: 'text-red-400' }
                ].map((kpi, index) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-premium p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] flex items-center gap-5"
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5`}>
                            <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                            <h4 className="text-3xl font-black text-white font-display leading-none">{kpi.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-gold transition-colors" />
                    <Input
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-14 bg-white/[0.03] border-white/5 text-white rounded-[1.5rem] h-14 focus:ring-gold/20 focus:border-gold/40 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Button
                            variant="ghost"
                            className={`h-14 px-8 border border-white/5 bg-white/[0.03] rounded-[1.5rem] font-bold uppercase tracking-widest text-[10px] ${roleFilter !== 'all' ? 'text-gold' : 'text-white/60'}`}
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Role: {roleFilter === 'all' ? 'All Roles' : roleFilter}
                        </Button>
                        <AnimatePresence>
                            {showFilterDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full mt-3 right-0 z-50 bg-navy/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[200px] p-2"
                                >
                                    {['all', 'admin', 'manager', 'user', 'customer'].map(role => (
                                        <button
                                            key={role}
                                            onClick={() => { setRoleFilter(role); setShowFilterDropdown(false); }}
                                            className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === role ? 'bg-gold text-navy' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            {role === 'all' ? 'All Roles' : role}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <Button
                        className="h-14 px-8 bg-gold hover:bg-white text-navy rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-gold/20 transition-all active:scale-95"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus className="h-4 w-4 mr-2 stroke-[3]" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-premium rounded-[2.5rem] border border-white/5 bg-white/[0.01] overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-32 text-center">
                        <div className="relative w-16 h-16 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-gold/10 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-white/30 font-black uppercase tracking-[0.3em]">Loading users...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/[0.03] border-b border-white/5">
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">User</th>
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Role</th>
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Status</th>
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Joined Date</th>
                                    <th className="px-8 py-7 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Last Login</th>
                                    <th className="px-8 py-7 text-right text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-gold/50 transition-all">
                                                        <span className="text-white font-black font-display text-lg relative z-10">
                                                            {user.email.charAt(0).toUpperCase()}
                                                        </span>
                                                        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-black text-sm tracking-tight group-hover:text-gold transition-colors font-display uppercase">
                                                            {user.name || 'Anonymous User'}
                                                        </p>
                                                        <p className="text-white/30 text-[11px] font-bold">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => updateUserRole(user._id, e.target.value)}
                                                    className="bg-navy/80 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer hover:border-gold/30 transition-all appearance-none text-center min-w-[120px]"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="customer">Customer</option>
                                                </select>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <Badge className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${user.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <div className="flex items-center text-white/40 gap-2">
                                                    <Calendar className="h-4 w-4 text-white/10" />
                                                    <span className="text-xs font-bold tracking-tight">{formatDate(user.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap">
                                                <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">
                                                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-7 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-11 h-11 rounded-2xl text-white/20 hover:text-white hover:bg-white/5"
                                                        title="View Details"
                                                        onClick={() => setViewUser(user)}
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`w-11 h-11 rounded-2xl transition-all ${user.isActive ? 'text-white/20 hover:text-red-400 hover:bg-red-500/10' : 'text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                                                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                                                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                                                    >
                                                        {user.isActive ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-11 h-11 rounded-2xl text-white/20 hover:text-red-500 hover:bg-red-500/20 transition-all"
                                                        title="Delete User"
                                                        onClick={() => deleteUser(user._id)}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="max-w-xs mx-auto">
                                                <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto mb-6">
                                                    <ShieldAlert className="w-10 h-10 text-white/10" />
                                                </div>
                                                <h5 className="text-white font-black font-display uppercase tracking-widest mb-2">No users found</h5>
                                                <p className="text-white/30 text-xs font-bold leading-relaxed">No users matching your current search or filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Personnel Manifest Modal */}
            <AnimatePresence>
                {viewUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-navy/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                        onClick={() => setViewUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-gray-900 border border-white/10 rounded-[3rem] max-w-lg w-full p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-white font-display uppercase tracking-tight">User Details</h3>
                                    <p className="text-gold text-xs font-black uppercase tracking-[0.3em] mt-2">User Information</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setViewUser(null)} className="w-14 h-14 rounded-3xl bg-white/5 text-white/40 hover:text-white">
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>

                            <div className="flex flex-col items-center mb-10">
                                <div className="h-32 w-32 rounded-[3.5rem] bg-white/[0.02] border-2 border-gold/30 flex items-center justify-center mb-6 shadow-2xl shadow-gold/10">
                                    <span className="text-gold text-5xl font-black font-display">{viewUser.email.charAt(0).toUpperCase()}</span>
                                </div>
                                <h4 className="text-2xl font-black text-white font-display uppercase tracking-tight">{viewUser.name || 'Anonymous User'}</h4>
                                <p className="text-gold text-xs font-black uppercase tracking-[0.2em] mt-1">{viewUser.email}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">User Role</p>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-gold" />
                                        <span className="text-white text-xs font-black uppercase tracking-widest">{viewUser.role}</span>
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Status</p>
                                    <Badge className={`px-3 py-1 text-[8px] font-black uppercase tracking-tighter ${viewUser.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                        {viewUser.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Joined Date</p>
                                    <span className="text-white text-[11px] font-bold">{formatDate(viewUser.createdAt)}</span>
                                </div>
                                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Last Login</p>
                                    <span className="text-white text-[11px] font-bold">{viewUser.lastLoginAt ? formatDate(viewUser.lastLoginAt) : 'Never'}</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">User ID:</span>
                                <code className="text-gold text-[10px] font-mono font-black">{viewUser._id}</code>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Personnel Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-navy/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-gray-900 border border-white/10 rounded-[3rem] max-w-md w-full p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-white font-display uppercase tracking-tight">Add New User</h3>
                                    <p className="text-gold text-xs font-black uppercase tracking-[0.3em] mt-2">Create a new user account</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="w-14 h-14 rounded-3xl bg-white/5 text-white/40 hover:text-white">
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>

                            <form onSubmit={handleAddUser} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Full Name</Label>
                                    <Input
                                        value={addForm.name}
                                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                        className="bg-white/[0.03] border-white/5 text-white h-14 rounded-2xl focus:ring-gold/20 font-bold"
                                        placeholder="Full Operator Name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Email Address</Label>
                                    <Input
                                        type="email"
                                        value={addForm.email}
                                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                                        className="bg-white/[0.03] border-white/5 text-white h-14 rounded-2xl focus:ring-gold/20 font-bold"
                                        placeholder="operator@saudihorizon.com"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Password</Label>
                                    <Input
                                        type="password"
                                        value={addForm.password}
                                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                        className="bg-white/[0.03] border-white/5 text-white h-14 rounded-2xl focus:ring-gold/20 font-bold"
                                        placeholder="Minimum 8 Characters"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Assign Role</Label>
                                    <select
                                        value={addForm.role}
                                        onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                                        className="w-full bg-white/[0.03] border border-white/5 text-white h-14 rounded-2xl px-5 focus:outline-none focus:ring-2 focus:ring-gold/20 font-black uppercase tracking-widest text-xs appearance-none"
                                    >
                                        <option value="user">USER</option>
                                        <option value="manager">MANAGER</option>
                                        <option value="admin">ADMIN</option>
                                        <option value="customer">CUSTOMER</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting} className="flex-[2] h-14 bg-gold hover:bg-white text-navy font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-2xl shadow-gold/10">
                                        {submitting ? 'Creating...' : 'Create User'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
