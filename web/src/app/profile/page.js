'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import Link from 'next/link';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProfilePage() {
    const { user } = useUser();
    const [friends, setFriends] = useState([]);
    const [friendInput, setFriendInput] = useState('');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchFriends = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/friends/${user.sub}`);
            const data = await res.json();
            setFriends(data.friends || []);
        } catch (err) {
            console.error('Failed to fetch friends:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    const addFriend = async (e) => {
        e.preventDefault();
        if (!friendInput.trim() || !user) return;
        setStatus(null);

        try {
            const res = await fetch(`${API_URL}/friends/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.sub,
                    friendName: friendInput.trim(),
                }),
            });
            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: `Added ${friendInput.trim()} as a friend!` });
                setFriendInput('');
                fetchFriends();
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to add friend' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
        }
    };

    const removeFriend = async (friendId) => {
        try {
            await fetch(`${API_URL}/friends/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.sub,
                    friendId,
                }),
            });
            setFriends((prev) => prev.filter((f) => f.id !== friendId));
        } catch (err) {
            console.error('Failed to remove friend:', err);
        }
    };

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';
    };

    if (!user) {
        return (
            <div className={`page-enter ${styles.profilePage}`}>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Please log in to view your profile.
                </p>
            </div>
        );
    }

    return (
        <div className={`page-enter ${styles.profilePage}`}>
            <h1 className={styles.title}>Profile</h1>

            {/* User card */}
            <div className={styles.userCard}>
                {user.picture && (
                    <img
                        src={user.picture}
                        alt={user.name}
                        className={styles.userAvatar}
                    />
                )}
                <div className={styles.userInfo}>
                    <h2 className={styles.userName}>{user.name}</h2>
                    <p className={styles.userEmail}>{user.email}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="badge badge-accent">Face Enrolled</span>
                        <Link href="/enroll" className="badge badge-success" style={{ textDecoration: 'none' }}>
                            Re-enroll →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Friends section */}
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Friends</h3>
                <span className={styles.sectionCount}>{friends.length} friends</span>
            </div>

            {/* Add friend */}
            <form className={styles.addFriend} onSubmit={addFriend}>
                <input
                    className="input"
                    type="text"
                    placeholder="Add friend by name..."
                    value={friendInput}
                    onChange={(e) => setFriendInput(e.target.value)}
                />
                <button
                    type="submit"
                    className={`btn btn-primary ${styles.addFriendBtn}`}
                    disabled={!friendInput.trim()}
                >
                    Add
                </button>
            </form>

            {/* Status */}
            {status && (
                <div className={`${styles.status} ${status.type === 'error' ? styles.statusError : styles.statusSuccess
                    }`}>
                    {status.message}
                </div>
            )}

            {/* Friends list */}
            {friends.length > 0 ? (
                <div className={styles.friendsList}>
                    {friends.map((friend) => (
                        <div key={friend.id} className={styles.friendItem}>
                            <div className={styles.friendAvatar}>
                                {getInitials(friend.name)}
                            </div>
                            <span className={styles.friendName}>{friend.name}</span>
                            <div className={styles.friendActions}>
                                <Link
                                    href={`/gallery?friend=${friend.id}`}
                                    className="btn btn-ghost"
                                    style={{ fontSize: '0.813rem' }}
                                >
                                    📷 Photos
                                </Link>
                                <button
                                    className="btn btn-ghost"
                                    style={{ fontSize: '0.813rem', color: 'var(--danger)' }}
                                    onClick={() => removeFriend(friend.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : !loading ? (
                <div className={styles.emptyFriends}>
                    <div className={styles.emptyFriendsIcon}>👥</div>
                    <p className={styles.emptyFriendsText}>
                        No friends added yet. Add friends to find shared photos!
                    </p>
                </div>
            ) : null}
        </div>
    );
}
