'use client';

import { useState } from 'react';
import { Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx'; // Ensure clsx is installed or use template literals

export default function PhotoUpload({ eventId, isReference, onUploadComplete }: { eventId?: string, isReference?: boolean, onUploadComplete?: () => void }) {
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setStatus('idle');
        setMessage('');

        try {
            // 1. Get Presigned URL
            const presignRes = await fetch('/api/photos/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    eventId,
                    isReference,
                }),
            });

            if (!presignRes.ok) throw new Error('Failed to get upload URL');
            const { uploadUrl, photoId } = await presignRes.json();

            // 2. Upload to S3
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            if (!uploadRes.ok) throw new Error('Failed to upload to S3');

            // 3. Complete Upload
            const completeRes = await fetch('/api/photos/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoId }),
            });

            if (!completeRes.ok) throw new Error('Failed to mark upload complete');

            setStatus('success');
            setMessage('Photo uploaded successfully!');
            if (onUploadComplete) onUploadComplete();
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <label className="flex flex-col items-center justify-center cursor-pointer space-y-2">
                {uploading ? (
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                ) : status === 'success' ? (
                    <Check className="w-10 h-10 text-green-500" />
                ) : status === 'error' ? (
                    <AlertCircle className="w-10 h-10 text-red-500" />
                ) : (
                    <Upload className="w-10 h-10 text-gray-500" />
                )}

                <span className="text-sm font-medium text-gray-700">
                    {uploading ? 'Uploading...' : status === 'success' ? 'Uploaded!' : 'Click to Upload Photo'}
                </span>

                {message && <p className={clsx("text-xs", status === 'error' ? "text-red-500" : "text-green-600")}>{message}</p>}

                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </label>
        </div>
    );
}
