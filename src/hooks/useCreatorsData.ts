import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CreatorInfo {
    id: string;
    displayName: string;
    username: string;
    profileImage?: string;
    bio?: string;
    isVerifiedCreator?: boolean;
}

/**
 * Issue #14: Batch fetch multiple creators to avoid N+1 query problem
 * This hook fetches creator data for multiple IDs efficiently (no caching)
 */
export const useCreatorsData = (creatorIds: string[]) => {
    const [creatorsMap, setCreatorsMap] = useState<Map<string, CreatorInfo>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Deduplicate and filter out empty IDs
    const uniqueIds = useMemo(() => {
        return [...new Set(creatorIds.filter(id => id && id.trim() !== ''))];
    }, [creatorIds]);

    useEffect(() => {
        if (uniqueIds.length === 0) {
            setIsLoading(false);
            return;
        }

        const fetchCreators = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const newCreatorsMap = new Map<string, CreatorInfo>();

                // Fetch all creators in parallel
                const fetchPromises = uniqueIds.map(async (creatorId) => {
                    try {
                        const userRef = doc(db, 'users', creatorId);
                        const userDoc = await getDoc(userRef);

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const creatorInfo: CreatorInfo = {
                                id: userDoc.id,
                                displayName: userData.displayName || 'Anonymous User',
                                username: userData.username || '',
                                profileImage: userData.profileImage || userData.photoURL || '',
                                bio: userData.bio || '',
                                isVerifiedCreator: userData.isVerifiedCreator || false
                            };
                            return { id: creatorId, data: creatorInfo };
                        }
                        return { id: creatorId, data: null };
                    } catch (err) {
                        console.warn(`Failed to fetch creator ${creatorId}:`, err);
                        return { id: creatorId, data: null };
                    }
                });

                const results = await Promise.all(fetchPromises);

                for (const result of results) {
                    if (result.data) {
                        newCreatorsMap.set(result.id, result.data);
                    }
                }

                setCreatorsMap(newCreatorsMap);
            } catch (err) {
                console.error('Error fetching creators:', err);
                setError('Failed to load creator info');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCreators();
    }, [uniqueIds]);

    // Helper to get a specific creator
    const getCreator = (creatorId: string): CreatorInfo | undefined => {
        return creatorsMap.get(creatorId);
    };

    return {
        creatorsMap,
        getCreator,
        isLoading,
        error
    };
};
