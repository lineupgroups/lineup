import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnhancedUser } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';
import { useUserFollow } from '../../hooks/useEnhancedUserProfile';

interface UserCardProps {
    user: EnhancedUser;
    isFollowing: boolean;
    onFollowToggle?: (userId: string, isFollowing: boolean) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, isFollowing, onFollowToggle }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { toggleFollow, isLoading } = useUserFollow(user.id);
    const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);

    const isOwnProfile = currentUser?.uid === user.id;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleFollowToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click

        await toggleFollow();
        const newFollowState = !localIsFollowing;
        setLocalIsFollowing(newFollowState);

        if (onFollowToggle) {
            onFollowToggle(user.id, newFollowState);
        }
    };

    const handleCardClick = () => {
        navigate(`/profile/${user.username}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="flex items-center gap-4 p-4 hover:bg-neutral-800/50 rounded-2xl border border-transparent hover:border-neutral-800 transition-all duration-300 cursor-pointer group"
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-900 border-2 border-neutral-800 group-hover:border-brand-acid/50 transition-all duration-500 shadow-xl">
                    {user.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt={user.displayName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-brand-white text-sm font-black italic uppercase">
                            {getInitials(user.displayName)}
                        </div>
                    )}
                </div>
                {/* Level Badge */}
                <div className="absolute -bottom-1 -right-1 bg-brand-orange text-brand-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-brand-black shadow-lg">
                    LVL {user.level}
                </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-brand-white uppercase italic tracking-tight truncate group-hover:text-brand-acid transition-colors">
                        {user.displayName}
                    </h3>
                    {user.verificationBadges && user.verificationBadges.length > 0 && (
                        <svg className="w-4 h-4 text-brand-acid flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500">@{user.username}</p>
                {user.bio && (
                    <p className="text-xs text-neutral-400 font-medium truncate mt-1.5 opacity-80">
                        {user.bio}
                    </p>
                )}
            </div>

            {/* Follow Button */}
            {!isOwnProfile && currentUser && (
                <button
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                    className={`
                        flex-shrink-0 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
                        ${localIsFollowing
                            ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                            : 'bg-brand-acid text-brand-black hover:bg-[#b3e600] shadow-[0_0_15px_rgba(204,255,0,0.1)]'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95
                    `}
                >
                    {isLoading ? (
                        <div className="w-12 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        localIsFollowing ? 'Unfollow' : 'Follow'
                    )}
                </button>
            )}
        </div>
    );
};

export default UserCard;
