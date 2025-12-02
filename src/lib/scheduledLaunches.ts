import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Check for scheduled projects that should be launched now
 * This function should be called periodically (e.g., every hour)
 */
export const processScheduledLaunches = async (): Promise<void> => {
  try {
    const now = new Date();
    
    // Query for projects that are approved_scheduled and have a scheduled date in the past
    const q = query(
      collection(db, 'projects'),
      where('status', '==', 'approved_scheduled'),
      where('approvalStatus', '==', 'approved')
    );
    
    const snapshot = await getDocs(q);
    const projectsToLaunch: string[] = [];
    
    snapshot.forEach((docSnapshot) => {
      const project = docSnapshot.data();
      const scheduledDate = project.scheduledDate;
      
      if (scheduledDate) {
        const scheduledDateTime = scheduledDate.toDate ? scheduledDate.toDate() : new Date(scheduledDate);
        
        // If scheduled time has passed, mark for launch
        if (scheduledDateTime <= now) {
          projectsToLaunch.push(docSnapshot.id);
        }
      }
    });
    
    // Launch all projects whose time has come
    const launchPromises = projectsToLaunch.map(async (projectId) => {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: 'active',
        launchedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await Promise.all(launchPromises);
    
    if (projectsToLaunch.length > 0) {
      console.log(`Launched ${projectsToLaunch.length} scheduled projects`);
    }
    
  } catch (error) {
    console.error('Error processing scheduled launches:', error);
  }
};

/**
 * Get the display status for a project considering both approval and launch status
 */
export const getProjectDisplayStatus = (project: any): string => {
  if (project.approvalStatus === 'pending') {
    return 'Pending Admin Approval';
  }
  
  if (project.approvalStatus === 'rejected') {
    return 'Rejected';
  }
  
  if (project.status === 'approved_scheduled') {
    const scheduledDate = project.scheduledDate;
    if (scheduledDate) {
      const scheduledDateTime = scheduledDate.toDate ? scheduledDate.toDate() : new Date(scheduledDate);
      return `Scheduled to launch on ${scheduledDateTime.toLocaleDateString()}`;
    }
    return 'Approved - Scheduled Launch';
  }
  
  // Map other statuses
  switch (project.status) {
    case 'active':
      return 'Live';
    case 'draft':
      return 'Draft';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'pending_verification':
      return 'Pending Verification';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
};

