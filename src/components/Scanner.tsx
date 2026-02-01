'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MAX_IMAGES = 3;

export function Scanner() {
    const router = useRouter();
    const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ name: string; expiryDate: string; isGuest?: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected && images.length < MAX_IMAGES) {
            const newImage = {
                file: selected,
                preview: URL.createObjectURL(selected),
            };
            setImages([...images, newImage]);
            setResult(null);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        // Revoke URL to free memory
        URL.revokeObjectURL(images[index].preview);
        setImages(newImages);
    };

    const handleScan = async () => {
        if (images.length === 0) return;
        setLoading(true);

        try {
            const formData = new FormData();
            images.forEach((img) => {
                formData.append('images', img.file);
            });

            const res = await fetch('/api/scan', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Scan failed');
            }

            const data = await res.json();
            setResult(data);

            // Clear images
            images.forEach(img => URL.revokeObjectURL(img.preview));
            setImages([]);

            // Wait a bit to show success then clear
            setTimeout(() => setResult(null), 5000);

            if (!data.isGuest) {
                router.refresh();
            }

        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to scan item');
        } finally {
            setLoading(false);
        }
    };

    const clearAllImages = () => {
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                        Add New Item
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Snap {MAX_IMAGES} photos from different angles
                    </p>
                </div>

                {result ? (
                    <div className={`border rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${result.isGuest ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                        <div className={`p-2 rounded-full ${result.isGuest ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            {result.isGuest ? <Loader2 size={20} /> : <Plus size={20} />}
                        </div>
                        <div>
                            <p className={`font-medium ${result.isGuest ? 'text-blue-900' : 'text-green-900'}`}>
                                {result.isGuest ? `Analyzed: ${result.name}` : `Added ${result.name}!`}
                            </p>
                            <p className={`text-xs ${result.isGuest ? 'text-blue-700' : 'text-green-700'}`}>
                                {result.isGuest ? 'Sign up to save this item.' : `Expiry: ${new Date(result.expiryDate).toLocaleDateString()}`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Thumbnail Grid */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {images.map((img, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                                        <Image
                                            src={img.preview}
                                            alt={`Photo ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Image Counter */}
                        <div className="text-center text-sm text-gray-600 mb-2">
                            {images.length}/{MAX_IMAGES} images
                            {images.length > 0 && <span className="ml-2 text-green-600 font-medium">✓</span>}
                        </div>

                        {/* Add Photo Button */}
                        {images.length < MAX_IMAGES && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Camera className="text-gray-500 group-hover:text-green-500" size={20} />
                                </div>
                                <p className="text-sm font-medium text-gray-600">
                                    {images.length === 0 ? 'Tap to take photo' : 'Add another photo'}
                                </p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* Analyze Button */}
                        {images.length > 0 && (
                            <button
                                onClick={handleScan}
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-green-600 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                                {loading ? 'Analyzing...' : `Analyze ${images.length} Image${images.length > 1 ? 's' : ''}`}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
