import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import {
  FirestoreProject,
  FirestoreUser,
  FirestoreReport,
  FirestoreActivityLog,
  FirestoreAdminLog,
  AdminChangeRequest,
  CreateAdminLogData
} from '../types/firestore';

// Collection names
const PROJECTS_COLLECTION = 'projects';
const USERS_COLLECTION = 'users';
const REPORTS_COLLECTION = 'reports';
const ACTIVITY_LOGS_COLLECTION = 'activity-logs';
const ADMIN_LOGS_COLLECTION = 'admin-logs';
const NOTIFICATIONS_COLLECTION = 'notifications';

// ==================== PROJECT ACTIONS ====================

// Toggle featured status
export const toggleFeaturedProject = async (
  projectId: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const project = projectDoc.data() as FirestoreProject;
    const newFeaturedStatus = !project.featured;

    await updateDoc(projectRef, {
      featured: newFeaturedStatus,
      updatedAt: serverTimestamp()
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: newFeaturedStatus ? 'feature_project' : 'unfeature_project',
      targetType: 'project',
      targetId: projectId,
      targetName: project.title,
      details: `Project ${newFeaturedStatus ? 'featured' : 'unfeatured'}`,
      metadata: {
        previousStatus: project.featured.toString(),
        newStatus: newFeaturedStatus.toString()
      }
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    throw new Error(`Failed to toggle featured status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Suspend project
export const suspendProject = async (
  projectId: string,
  reason: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const project = projectDoc.data() as FirestoreProject;

    await updateDoc(projectRef, {
      status: 'suspended',
      suspendedAt: serverTimestamp(),
      suspendedBy: adminId,
      suspensionReason: reason,
      updatedAt: serverTimestamp()
    });

    // Notify creator
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: project.creatorId,
      type: 'admin_action',
      title: 'Project Suspended',
      message: `Your project "${project.title}" has been suspended. Reason: ${reason}`,
      projectId,
      projectTitle: project.title,
      createdAt: serverTimestamp(),
      read: false
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'suspend_project',
      targetType: 'project',
      targetId: projectId,
      targetName: project.title,
      details: `Project suspended: ${reason}`,
      metadata: {
        reason,
        previousStatus: project.status
      }
    });
  } catch (error) {
    console.error('Error suspending project:', error);
    throw new Error(`Failed to suspend project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Reactivate project
export const reactivateProject = async (
  projectId: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const project = projectDoc.data() as FirestoreProject;

    await updateDoc(projectRef, {
      status: 'active',
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
      updatedAt: serverTimestamp()
    });

    // Notify creator
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: project.creatorId,
      type: 'admin_action',
      title: 'Project Reactivated',
      message: `Your project "${project.title}" has been reactivated and is now live.`,
      projectId,
      projectTitle: project.title,
      createdAt: serverTimestamp(),
      read: false
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'reactivate_project',
      targetType: 'project',
      targetId: projectId,
      targetName: project.title,
      details: 'Project reactivated',
      metadata: {
        previousStatus: project.status
      }
    });
  } catch (error) {
    console.error('Error reactivating project:', error);
    throw new Error(`Failed to reactivate project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Request changes from creator
export const requestProjectChanges = async (
  projectId: string,
  message: string,
  field: string | undefined,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const project = projectDoc.data() as FirestoreProject;

    // Create change request
    const changeRequest: AdminChangeRequest = {
      id: `req_${Date.now()}`,
      requestedBy: adminId,
      requestedAt: Timestamp.now(),
      message,
      field,
      status: 'pending'
    };

    // Add to project's change requests
    await updateDoc(projectRef, {
      adminChangeRequests: arrayUnion(changeRequest),
      updatedAt: serverTimestamp()
    });

    // Send notification to creator (in-app)
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId: project.creatorId,
      type: 'admin_action',
      title: 'Changes Requested',
      message: `Admin has requested changes to your project "${project.title}": ${message}`,
      projectId,
      projectTitle: project.title,
      createdAt: serverTimestamp(),
      read: false,
      actionUrl: `/creator/projects/${projectId}/edit`
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'request_changes',
      targetType: 'project',
      targetId: projectId,
      targetName: project.title,
      details: `Changes requested: ${message}`,
      metadata: {
        field,
        message
      }
    });

    // TODO: Send email notification (will be implemented later)
    console.log('Email notification will be sent to:', project.creatorId);
  } catch (error) {
    console.error('Error requesting project changes:', error);
    throw new Error(`Failed to request changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ==================== USER ACTIONS ====================

// Suspend user
export const suspendUser = async (
  userId: string,
  reason: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const user = userDoc.data() as FirestoreUser;

    await updateDoc(userRef, {
      isSuspended: true,
      suspendedAt: serverTimestamp(),
      suspendedBy: adminId,
      suspensionReason: reason,
      updatedAt: serverTimestamp()
    });

    // Notify user
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type: 'admin_action',
      title: 'Account Suspended',
      message: `Your account has been suspended. Reason: ${reason}`,
      createdAt: serverTimestamp(),
      read: false
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'suspend_user',
      targetType: 'user',
      targetId: userId,
      targetName: user.displayName,
      details: `User suspended: ${reason}`,
      metadata: { reason }
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    throw new Error(`Failed to suspend user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Ban user (permanent)
export const banUser = async (
  userId: string,
  reason: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const user = userDoc.data() as FirestoreUser;

    await updateDoc(userRef, {
      isBanned: true,
      bannedAt: serverTimestamp(),
      bannedBy: adminId,
      banReason: reason,
      isSuspended: false, // Ban overrides suspension
      updatedAt: serverTimestamp()
    });

    // Notify user
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type: 'admin_action',
      title: 'Account Banned',
      message: `Your account has been permanently banned. Reason: ${reason}`,
      createdAt: serverTimestamp(),
      read: false
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'ban_user',
      targetType: 'user',
      targetId: userId,
      targetName: user.displayName,
      details: `User banned: ${reason}`,
      metadata: { reason }
    });
  } catch (error) {
    console.error('Error banning user:', error);
    throw new Error(`Failed to ban user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Unban user
export const unbanUser = async (
  userId: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const user = userDoc.data() as FirestoreUser;

    await updateDoc(userRef, {
      isBanned: false,
      bannedAt: null,
      bannedBy: null,
      banReason: null,
      isSuspended: false,
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
      updatedAt: serverTimestamp()
    });

    // Notify user
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type: 'admin_action',
      title: 'Account Restored',
      message: 'Your account has been restored and is now active.',
      createdAt: serverTimestamp(),
      read: false
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'unban_user',
      targetType: 'user',
      targetId: userId,
      targetName: user.displayName,
      details: 'User unbanned and restored'
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw new Error(`Failed to unban user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Verify creator
export const verifyCreator = async (
  userId: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const user = userDoc.data() as FirestoreUser;

    await updateDoc(userRef, {
      isVerifiedCreator: true,
      verifiedAt: serverTimestamp(),
      verifiedBy: adminId,
      updatedAt: serverTimestamp()
    });

    // Notify user
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type: 'admin_action',
      title: 'Creator Verified! 🎉',
      message: 'Congratulations! Your creator account has been verified.',
      createdAt: serverTimestamp(),
      read: false
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'verify_creator',
      targetType: 'user',
      targetId: userId,
      targetName: user.displayName,
      details: 'Creator verified'
    });
  } catch (error) {
    console.error('Error verifying creator:', error);
    throw new Error(`Failed to verify creator: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Unverify creator
export const unverifyCreator = async (
  userId: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const user = userDoc.data() as FirestoreUser;

    await updateDoc(userRef, {
      isVerifiedCreator: false,
      verifiedAt: null,
      verifiedBy: null,
      updatedAt: serverTimestamp()
    });

    // Notify user
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type: 'admin_action',
      title: 'Verification Removed',
      message: 'Your creator verification has been removed.',
      createdAt: serverTimestamp(),
      read: false
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'unverify_creator',
      targetType: 'user',
      targetId: userId,
      targetName: user.displayName,
      details: 'Creator verification removed'
    });
  } catch (error) {
    console.error('Error unverifying creator:', error);
    throw new Error(`Failed to unverify creator: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ==================== ACTIVITY LOGS ====================

// Get user activity logs
export const getUserActivityLogs = async (
  userId: string,
  limitCount: number = 50
): Promise<FirestoreActivityLog[]> => {
  try {
    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      // limit(limitCount) // Commented out until index is created
    );

    const snapshot = await getDocs(q);
    const logs: FirestoreActivityLog[] = [];

    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as FirestoreActivityLog);
    });

    return logs.slice(0, limitCount); // Manual limit until index is created
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    // Return empty array if index doesn't exist yet
    return [];
  }
};

// Log user activity
export const logUserActivity = async (
  userId: string,
  userName: string,
  activityType: FirestoreActivityLog['activityType'],
  description: string,
  metadata?: FirestoreActivityLog['metadata']
): Promise<void> => {
  try {
    await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), {
      userId,
      userName,
      activityType,
      description,
      metadata,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    // Don't throw error for activity logging failures
    console.error('Error logging activity:', error);
  }
};

// ==================== ADMIN LOGS ====================

// Log admin action
export const logAdminAction = async (data: CreateAdminLogData): Promise<void> => {
  try {
    await addDoc(collection(db, ADMIN_LOGS_COLLECTION), {
      ...data,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw error for log failures
  }
};

// Get admin action logs
export const getAdminLogs = async (limitCount: number = 100): Promise<FirestoreAdminLog[]> => {
  try {
    const q = query(
      collection(db, ADMIN_LOGS_COLLECTION),
      orderBy('createdAt', 'desc')
      // limit(limitCount) // Commented out until needed
    );

    const snapshot = await getDocs(q);
    const logs: FirestoreAdminLog[] = [];

    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as FirestoreAdminLog);
    });

    return logs.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }
};

// Get admin logs by target
export const getAdminLogsByTarget = async (
  targetType: 'project' | 'user' | 'report',
  targetId: string
): Promise<FirestoreAdminLog[]> => {
  try {
    const q = query(
      collection(db, ADMIN_LOGS_COLLECTION),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const logs: FirestoreAdminLog[] = [];

    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as FirestoreAdminLog);
    });

    return logs;
  } catch (error) {
    console.error('Error fetching admin logs by target:', error);
    return [];
  }
};


