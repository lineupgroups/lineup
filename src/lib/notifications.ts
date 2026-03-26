import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  FirestoreNotification,
  CreateNotificationData
} from '../types/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

// Create a new notification
export const createNotification = async (
  notificationData: CreateNotificationData
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
};

// Get notifications for a user
export const getUserNotifications = async (
  userId: string,
  limitCount: number = 50
): Promise<FirestoreNotification[]> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreNotification[];
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw new Error('Failed to get notifications');
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: serverTimestamp()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};

// Helper functions to create specific notification types

export const createNewSupporterNotification = async (
  creatorId: string,
  projectId: string,
  projectTitle: string,
  supporterName: string,
  amount: number
): Promise<void> => {
  await createNotification({
    userId: creatorId,
    type: 'new_supporter',
    title: 'New Donation! 🎉',
    message: `${supporterName} donated ₹${amount.toLocaleString('en-IN')} to ${projectTitle}`,
    projectId,
    projectTitle,
    relatedUserName: supporterName,
    actionUrl: `/dashboard/projects/${projectId}/supporters`
  });
};

export const createMilestoneNotification = async (
  creatorId: string,
  projectId: string,
  projectTitle: string,
  milestonePercentage: number
): Promise<void> => {
  await createNotification({
    userId: creatorId,
    type: 'milestone',
    title: `${milestonePercentage}% Funded! 🎯`,
    message: `Congratulations! ${projectTitle} has reached ${milestonePercentage}% of its funding goal.`,
    projectId,
    projectTitle,
    actionUrl: `/dashboard/projects/${projectId}/analytics`
  });
};

export const createProjectFundedNotification = async (
  creatorId: string,
  projectId: string,
  projectTitle: string
): Promise<void> => {
  await createNotification({
    userId: creatorId,
    type: 'project_funded',
    title: '100% Funded! 🎊',
    message: `Amazing! ${projectTitle} has reached its funding goal!`,
    projectId,
    projectTitle,
    actionUrl: `/dashboard/projects/${projectId}`
  });
};

export const createProjectEndingNotification = async (
  creatorId: string,
  projectId: string,
  projectTitle: string,
  daysLeft: number
): Promise<void> => {
  await createNotification({
    userId: creatorId,
    type: 'project_ending',
    title: `${daysLeft} Days Left ⏰`,
    message: `${projectTitle} is ending in ${daysLeft} days. Time to push for the final stretch!`,
    projectId,
    projectTitle,
    actionUrl: `/dashboard/projects/${projectId}`
  });
};

export const createCommentNotification = async (
  creatorId: string,
  projectId: string,
  projectTitle: string,
  commenterName: string,
  commenterId: string
): Promise<void> => {
  await createNotification({
    userId: creatorId,
    type: 'comment',
    title: 'New Comment 💬',
    message: `${commenterName} commented on ${projectTitle}`,
    projectId,
    projectTitle,
    relatedUserId: commenterId,
    relatedUserName: commenterName,
    actionUrl: `/project/${projectId}#comments`
  });
};

export const createProjectUpdateNotification = async (
  supporterId: string,
  projectId: string,
  projectTitle: string,
  updateTitle: string
): Promise<void> => {
  await createNotification({
    userId: supporterId,
    type: 'project_update',
    title: 'New Project Update 📢',
    message: `${projectTitle}: ${updateTitle}`,
    projectId,
    projectTitle,
    actionUrl: `/project/${projectId}/updates`
  });
};

// ===== Update Comment Notifications =====

// Notify creator when someone comments on their update
export const createUpdateCommentNotification = async (
  creatorId: string,
  projectId: string,
  projectTitle: string,
  updateId: string,
  updateTitle: string,
  commenterName: string,
  commenterId: string
): Promise<void> => {
  // Don't notify if creator is commenting on their own update
  if (creatorId === commenterId) return;

  await createNotification({
    userId: creatorId,
    type: 'update_comment',
    title: 'New Comment on Update 💬',
    message: `${commenterName} commented on "${updateTitle}"`,
    projectId,
    projectTitle,
    updateId,
    updateTitle,
    relatedUserId: commenterId,
    relatedUserName: commenterName,
    actionUrl: `/dashboard/updates`
  });
};

// Notify user when creator replies to their update comment
export const createUpdateCommentReplyNotification = async (
  originalCommenterId: string,
  creatorName: string,
  creatorId: string,
  projectId: string,
  projectTitle: string,
  updateId: string,
  updateTitle: string
): Promise<void> => {
  // Don't notify if creator is replying to themselves
  if (originalCommenterId === creatorId) return;

  await createNotification({
    userId: originalCommenterId,
    type: 'update_comment_reply',
    title: 'Creator Replied! 💬',
    message: `${creatorName} replied to your comment on "${updateTitle}"`,
    projectId,
    projectTitle,
    updateId,
    updateTitle,
    relatedUserId: creatorId,
    relatedUserName: creatorName,
    actionUrl: `/project/${projectId}#updates`
  });
};

// Notify user when creator hearts their update comment
export const createUpdateCommentHeartNotification = async (
  commenterId: string,
  creatorName: string,
  creatorId: string,
  projectId: string,
  projectTitle: string,
  updateId: string,
  updateTitle: string
): Promise<void> => {
  // Don't notify if creator is hearting their own comment (shouldn't happen, but safeguard)
  if (commenterId === creatorId) return;

  await createNotification({
    userId: commenterId,
    type: 'update_comment_heart',
    title: 'Creator Loved Your Comment! ❤️',
    message: `${creatorName} loved your comment on "${updateTitle}"`,
    projectId,
    projectTitle,
    updateId,
    updateTitle,
    relatedUserId: creatorId,
    relatedUserName: creatorName,
    actionUrl: `/project/${projectId}#updates`
  });
};
