import { db } from '../lib/firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { generateTransactionId } from './transactionUtils';
import { recalculateProjectStats, recalculateUserStats } from '../lib/dataSyncService';

export async function migrateDonationData() {
    console.log('Starting migration...');
    const report = {
        processed: 0,
        updated: 0,
        errors: 0,
        projectsSynced: 0,
        usersSynced: 0
    };

    try {
        const donationsRef = collection(db, 'backed-projects');
        const snapshot = await getDocs(donationsRef);

        const projectIds = new Set<string>();
        const userIds = new Set<string>();
        const batch = writeBatch(db);
        let batchCount = 0;

        for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            let needsUpdate = false;
            const updates: any = {};

            // 1. Ensure transactionId
            if (!data.transactionId) {
                updates.transactionId = generateTransactionId();
                needsUpdate = true;
            }

            // 2. Ensure status
            if (!data.status) {
                updates.status = 'active';
                needsUpdate = true;
            }

            // 3. Ensure backedAt (if missing, use now or try to infer)
            // Skipping complex inference for now

            if (needsUpdate) {
                const docRef = doc(db, 'backed-projects', docSnapshot.id);
                batch.update(docRef, updates);
                batchCount++;
                report.updated++;
            }

            if (data.projectId) projectIds.add(data.projectId);
            if (data.userId) userIds.add(data.userId);

            report.processed++;

            // Commit batch every 500
            if (batchCount >= 400) {
                await batch.commit();
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        // Sync Projects
        console.log(`Syncing ${projectIds.size} projects...`);
        for (const projectId of projectIds) {
            try {
                await recalculateProjectStats(projectId);
                report.projectsSynced++;
            } catch (e) {
                console.error(`Failed to sync project ${projectId}`, e);
                report.errors++;
            }
        }

        // Sync Users
        console.log(`Syncing ${userIds.size} users...`);
        for (const userId of userIds) {
            try {
                await recalculateUserStats(userId);
                report.usersSynced++;
            } catch (e) {
                console.error(`Failed to sync user ${userId}`, e);
                report.errors++;
            }
        }

        console.log('Migration complete:', report);
        return report;

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}
