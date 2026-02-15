'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import Link from 'next/link';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function GalleryPage() {
    const { user } = useUser();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' or 'friend'
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState('');
    const [lightboxPhoto, setLightboxPhoto] = useState(null);

    const fetchPhotos = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let url;
            if (filter === 'friend' && selectedFriend) {
                url = `${API_URL}/shared-photos?userId=${user.sub}&friendId=${selectedFriend}`;
            } else {
                url = `${API_URL}/my-photos?userId=${user.sub}`;
            }
            const res = await fetch(url);
            const data = await res.json();

            // Get signed URLs for each photo
            const photosWithUrls = await Promise.all(
                (data.photos || []).map(async (photo) => {
                    const s3Key = photo.photos?.s3_key || photo.s3_key;
                    try {
                        const urlRes = await fetch(`${API_URL}/photo-url/${encodeURIComponent(s3Key)}`);
                        const urlData = await urlRes.json();
                        return { ...photo, displayUrl: urlData.url };
                    } catch {
                        return { ...photo, displayUrl: null };
                    }
                })
            );

            setPhotos(photosWithUrls);
        } catch (err) {
            console.error('Failed to fetch photos:', err);
        } finally {
            setLoading(false);
        }
    }, [user, filter, selectedFriend]);

    const fetchFriends = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/friends/${user.sub}`);
            const data = await res.json();
            setFriends(data.friends || []);
        } catch (err) {
            console.error('Failed to fetch friends:', err);
        }
    }, [user]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    const hidePhoto = async (photoId) => {
        try {
            await fetch(`${API_URL}/hide-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoId, userId: user.sub }),
            });
            setPhotos((prev) => prev.filter((p) => p.photo_id !== photoId));
        } catch (err) {
            console.error('Failed to hide photo:', err);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <div className={`page-enter ${styles.galleryPage}`}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Photos</h1>
                <p className={styles.subtitle}>Photos from events where you were recognized</p>
            </div>

            {/* Filter bar */}
            <div className={styles.filterBar}>
                <button
                    className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
                    onClick={() => { setFilter('all'); setSelectedFriend(''); }}
                >
                    All Photos
                </button>
                <button
                    className={`${styles.filterTab} ${filter === 'friend' ? styles.filterTabActive : ''}`}
                    onClick={() => setFilter('friend')}
                >
                    With Friend
                </button>
                {filter === 'friend' && (
                    <select
                        className={styles.friendSelect}
                        value={selectedFriend}
                        onChange={(e) => setSelectedFriend(e.target.value)}
                    >
                        <option value="">Select a friend...</option>
                        {friends.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className={styles.grid}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.skeleton} />
                    ))}
                </div>
            )}

            {/* Photos */}
            {!loading && photos.length > 0 && (
                <div className={styles.grid}>
                    {photos.map((photo) => (
                        <div key={photo.photo_id} className={styles.photoCard}>
                            <img
                                src={photo.displayUrl || '/placeholder.svg'}
                                alt="Event photo"
                                className={styles.photoImage}
                                onClick={() => setLightboxPhoto(photo)}
                            />
                            <div className={styles.photoOverlay}>
                                <div className={styles.photoMeta}>
                                    <span className={styles.photoDate}>
                                        {formatDate(photo.photos?.created_at)}
                                    </span>
                                    <div className={styles.photoActions}>
                                        <button
                                            className={styles.photoBtn}
                                            onClick={(e) => { e.stopPropagation(); hidePhoto(photo.photo_id); }}
                                            title="Hide photo"
                                        >
                                            👁️‍🗨️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && photos.length === 0 && (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📷</div>
                    <h3 className={styles.emptyTitle}>No photos yet</h3>
                    <p className={styles.emptyText}>
                        {filter === 'friend'
                            ? 'No shared photos found with this friend.'
                            : "When someone uploads event photos you're in, they'll appear here automatically."}
                    </p>
                    <Link href="/upload" className="btn btn-primary">
                        Upload Photos
                    </Link>
                </div>
            )}

            {/* Lightbox */}
            {lightboxPhoto && (
                <div className={styles.lightbox} onClick={() => setLightboxPhoto(null)}>
                    <button className={styles.lightboxClose} onClick={() => setLightboxPhoto(null)}>
                        ✕
                    </button>
                    <img
                        src={lightboxPhoto.displayUrl}
                        alt="Full size"
                        className={styles.lightboxImage}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
