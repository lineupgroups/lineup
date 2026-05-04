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
                    'inline-flex items-center gap-2 rounded-xl border transition-all duration-300',
                    'bg-neutral-800/50 border-neutral-700 text-neutral-500',
                    buttonSizeClasses[size],
                    className
                )}
            >
                <div className={cn(sizeClasses[size], 'animate-pulse bg-neutral-700 rounded')} />
                {showLabel && <span className="font-bold">Save</span>}
            </button>
        );
    }

    return (
        <button
            onClick={handleToggleBookmark}
            disabled={isLoading}
            aria-label={isBookmarked ? 'Remove from saved projects' : 'Save project for later'}
            className={cn(
                'inline-flex items-center gap-2 rounded-xl border transition-all duration-300',
                'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-orange/50',
                isBookmarked
                    ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange shadow-[0_0_10px_rgba(255,91,0,0.1)]'
                    : 'bg-white/5 border-neutral-700 text-neutral-400 hover:bg-white/10 hover:border-neutral-600 hover:text-brand-white',
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
                <span className="font-bold">
                    {isBookmarked ? 'Saved' : 'Save'}
                </span>
            )}
        </button>
    );
}
