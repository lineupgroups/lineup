import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface BookmarkButtonProps {
    projectId: string;
    projectTitle: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

export default function BookmarkButton({
    projectId,
    projectTitle,
    size = 'md',
    showLabel = true,
    className
}: BookmarkButtonProps) {
    const { user } = useAuth();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const buttonSizeClasses = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    // Check if project is bookmarked on mount
    useEffect(() => {
        const checkBookmarkStatus = async () => {
            if (!user?.uid || !projectId) {
                setIsInitializing(false);
                return;
            }

            try {
                const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', projectId);
                const bookmarkSnap = await getDoc(bookmarkRef);
                setIsBookmarked(bookmarkSnap.exists());
            } catch (error) {
                console.error('Error checking bookmark status:', error);
            } finally {
                setIsInitializing(false);
            }
        };

        checkBookmarkStatus();
    }, [user?.uid, projectId]);

    const handleToggleBookmark = async () => {
        if (!user) {
            toast.error('Please sign in to save projects');
            return;
        }

        setIsLoading(true);

        try {
            const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', projectId);

            if (isBookmarked) {
                // Remove bookmark
                await deleteDoc(bookmarkRef);
                setIsBookmarked(false);
                toast.success('Removed from saved projects');
            } else {
                // Add bookmark
                await setDoc(bookmarkRef, {
                    projectId,
                    projectTitle,
                    savedAt: serverTimestamp()
                });
                setIsBookmarked(true);
                toast.success('Project saved! Find it in your profile.');
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
            toast.error('Failed to save project');
        } finally {
            setIsLoading(false);
        }
    };

    if (isInitializing) {
        return (
            <button
                disabled
                className={cn(
                    'inline-flex items-center gap-2 rounded-lg border transition-all duration-200',
                    'bg-white border-gray-200 text-gray-400',
                    buttonSizeClasses[size],
                    className
                )}
            >
                <div className={cn(sizeClasses[size], 'animate-pulse bg-gray-200 rounded')} />
                {showLabel && <span className="font-medium">Save</span>}
            </button>
        );
    }

    return (
        <button
            onClick={handleToggleBookmark}
            disabled={isLoading}
            aria-label={isBookmarked ? 'Remove from saved projects' : 'Save project for later'}
            className={cn(
                'inline-flex items-center gap-2 rounded-lg border transition-all duration-200',
                'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500',
                isBookmarked
                    ? 'bg-orange-50 border-orange-300 text-orange-600'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300',
                isLoading && 'opacity-70 cursor-not-allowed',
                buttonSizeClasses[size],
                className
            )}
        >
            <Bookmark
                className={cn(
                    sizeClasses[size],
                    isBookmarked && 'fill-current',
                    isLoading && 'animate-pulse'
                )}
            />
            {showLabel && (
                <span className="font-medium">
                    {isBookmarked ? 'Saved' : 'Save'}
                </span>
            )}
        </button>
    );
}
