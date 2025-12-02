import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestoreDonation } from '../types/firestore';

export const useProjectDonations = (projectId: string) => {
    const [donations, setDonations] = useState<FirestoreDonation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        const fetchDonations = async () => {
            try {
                setLoading(true);
                setError(null);

                const donationsRef = collection(db, 'backed-projects');
                const q = query(
                    donationsRef,
                    where('projectId', '==', projectId),
                    orderBy('backedAt', 'desc')
                );

                const snapshot = await getDocs(q);
                const donationsList = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        // Ensure createdAt is available (map backedAt to createdAt if needed)
                        createdAt: data.backedAt || data.createdAt,
                        amount: data.amount || 0,
                        donorId: data.userId,
                        donorName: data.displayName,
                        projectTitle: data.projectTitle // This might not be in backed-projects, but helpful if it is
                    } as FirestoreDonation;
                });

                setDonations(donationsList);
            } catch (err) {
                console.error('Error fetching donations:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch donations');
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, [projectId]);

    return { donations, loading, error };
};
