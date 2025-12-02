import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Loader, UserPlus } from 'lucide-react';
import { getFollowing } from '../../lib/followService';
import { EnhancedUser } from '../../types/user';
import UserCard from './UserCard';
import { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { checkUserFollowStatus } from '../../lib/userProfile';

interface FollowingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    followingCount: number;
}

const FollowingModal: React.FC<FollowingModalProps> = ({
    isOpen,
    onClose,
    userId,
    followingCount
}) => {
    const { user: currentUser } = useAuth();
    const [following, setFollowing] = useState<EnhancedUser[]>([]);
    const [filteredFollowing, setFilteredFollowing] = useState<EnhancedUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [followStatusMap, setFollowStatusMap] = useState<Record<string, boolean>>({});

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Load initial following
    useEffect(() => {
        if (isOpen) {
            loadFollowing(true);
        } else {
            // Reset state when modal closes
            setFollowing([]);
            setFilteredFollowing([]);
            setSearchQuery('');
            setLastDoc(null);
            setHasMore(true);
        }
    }, [isOpen, userId]);

    // Load following function
    const loadFollowing = async (reset: boolean = false) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            const result = await getFollowing(userId, 100, reset ? null : lastDoc);

            if (reset) {
                setFollowing(result.users);
                setFilteredFollowing(result.users);
            } else {
                setFollowing(prev => [...prev, ...result.users]);
                setFilteredFollowing(prev => [...prev, ...result.users]);
            }

            setLastDoc(result.lastDoc);
            setHasMore(result.hasMore);

            // Load follow status for current user
            if (currentUser) {
                const statusMap: Record<string, boolean> = {};
                for (const user of result.users) {
                    if (user.id !== currentUser.uid) {
                        const isFollowing = await checkUserFollowStatus(currentUser.uid, user.id);
                        statusMap[user.id] = isFollowing;
                    }
                }
                setFollowStatusMap(prev => ({ ...prev, ...statusMap }));
            }
        } catch (error) {
            console.error('Error loading following:', error);
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
                    loadFollowing(false);
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
            setFilteredFollowing(following);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = following.filter(
                user =>
                    user.displayName.toLowerCase().includes(query) ||
                    user.username.toLowerCase().includes(query)
            );
            setFilteredFollowing(filtered);
        }
    }, [searchQuery, following]);

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
                        <UserPlus className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Following {followingCount > 0 && `(${followingCount})`}
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
                            placeholder="Search following..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredFollowing.length === 0 && !isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <UserPlus className="w-12 h-12 mb-3 text-gray-300" />
                            <p className="text-lg font-medium">
                                {searchQuery ? 'No users found' : 'Not following anyone yet'}
                            </p>
                            <p className="text-sm mt-1">
                                {searchQuery ? 'Try a different search term' : 'Start following creators!'}
                            </p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {filteredFollowing.map((user) => (
                                <UserCard
                                    key={user.id}
                                    user={user}
                                    isFollowing={followStatusMap[user.id] || false}
                                    onFollowToggle={handleFollowToggle}
                                />
                            ))}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                                    <span className="ml-2 text-sm text-gray-600">Loading...</span>
                                </div>
                            )}

                            {/* Infinite Scroll Trigger */}
                            {hasMore && !isLoading && (
                                <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                                    <p className="text-sm text-gray-400">Scroll for more...</p>
                                </div>
                            )}

                            {/* End of List */}
                            {!hasMore && following.length > 0 && (
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

export default FollowingModal;
