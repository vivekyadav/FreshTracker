'use client';

import { Trash2, AlertTriangle, CheckCircle, Clock, Loader2, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Item = {
    id: number;
    name: string;
    category: string | null;
    expiryDate: Date | string | null; // serialized date from server
    status: string;
    imageUrl: string | null;
};

export function InventoryList({ items }: { items: Item[] }) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    useEffect(() => {
        setMounted(true);
    }, []);

    const categories = ['All', ...Array.from(new Set(items.map(item => item.category || 'General')))];

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || (item.category || 'General') === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (items.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                <p>No items yet. Scan or add manually!</p>
            </div>
        );
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            setDeletingId(id);
            const res = await fetch(`/api/items/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Delete failed');
            }

            router.refresh();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Failed to delete item');
        } finally {
            setDeletingId(null);
        }
    };

    const getDaysDiff = (dateStr: Date | string | null) => {
        if (!dateStr || !mounted) return null;
        const target = new Date(dateStr);
        const now = new Date();
        const diffTime = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusColor = (days: number | null) => {
        if (days === null) return 'bg-gray-100 text-gray-600';
        if (days < 0) return 'bg-red-100 text-red-600';
        if (days <= 3) return 'bg-yellow-100 text-yellow-600';
        return 'bg-green-100 text-green-600';
    };

    const getStatusIcon = (days: number | null) => {
        if (days === null) return <Clock size={16} />;
        if (days < 0) return <AlertTriangle size={16} />;
        if (days <= 3) return <Clock size={16} />;
        return <CheckCircle size={16} />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <Filter className="text-gray-400 flex-shrink-0" size={16} />
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === cat
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-green-500'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p>No items matching your search.</p>
                    </div>
                ) : (
                    filteredItems.map((item) => {
                        const days = getDaysDiff(item.expiryDate);
                        const colorClass = getStatusColor(days);
                        const isDeleting = deletingId === item.id;

                        return (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden ${item.imageUrl ? 'bg-gray-50' : colorClass}`}>
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback if image fails to load
                                                    (e.target as HTMLImageElement).src = '';
                                                    (e.target as HTMLImageElement).parentElement!.classList.add(colorClass);
                                                }}
                                            />
                                        ) : (
                                            getStatusIcon(days)
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-800">{item.name}</h3>
                                            <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                                {item.category || 'General'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {!mounted ? 'Checking expiry...' : (
                                                days !== null ? (
                                                    days < 0 ? `Expired ${Math.abs(days)} days ago` :
                                                        days === 0 ? 'Expires today' :
                                                            `Expires in ${days} days`
                                                ) : 'No expiry date'
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    className={`p-2 rounded-lg transition-colors ${isDeleting
                                        ? 'text-gray-300'
                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50 md:opacity-0 group-hover:opacity-100 focus:opacity-100'
                                        }`}
                                    aria-label="Delete"
                                    onClick={() => handleDelete(item.id)}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
