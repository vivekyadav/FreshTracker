'use client';

import { Trash2, AlertTriangle, CheckCircle, Clock, Loader2, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ItemDetailModal } from './ItemDetailModal';

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
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
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

    const deleteItem = async (id: number) => {
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

    const handleDelete = async (id: number) => {
        // Prevent bubbling to item click
        if (!confirm('Are you sure you want to delete this item?')) return;
        await deleteItem(id);
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

            <div className="space-y-4">
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
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden transition-all ${item.imageUrl ? 'bg-gray-50' : colorClass}`}>
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
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-800 text-lg leading-tight truncate">{item.name}</h3>
                                            <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                {item.category || 'General'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-medium ${days !== null && days <= 3 ? 'text-orange-600' : days !== null && days < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                {!mounted ? 'Checking...' : (
                                                    days !== null ? (
                                                        days < 0 ? `Expired ${Math.abs(days)}d ago` :
                                                            days === 0 ? 'Expires today' :
                                                                `${days} days left`
                                                    ) : 'No expiry date'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pl-4">
                                    <button
                                        className={`p-3 rounded-lg transition-all ${isDeleting
                                            ? 'text-gray-300'
                                            : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                                            }`}
                                        aria-label="Delete"
                                        onClick={(e) => {
                                            e.stopPropagation(); // stop click from opening modal
                                            handleDelete(item.id);
                                        }}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onDelete={deleteItem}
                />
            )}
        </div>
    );
}
