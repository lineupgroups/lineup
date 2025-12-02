import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader, Users } from 'lucide-react';
import { getFollowers } from '../../lib/followService';
import { EnhancedUser } from '../../types/user';
import UserCard from './UserCard';
import { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { checkUserFollowStatus } from '../../lib/userProfile';

interface FollowersModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    followerCount: number;
}

const FollowersModal: React.FC<FollowersModalProps> = ({
    isOpen,
    onClose,
    userId,
    followerCount
}) => {
    const { user: currentUser } = useAuth();
    const [followers, setFollowers] = useState<EnhancedUser[]>([]);
    const [filteredFollowers, setFilteredFollowers] = useState<EnhancedUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [followStatusMap, setFollowStatusMap] = useState<Record<string, boolean>>({});

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Load initial followers
    useEffect(() => {
        if (isOpen) {
            loadFollowers(true);
        } else {
            // Reset state when modal closes
            setFollowers([]);
            setFilteredFollowers([]);
            setSearchQuery('');
            setLastDoc(null);
            setHasMore(true);
        }
    }, [isOpen, userId]);

    // Load followers function
    const loadFollowers = async (reset: boolean = false) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const result = await getFollowers(userId, 100, reset ? null : lastDoc);

            if (reset) {
                setFollowers(result.users);
                setFilteredFollowers(result.users);
            } else {
                setFollowers(prev => [...prev, ...result.users]);
                setFilteredFollowers(prev => [...prev, ...result.users]);
            }

            setLastDoc(result.lastDoc);
            setHasMore(result.hasMore);

            // Load follow status for current user
            if (currentUser) {
                const statusMap: Record<string, boolean> = {};
                for (const follower of result.users) {
                    if (follower.id !== currentUser.uid) {
                        const isFollowing = await checkUserFollowStatus(currentUser.uid, follower.id);
                        statusMap[follower.id] = isFollowing;
                    }
                }
                setFollowStatusMap(prev => ({ ...prev, ...statusMap }));
            }
        } catch (error) {
            console.error('Error loading followers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Infinite scroll observer
    useEffect(() => {
        if (!isOpen || !loadMoreRef.current) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadFollowers(false);
                }
            },
            { threshold: 0.1 }
        );

        observerRef.current.observe(loadMoreRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [isOpen, hasMore, isLoading, lastDoc]);

    // Search filter
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredFollowers(followers);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = followers.filter(
                follower =>
                    follower.displayName.toLowerCase().includes(query) ||
                    follower.username.toLowerCase().includes(query)
            );
            setFilteredFollowers(filtered);
        }
    }, [searchQuery, followers]);

    // Handle follow toggle
    const handleFollowToggle = useCallback((targetUserId: string, isFollowing: boolean) => {
        setFollowStatusMap(prev => ({
            ...prev,
            [targetUserId]: isFollowing
        }));
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Followers {followerCount > 0 && `(${followerCount})`}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search followers..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredFollowers.length === 0 && !isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Users className="w-12 h-12 mb-3 text-gray-300" />
                            <p className="text-lg font-medium">
                                {searchQuery ? 'No followers found' : 'No followers yet'}
                            </p>
                            <p className="text-sm mt-1">
                                {searchQuery ? 'Try a different search term' : 'Be the first to follow!'}
                            </p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {filteredFollowers.map((follower) => (
                                <UserCard
                                    key={follower.id}
                                    user={follower}
                                    isFollowing={followStatusMap[follower.id] || false}
                                    onFollowToggle={handleFollowToggle}
                                />
                            ))}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                                    <span className="ml-2 text-sm text-gray-600">Loading followers...</span>
                                </div>
                            )}

                            {/* Infinite Scroll Trigger */}
                            {hasMore && !isLoading && (
                                <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                                    <p className="text-sm text-gray-400">Scroll for more...</p>
                                </div>
                            )}

                            {/* End of List */}
                            {!hasMore && followers.length > 0 && (
                                <div className="text-center py-4 text-sm text-gray-500">
                                    You've reached the end of the list
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowersModal;
