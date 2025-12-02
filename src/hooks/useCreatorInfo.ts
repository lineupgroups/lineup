import { useState, useEffect } from 'react';
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

export const useCreatorInfo = (creatorId: string) => {
  const [creator, setCreator] = useState<CreatorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreator = async () => {
      if (!creatorId || creatorId.trim() === '') {
        console.warn('No creator ID provided to useCreatorInfo');
        setError('No creator ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const userRef = doc(db, 'users', creatorId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCreator({
            id: userDoc.id,
            displayName: userData.displayName || 'Anonymous User',
            username: userData.username || '',
            profileImage: userData.profileImage || userData.photoURL || '',
            bio: userData.bio || '',
            isVerifiedCreator: userData.isVerifiedCreator || false
          });
        } else {
          console.warn(`Creator with ID ${creatorId} not found in Firestore`);
          setCreator(null);
          setError('Creator not found');
        }
      } catch (err) {
        console.error('Error fetching creator:', err);
        setError('Failed to load creator info');
        setCreator(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreator();
  }, [creatorId]);

  return {
    creator,
    isLoading,
    error
  };
};
