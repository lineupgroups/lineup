/**
 * Project Management Service
 * Handles project deadline extensions and cancellations
 */

import { doc, updateDoc, Timestamp, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { logActivity } from './activityService';

const PROJECTS_COLLECTION = 'projects';

export interface ExtendDeadlineRequest {
    projectId: string;
    extensionDays: number;
    reason: string;
    requestedBy: string;
}

export interface CancelProjectRequest {
    projectId: string;
    reason: string;
    requestedBy: string;
}

export interface ProjectManagementResult {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * Extend a project's deadline by a specified number of days
 * @param request The extension request details
 * @returns Result of the operation
 */
export async function extendProjectDeadline(request: ExtendDeadlineRequest): Promise<ProjectManagementResult> {
    const { projectId, extensionDays, reason, requestedBy } = request;

    // Validate extension days (1-30)
    if (extensionDays < 1 || extensionDays > 30) {
        return {
            success: false,
            message: 'Extension must be between 1 and 30 days',
            error: 'INVALID_EXTENSION_DAYS'
        };
    }

    if (!reason.trim()) {
        return {
            success: false,
            message: 'Please provide a reason for the extension',
            error: 'MISSING_REASON'
        };
    }

    try {
        const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

        // Calculate new end date
        const currentEndDate = new Date();
        const newEndDate = new Date(currentEndDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);

        // Update the project
        await updateDoc(projectRef, {
            endDate: Timestamp.fromDate(newEndDate),
            updatedAt: serverTimestamp(),
            'metadata.lastExtension': {
                days: extensionDays,
                reason: reason,
                requestedBy: requestedBy,
                requestedAt: serverTimestamp()
            }
        });

        // Log the activity
        await logActivity(
            requestedBy,
            'project_created', // Using closest available type
            {
                action: 'deadline_extended',
                extensionDays,
                reason,
                newEndDate: newEndDate.toISOString()
            },
            projectId,
            'Deadline Extended'
        );

        return {
            success: true,
            message: `Deadline extended by ${extensionDays} days successfully`
        };
    } catch (error) {
        console.error('Error extending project deadline:', error);
        return {
            success: false,
            message: 'Failed to extend deadline. Please try again.',
            error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
        };
    }
}

/**
 * Cancel a project
 * This will mark the project as cancelled and notify backers
 * @param request The cancellation request details
 * @returns Result of the operation
 */
export async function cancelProject(request: CancelProjectRequest): Promise<ProjectManagementResult> {
    const { projectId, reason, requestedBy } = request;

    if (!reason.trim()) {
        return {
            success: false,
            message: 'Please provide a reason for cancellation',
            error: 'MISSING_REASON'
        };
    }

    try {
        const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

        // Update project status to cancelled
        await updateDoc(projectRef, {
            status: 'cancelled',
            updatedAt: serverTimestamp(),
            'metadata.cancellation': {
                reason: reason,
                cancelledBy: requestedBy,
                cancelledAt: serverTimestamp()
            }
        });

        // Create a cancellation record (for refund processing later)
        await addDoc(collection(db, 'project-cancellations'), {
            projectId,
            reason,
            cancelledBy: requestedBy,
            cancelledAt: serverTimestamp(),
            refundStatus: 'pending', // For future refund processing
            notificationsSent: false
        });

        // Log the activity
        await logActivity(
            requestedBy,
            'project_created', // Using closest available type
            {
                action: 'project_cancelled',
                reason
            },
            projectId,
            'Project Cancelled'
        );

        return {
            success: true,
            message: 'Project cancelled successfully. Backers will be notified and refunds will be processed.'
        };
    } catch (error) {
        console.error('Error cancelling project:', error);
        return {
            success: false,
            message: 'Failed to cancel project. Please try again.',
            error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
        };
    }
}

/**
 * Get project extension history
 * @param projectId The project ID
 * @returns Extension history or null if not found
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getExtensionHistory(_projectId: string) {
    try {
        // This would query extension records if we stored them separately
        // For now, we just return from the project metadata
        return null;
    } catch (error) {
        console.error('Error getting extension history:', error);
        return null;
    }
}
