import { X, Calendar, Tag, Trash2, Loader2, AlertTriangle, CheckCircle, Clock, Pencil, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

type Item = {
    id: number;
    name: string;
    category: string | null;
    expiryDate: Date | string | null;
    status: string;
    imageUrl: string | null;
};

type ItemDetailModalProps = {
    item: Item;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (id: number) => Promise<void>;
    onUpdate?: (id: number, data: Partial<Item>) => Promise<void>;
};

export function ItemDetailModal({ item, isOpen, onClose, onDelete, onUpdate }: ItemDetailModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditingExpiry, setIsEditingExpiry] = useState(false);
    const [editedExpiry, setEditedExpiry] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (item.expiryDate) {
            const date = new Date(item.expiryDate);
            setEditedExpiry(date.toISOString().split('T')[0]);
        }
    }, [item.expiryDate]);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        setIsDeleting(true);
        await onDelete(item.id);
        setIsDeleting(false);
        onClose();
    };

    const handleSaveExpiry = async () => {
        if (!onUpdate || !editedExpiry) return;
        setIsSaving(true);
        try {
            await onUpdate(item.id, { expiryDate: new Date(editedExpiry) });
            setIsEditingExpiry(false);
        } catch (error) {
            console.error('Failed to update expiry:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getDaysDiff = (dateStr: Date | string | null) => {
        if (!dateStr) return null;
        const target = new Date(dateStr);
        const now = new Date();
        const diffTime = target.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const days = getDaysDiff(item.expiryDate);

    const getStatusColor = (days: number | null) => {
        if (days === null) return 'bg-gray-100 text-gray-600';
        if (days < 0) return 'bg-red-100 text-red-600';
        if (days <= 3) return 'bg-yellow-100 text-yellow-600';
        return 'bg-green-100 text-green-600';
    };

    const getStatusIcon = (days: number | null) => {
        if (days === null) return <Clock size={20} />;
        if (days < 0) return <AlertTriangle size={20} />;
        if (days <= 3) return <Clock size={20} />;
        return <CheckCircle size={20} />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="relative h-64 w-full bg-gray-100">
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            {getStatusIcon(days)}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur text-sm font-semibold rounded-full shadow-sm">
                            {item.category || 'General'}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{item.name}</h2>
                        <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${getStatusColor(days)} bg-opacity-10`}>
                            {getStatusIcon(days)}
                            <span className="font-medium">
                                {days !== null ? (
                                    days < 0 ? `Expired ${Math.abs(days)} days ago` :
                                        days === 0 ? 'Expires today' :
                                            `Expires in ${days} days`
                                ) : 'No expiry date'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                            <div className="flex items-center justify-between text-gray-500 mb-1">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Expiry Date</span>
                                </div>
                                {onUpdate && !isEditingExpiry && (
                                    <button
                                        onClick={() => setIsEditingExpiry(true)}
                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        title="Edit expiry date"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                )}
                            </div>
                            {isEditingExpiry ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={editedExpiry}
                                        onChange={(e) => setEditedExpiry(e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                    <button
                                        onClick={handleSaveExpiry}
                                        disabled={isSaving}
                                        className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingExpiry(false)}
                                        className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <p className="font-medium text-gray-900">
                                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 'N/A'}
                                </p>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Tag size={16} />
                                <span className="text-xs font-semibold uppercase tracking-wider">Status</span>
                            </div>
                            <p className="font-medium text-gray-900 capitalize">
                                {item.status}
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full py-3 px-4 bg-white border-2 border-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
                        >
                            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={20} />}
                            Delete Item
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
