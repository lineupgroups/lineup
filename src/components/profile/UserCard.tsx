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
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 group-hover:border-blue-300 transition-colors">
                    {user.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt={user.displayName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {getInitials(user.displayName)}
                        </div>
                    )}
                </div>
                {/* Level Badge */}
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                    L{user.level}
                </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                        {user.displayName}
                    </h3>
                    {user.verificationBadges && user.verificationBadges.length > 0 && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
                <p className="text-sm text-gray-500">@{user.username}</p>
                {user.bio && (
                    <p className="text-sm text-gray-600 truncate mt-0.5">
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
            flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-all
            ${localIsFollowing
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
                >
                    {isLoading ? (
                        <div className="w-16 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        localIsFollowing ? 'Following' : 'Follow'
                    )}
                </button>
            )}
        </div>
    );
};

export default UserCard;
