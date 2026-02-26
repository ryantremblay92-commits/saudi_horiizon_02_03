"use client";

import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Filter,
    Download,
    Eye,
    X,
    Upload,
    Image as ImageIcon,
    Box,
    Tag,
    DollarSign,
    Package,
    Layers,
    Save,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
    _id: string;
    name: string;
    sku: string;
    brand: string;
    category: string;
    subcategory?: string;
    price: number;
    image?: string;
    description?: string;
    stock: number;
    inStock: boolean;
    isActive: boolean; // Added for UI sync, mapping to inStock if needed
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 10;

    // Product form state
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        sku: '',
        brand: '',
        category: '',
        subcategory: '',
        price: 0,
        stock: 0,
        description: '',
        image: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch('/api/products?limit=1000', { headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to load products');
            }
            const data = await response.json();
            setProducts(data.products || []);
        } catch (err: any) {
            console.error('Failed to load products:', err);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('accessToken');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            toast.success('Product deleted successfully');
            loadProducts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete product');
        }
    };

    const openAddForm = () => {
        setEditingProduct(null);
        setFormData({
            _id: `PROD-${Date.now()}`,
            name: '',
            sku: '',
            brand: '',
            category: '',
            subcategory: '',
            price: 0,
            stock: 0,
            description: '',
            image: '',
        });
        setShowProductForm(true);
    };

    const openEditForm = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            _id: product._id,
            name: product.name || '',
            sku: product.sku || '',
            brand: product.brand || '',
            category: product.category || '',
            subcategory: product.subcategory || '',
            price: product.price || 0,
            stock: product.stock || 0,
            description: product.description || '',
            image: product.image || '',
        });
        setShowProductForm(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a preview URL
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, image: previewUrl }));

        // Upload to server
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, image: data.url || previewUrl }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error('Server upload failed, using preview URL');
            }
        } catch (err) {
            toast.error('Upload error, using local preview');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const url = editingProduct
                ? `/api/products/${editingProduct._id}`
                : '/api/products';
            const method = editingProduct ? 'PUT' : 'POST';

            // Clean data for API
            const submissionData = {
                ...formData,
                inStock: formData.stock > 0
            };

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save product');
            }

            toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
            setShowProductForm(false);
            loadProducts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * productsPerPage,
        currentPage * productsPerPage
    );

    return (
        <AdminLayout
            title="Products"
            description="Manage your global industrial catalog"
            onRefresh={loadProducts}
            onExport={() => {
                const headers = ['ID', 'Name', 'SKU', 'Brand', 'Category', 'Price', 'Stock'];
                const rows = filteredProducts.map(p => [
                    p._id, p.name, p.sku, p.brand, p.category, p.price, p.stock
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success('Export completed');
            }}
        >
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass rounded-3xl p-6 border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                            <Box className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Total Products</p>
                            <h4 className="text-2xl font-black text-white font-display">{products.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-3xl p-6 border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Package className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">In Stock</p>
                            <h4 className="text-2xl font-black text-white font-display">
                                {products.filter(p => p.stock > 0).length}
                            </h4>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-3xl p-6 border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Low Stock</p>
                            <h4 className="text-2xl font-black text-white font-display">
                                {products.filter(p => p.stock > 0 && p.stock < 10).length}
                            </h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-gold transition-colors" />
                    <Input
                        placeholder="Search by name, SKU or brand..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 bg-white/[0.03] border-white/5 text-white rounded-2xl h-14 focus:ring-gold/20 focus:border-gold/40 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-14 px-6 border-white/5 bg-white/[0.03] text-white/60 hover:text-white rounded-2xl font-bold uppercase tracking-widest text-xs">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button className="h-14 px-8 bg-gold hover:bg-white text-navy font-black rounded-2xl transition-all shadow-xl shadow-gold/10" onClick={openAddForm}>
                        <Plus className="h-5 w-5 mr-2" />
                        ADD PRODUCT
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-[2rem] border border-white/5 bg-white/[0.01] overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-gold border-t-transparent rounded-full mx-auto mb-6"></div>
                        <p className="text-white/40 font-bold uppercase tracking-widest animate-pulse">Synchronizing Catalog...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/[0.03] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Product Info</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">SKU</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Brand</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Price</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Category</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Inventory</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-display">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedProducts.length > 0 ? (
                                    paginatedProducts.map((product) => (
                                        <tr key={product._id} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <div className="w-14 h-14 rounded-xl bg-navy/40 overflow-hidden border border-white/10 shrink-0 relative">
                                                        {product.image ? (
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white/10 font-bold">PIX</div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4 max-w-[200px]">
                                                        <p className="text-white font-bold font-display truncate group-hover:text-gold transition-colors">{product.name}</p>
                                                        <p className="text-white/30 text-xs truncate uppercase tracking-widest">{product._id.slice(-8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-white/40 font-mono text-xs font-bold">{product.sku}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-white font-bold text-xs uppercase tracking-widest">{product.brand || '---'}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-gold font-black font-display text-lg">
                                                    SAR {product.price?.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge variant="secondary" className="bg-white/5 border-white/5 text-white/40 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {product.category || 'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-black font-mono ${product.stock < 10 ? 'text-red-400' : 'text-white'}`}>
                                                        {product.stock}
                                                    </span>
                                                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Units</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 hover:text-white hover:bg-white/5">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-white/20 hover:text-gold hover:bg-gold/10" onClick={() => openEditForm(product)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-10 h-10 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/10"
                                                        onClick={() => handleDelete(product._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="max-w-xs mx-auto">
                                                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                                                    <Box className="w-8 h-8 text-white/20" />
                                                </div>
                                                <h5 className="text-white font-bold mb-2">No Records Found</h5>
                                                <p className="text-white/30 text-sm">Your catalog is currently empty. Start by adding a new industrial component.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-10 flex items-center justify-between px-2">
                <p className="text-xs text-white/20 font-bold uppercase tracking-[0.2em]">
                    Displaying <span className="text-white/60">{paginatedProducts.length}</span> of <span className="text-white/60">{filteredProducts.length}</span> Objects
                </p>
                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-30"
                    >
                        PREV PAGE.
                    </Button>
                    <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                            >
                                {String(i + 1).padStart(2, '0')}
                            </button>
                        )).slice(0, 5)}
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-30"
                    >
                        NEXT PAGE.
                    </Button>
                </div>
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-navy/80 backdrop-blur-xl" onClick={() => setShowProductForm(false)} />

                    <div className="relative z-10 w-full max-w-4xl bg-gray-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-2xl font-black text-white font-display uppercase tracking-tight">
                                    {editingProduct ? 'Update Inventory' : 'Initialize New Object'}
                                </h2>
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">
                                    {editingProduct ? `Serial: ${editingProduct._id}` : 'Catalog Entry Protocol'}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowProductForm(false)}
                                className="w-12 h-12 rounded-2xl bg-white/5 text-white/40 hover:text-white"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Image Col */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Visual Data</Label>
                                        <div className="relative group aspect-square rounded-[2rem] bg-navy border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all hover:border-gold/30">
                                            {formData.image ? (
                                                <>
                                                    <img
                                                        src={formData.image}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="text-white font-black text-[10px] uppercase tracking-widest"
                                                            onClick={() => fileInputRef.current?.click()}
                                                        >
                                                            Replace Asset
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6">
                                                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                                        <Upload className="w-8 h-8 text-white/10" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Upload Component Image</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            className="w-full h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-bold text-xs border border-white/5"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            SELECT LOCAL FILE
                                        </Button>
                                    </div>

                                    <div className="p-6 bg-gold/[0.03] border border-gold/10 rounded-2xl">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-4 h-4 text-gold mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-black text-gold uppercase tracking-wider mb-1">Catalog Tip</p>
                                                <p className="text-[11px] text-white/50 leading-relaxed">
                                                    Ensure High-resolution imagery (1000x1000px) is used for industrial parts to showcase technical details to B2B clients.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Col */}
                                <div className="lg:col-span-8 space-y-10">
                                    {/* Section: Identity */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] shrink-0">01 Identity</span>
                                            <div className="h-px w-full bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Scientific Name / Title</Label>
                                                <Input
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold"
                                                    placeholder="e.g. Caterpillar 320D Excavator Pump"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Serial Number (SKU)</Label>
                                                <Input
                                                    value={formData.sku}
                                                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-mono font-bold"
                                                    placeholder="SHI-HYD-9921"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Manufacturer (Brand)</Label>
                                                <Input
                                                    value={formData.brand}
                                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                                    className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold"
                                                    placeholder="Caterpillar, Komatsu, Volvo"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Object ID (Database)</Label>
                                                <Input
                                                    value={formData._id}
                                                    readOnly={!!editingProduct}
                                                    onChange={e => setFormData({ ...formData, _id: e.target.value })}
                                                    className="bg-white/[0.02] border-white/5 text-white/30 rounded-xl h-12 font-mono text-xs cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Logistics */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] shrink-0">02 Logistics</span>
                                            <div className="h-px w-full bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Unit Price (SAR)</Label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                                                    <Input
                                                        type="number"
                                                        value={formData.price}
                                                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                        className="pl-12 bg-white/5 border-white/10 text-white rounded-xl h-12 font-black text-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Initial Stock Level</Label>
                                                <div className="relative">
                                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                                                    <Input
                                                        type="number"
                                                        value={formData.stock}
                                                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                                        className="pl-12 bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Core Category</Label>
                                                <div className="relative">
                                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                                                    <select
                                                        value={formData.category}
                                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                        className="w-full h-12 pl-12 bg-white/5 border border-white/10 text-white rounded-xl font-bold appearance-none"
                                                    >
                                                        <option value="">Select Level</option>
                                                        <option value="Hydraulics">Hydraulics</option>
                                                        <option value="Engine">Engine</option>
                                                        <option value="Transmission">Transmission</option>
                                                        <option value="Undercarriage">Undercarriage</option>
                                                        <option value="Electronics">Electronics</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Description */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] shrink-0">03 Specifications</span>
                                            <div className="h-px w-full bg-white/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Technical Description</Label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="bg-white/5 border-white/10 text-white rounded-2xl min-h-[120px] p-6 focus:ring-gold/20"
                                                placeholder="Provide detailed technical specifications and compatibility data..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-14 flex-1 border-white/5 bg-white/5 text-white/40 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10"
                                    onClick={() => setShowProductForm(false)}
                                >
                                    ABORT
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-14 flex-[2] bg-gold hover:bg-white text-navy font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-gold/20 flex items-center justify-center"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-navy border-t-transparent animate-spin rounded-full" />
                                            <span>SYNCHRONIZING...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Save className="w-5 h-5" />
                                            <span>COMMIT CHANGES</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
