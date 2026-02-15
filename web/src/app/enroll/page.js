'use client';

import { useState, useRef, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function EnrollPage() {
    const { user } = useUser();
    const router = useRouter();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const [step, setStep] = useState(0); // 0: choose, 1: capture/preview, 2: uploading, 3: done
    const [imageData, setImageData] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [streaming, setStreaming] = useState(false);
    const [status, setStatus] = useState(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 640 },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStreaming(true);
                setStep(1);
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Camera access denied. Please allow camera access or upload a photo instead.' });
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            setStreaming(false);
        }
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = 640;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        ctx.translate(640, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, 640, 640);
        canvas.toBlob((blob) => {
            setImageFile(blob);
            setImageData(canvas.toDataURL('image/jpeg'));
            stopCamera();
        }, 'image/jpeg', 0.9);
    }, [stopCamera]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setImageData(ev.target.result);
            setStep(1);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!imageFile || !user) return;
        setStep(2);
        setStatus({ type: 'loading', message: 'Enrolling your face...' });

        try {
            // 1. Get upload URL
            const urlRes = await fetch(`${API_URL}/upload-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: 'selfie.jpg',
                    fileType: 'image/jpeg',
                    uploaderId: user.sub,
                }),
            });
            const { uploadUrl, s3Key } = await urlRes.json();

            // 2. Upload to S3
            await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'image/jpeg' },
                body: imageFile,
            });

            // 3. Enroll face
            const enrollRes = await fetch(`${API_URL}/enroll-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    s3Key,
                    userId: user.sub,
                    name: user.name || user.nickname || 'User',
                }),
            });
            const enrollData = await enrollRes.json();

            if (enrollRes.ok) {
                setStep(3);
                setStatus({ type: 'success', message: 'Face enrolled successfully! Redirecting to gallery...' });
                setTimeout(() => router.push('/gallery'), 2000);
            } else {
                throw new Error(enrollData.error || 'Enrollment failed');
            }
        } catch (err) {
            setStep(1);
            setStatus({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
        }
    };

    const reset = () => {
        stopCamera();
        setImageData(null);
        setImageFile(null);
        setStep(0);
        setStatus(null);
    };

    return (
        <div className={`page-enter ${styles.enrollPage}`}>
            <div className={styles.header}>
                <div className={styles.headerIcon}>🤳</div>
                <h1 className={styles.title}>Enroll Your Face</h1>
                <p className={styles.subtitle}>
                    Take a selfie or upload a clear photo of your face. This helps us find
                    you in event photos automatically.
                </p>
            </div>

            {/* Steps indicator */}
            <div className={styles.stepsIndicator}>
                <div className={`${styles.stepDot} ${step >= 0 ? styles.stepDotActive : ''} ${step > 0 ? styles.stepDotComplete : ''}`} />
                <div className={`${styles.stepDot} ${step >= 1 ? styles.stepDotActive : ''} ${step > 1 ? styles.stepDotComplete : ''}`} />
                <div className={`${styles.stepDot} ${step >= 3 ? styles.stepDotActive : ''}`} />
            </div>

            {/* Step 0: Choose method */}
            {step === 0 && (
                <>
                    <div className={styles.captureArea} onClick={startCamera}>
                        <div className={styles.captureIcon}>📷</div>
                        <p className={styles.captureText}>Take a Selfie</p>
                        <p className={styles.captureHint}>Use your webcam to capture a photo</p>
                    </div>
                    <div className={styles.orDivider}>or</div>
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        📁 Upload a Photo
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className={styles.hiddenInput}
                        onChange={handleFileSelect}
                    />
                </>
            )}

            {/* Step 1: Camera stream or preview */}
            {step === 1 && streaming && (
                <>
                    <video ref={videoRef} autoPlay playsInline className={styles.video} />
                    <div className={styles.captureActions}>
                        <button className="btn btn-secondary" onClick={reset}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={capturePhoto}>
                            📸 Capture
                        </button>
                    </div>
                </>
            )}

            {step === 1 && !streaming && imageData && (
                <>
                    <div className={styles.preview}>
                        <img src={imageData} alt="Preview" className={styles.previewImage} />
                        <button className={styles.removeBtn} onClick={reset}>✕</button>
                    </div>
                    <button
                        className={`btn btn-primary ${styles.submitBtn}`}
                        onClick={handleSubmit}
                    >
                        Enroll My Face
                    </button>
                </>
            )}

            {/* Step 2: Uploading */}
            {step === 2 && (
                <div className={styles.preview}>
                    <img src={imageData} alt="Uploading" className={styles.previewImage} style={{ opacity: 0.6 }} />
                </div>
            )}

            {/* Canvas (hidden) */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Status messages */}
            {status && (
                <div className={`${styles.status} ${status.type === 'success' ? styles.statusSuccess :
                        status.type === 'error' ? styles.statusError :
                            styles.statusLoading
                    }`}>
                    {status.message}
                </div>
            )}
        </div>
    );
}
