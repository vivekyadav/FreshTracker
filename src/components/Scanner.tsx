'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function Scanner() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ name: string; expiryDate: string; isGuest?: boolean } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setResult(null);
        }
    };

    const handleScan = async () => {
        if (!file) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch('/api/scan', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Scan failed');

            const data = await res.json();
            setResult(data);
            setFile(null);
            setPreview(null);
            // Wait a bit to show success then clear
            setTimeout(() => setResult(null), 5000); // 5s success toast

            if (!data.isGuest) {
                router.refresh(); // Update the server component list only if saved
            }

        } catch (err) {
            console.error(err);
            alert('Failed to scan item');
        } finally {
            setLoading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                        Add New Item
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Snap a photo to auto-track expiry</p>
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
                ) : !preview ? (
                    <div className="space-y-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Camera className="text-gray-500 group-hover:text-green-500" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Tap to take photo</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/5 shadow-inner">
                            <Image src={preview} alt="Preview" fill className="object-cover" />
                            <button
                                onClick={clearFile}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <button
                            onClick={handleScan}
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-green-600 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                            {loading ? 'Analyzing...' : 'Scan & Add'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
