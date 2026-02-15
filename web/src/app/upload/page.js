'use client';

import { useState, useRef, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function UploadPage() {
    const { user } = useUser();
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [results, setResults] = useState(null);

    const addFiles = (newFiles) => {
        const items = Array.from(newFiles)
            .filter((f) => f.type.startsWith('image/'))
            .map((f) => ({
                file: f,
                id: Math.random().toString(36).slice(2),
                name: f.name,
                size: f.size,
                preview: URL.createObjectURL(f),
                status: 'pending',
            }));
        setFiles((prev) => [...prev, ...items]);
    };

    const removeFile = (id) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) {
            addFiles(e.dataTransfer.files);
        }
    }, []);

    const handleUpload = async () => {
        if (!user || files.length === 0) return;
        setUploading(true);
        let totalFaces = 0;
        let successCount = 0;

        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            setFiles((prev) =>
                prev.map((item) =>
                    item.id === f.id ? { ...item, status: 'uploading' } : item
                )
            );

            try {
                // 1. Get presigned URL
                const urlRes = await fetch(`${API_URL}/upload-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: f.name,
                        fileType: f.file.type,
                        uploaderId: user.sub,
                    }),
                });
                const { uploadUrl, photoId, s3Key } = await urlRes.json();

                // 2. Upload to S3
                await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': f.file.type },
                    body: f.file,
                });

                // 3. Process photo (face recognition)
                const processRes = await fetch(`${API_URL}/photo-processed`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ s3Key, photoId }),
                });
                const processData = await processRes.json();

                totalFaces += processData.matches?.length || 0;
                successCount++;

                setFiles((prev) =>
                    prev.map((item) =>
                        item.id === f.id ? { ...item, status: 'done' } : item
                    )
                );
            } catch (err) {
                console.error(`Failed to upload ${f.name}:`, err);
                setFiles((prev) =>
                    prev.map((item) =>
                        item.id === f.id ? { ...item, status: 'error' } : item
                    )
                );
            }
        }

        setUploading(false);
        setResults({
            uploaded: successCount,
            total: files.length,
            faces: totalFaces,
        });
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const pendingFiles = files.filter((f) => f.status === 'pending');

    return (
        <div className={`page-enter ${styles.uploadPage}`}>
            <div className={styles.header}>
                <div className={styles.headerIcon}>📤</div>
                <h1 className={styles.title}>Upload Photos</h1>
                <p className={styles.subtitle}>
                    Upload event photos and our AI will automatically find and tag the
                    people in them.
                </p>
            </div>

            {/* Dropzone */}
            <div
                className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className={styles.dropzoneIcon}>📁</div>
                <p className={styles.dropzoneText}>
                    Drop photos here or click to browse
                </p>
                <p className={styles.dropzoneHint}>Supports JPG, PNG, WebP</p>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(e) => addFiles(e.target.files)}
            />

            {/* File list */}
            {files.length > 0 && (
                <div className={styles.fileList}>
                    {files.map((f) => (
                        <div key={f.id} className={styles.fileItem}>
                            <img src={f.preview} alt="" className={styles.fileThumb} />
                            <div className={styles.fileInfo}>
                                <p className={styles.fileName}>{f.name}</p>
                                <p className={styles.fileSize}>{formatSize(f.size)}</p>
                            </div>
                            <span
                                className={`${styles.fileStatus} ${f.status === 'pending'
                                        ? styles.filePending
                                        : f.status === 'uploading'
                                            ? styles.fileUploading
                                            : f.status === 'done'
                                                ? styles.fileDone
                                                : styles.fileError
                                    }`}
                            >
                                {f.status === 'pending'
                                    ? 'Ready'
                                    : f.status === 'uploading'
                                        ? 'Processing...'
                                        : f.status === 'done'
                                            ? '✓ Done'
                                            : '✕ Error'}
                            </span>
                            {f.status === 'pending' && (
                                <button
                                    className={styles.removeFile}
                                    onClick={() => removeFile(f.id)}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload button */}
            {pendingFiles.length > 0 && !uploading && (
                <button
                    className={`btn btn-primary ${styles.uploadBtn}`}
                    onClick={handleUpload}
                >
                    Upload {pendingFiles.length} photo{pendingFiles.length !== 1 ? 's' : ''}
                </button>
            )}

            {/* Results */}
            {results && (
                <div className={styles.results}>
                    <div className={styles.resultsIcon}>🎉</div>
                    <h3 className={styles.resultsTitle}>Upload Complete!</h3>
                    <p className={styles.resultsText}>
                        {results.uploaded} of {results.total} photos uploaded.{' '}
                        {results.faces} face{results.faces !== 1 ? 's' : ''} recognized and
                        matched.
                    </p>
                </div>
            )}
        </div>
    );
}
