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
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import {
  FirestoreReport,
  CreateReportData,
  FirestoreProject,
  FirestoreUser
} from '../types/firestore';
import { logAdminAction } from './adminActions';

const REPORTS_COLLECTION = 'reports';
const PROJECTS_COLLECTION = 'projects';
const USERS_COLLECTION = 'users';
const KEYWORD_FLAGS_COLLECTION = 'keyword-flags';

// Default flagged keywords (can be managed by admin later)
const DEFAULT_FLAGGED_KEYWORDS = [
  // Spam
  { keyword: 'click here', category: 'spam' as const, severity: 'low' as const },
  { keyword: 'guaranteed profit', category: 'spam' as const, severity: 'medium' as const },
  { keyword: 'make money fast', category: 'spam' as const, severity: 'medium' as const },
  
  // Fraud
  { keyword: 'guaranteed returns', category: 'fraud' as const, severity: 'high' as const },
  { keyword: 'investment scheme', category: 'fraud' as const, severity: 'high' as const },
  { keyword: 'pyramid', category: 'fraud' as const, severity: 'critical' as const },
  { keyword: 'ponzi', category: 'fraud' as const, severity: 'critical' as const },
  
  // Inappropriate
  { keyword: 'explicit', category: 'inappropriate' as const, severity: 'high' as const },
  { keyword: 'adult content', category: 'inappropriate' as const, severity: 'high' as const },
  
  // Harassment
  { keyword: 'hate speech', category: 'harassment' as const, severity: 'critical' as const },
  { keyword: 'threatening', category: 'harassment' as const, severity: 'critical' as const }
];

// Check content for flagged keywords
export const checkForFlaggedKeywords = (content: string): {
  isFlagged: boolean;
  keywords: string[];
  maxSeverity: 'low' | 'medium' | 'high' | 'critical';
} => {
  const lowerContent = content.toLowerCase();
  const foundKeywords: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };

  DEFAULT_FLAGGED_KEYWORDS.forEach((flag) => {
    if (lowerContent.includes(flag.keyword)) {
      foundKeywords.push(flag.keyword);
      if (severityRank[flag.severity] > severityRank[maxSeverity]) {
        maxSeverity = flag.severity;
      }
    }
  });

  return {
    isFlagged: foundKeywords.length > 0,
    keywords: foundKeywords,
    maxSeverity
  };
};

// Calculate priority based on factors
const calculatePriority = (
  category: FirestoreReport['category'],
  autoFlagged: boolean,
  severity?: 'low' | 'medium' | 'high' | 'critical'
): FirestoreReport['priority'] => {
  if (autoFlagged && severity === 'critical') return 'critical';
  if (category === 'fraud' || category === 'harassment') return 'high';
  if (autoFlagged && severity === 'high') return 'high';
  if (category === 'inappropriate_content' || category === 'misinformation') return 'medium';
  return 'low';
};

// ==================== CREATE REPORT ====================

// Report a project
export const reportProject = async (
  projectId: string,
  reportedBy: string,
  reporterName: string,
  reporterEmail: string,
  category: FirestoreReport['category'],
  description: string
): Promise<string> => {
  try {
    // Get project details
    const projectDoc = await getDoc(doc(db, PROJECTS_COLLECTION, projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const project = projectDoc.data() as FirestoreProject;

    // Check if content is auto-flagged
    const contentToCheck = `${project.title} ${project.description} ${project.fullDescription}`;
    const flagCheck = checkForFlaggedKeywords(contentToCheck);

    const priority = calculatePriority(
      category,
      flagCheck.isFlagged,
      flagCheck.maxSeverity
    );

    const reportData: CreateReportData = {
      reportType: 'project',
      targetId: projectId,
      targetType: 'project',
      reportedBy,
      reporterName,
      reporterEmail,
      category,
      description,
      status: 'pending',
      priority,
      autoFlagged: flagCheck.isFlagged,
      flaggedKeywords: flagCheck.keywords.length > 0 ? flagCheck.keywords : undefined,
      projectTitle: project.title
    };

    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...reportData,
      createdAt: serverTimestamp()
    });

    // Increment report count on project
    await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
      reportCount: increment(1)
    });

    return docRef.id;
  } catch (error) {
    console.error('Error reporting project:', error);
    throw new Error(`Failed to report project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Report a user
export const reportUser = async (
  userId: string,
  reportedBy: string,
  reporterName: string,
  reporterEmail: string,
  category: FirestoreReport['category'],
  description: string
): Promise<string> => {
  try {
    // Get user details
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const user = userDoc.data() as FirestoreUser;

    // Check if description contains flagged keywords
    const flagCheck = checkForFlaggedKeywords(description);

    const priority = calculatePriority(
      category,
      flagCheck.isFlagged,
      flagCheck.maxSeverity
    );

    const reportData: CreateReportData = {
      reportType: 'user',
      targetId: userId,
      targetType: 'user',
      reportedBy,
      reporterName,
      reporterEmail,
      category,
      description,
      status: 'pending',
      priority,
      autoFlagged: flagCheck.isFlagged,
      flaggedKeywords: flagCheck.keywords.length > 0 ? flagCheck.keywords : undefined,
      userName: user.displayName
    };

    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...reportData,
      createdAt: serverTimestamp()
    });

    // Increment report count on user
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      reportCount: increment(1)
    });

    return docRef.id;
  } catch (error) {
    console.error('Error reporting user:', error);
    throw new Error(`Failed to report user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ==================== GET REPORTS ====================

// Get all reports
export const getAllReports = async (): Promise<FirestoreReport[]> => {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const reports: FirestoreReport[] = [];

    snapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as FirestoreReport);
    });

    return reports;
  } catch (error) {
    console.error('Error fetching all reports:', error);
    throw new Error('Failed to fetch reports');
  }
};

// Get reports by status
export const getReportsByStatus = async (
  status: FirestoreReport['status']
): Promise<FirestoreReport[]> => {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const reports: FirestoreReport[] = [];

    snapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as FirestoreReport);
    });

    return reports;
  } catch (error) {
    console.error('Error fetching reports by status:', error);
    return [];
  }
};

// Get reports by priority
export const getReportsByPriority = async (
  priority: FirestoreReport['priority']
): Promise<FirestoreReport[]> => {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('priority', '==', priority),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const reports: FirestoreReport[] = [];

    snapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as FirestoreReport);
    });

    return reports;
  } catch (error) {
    console.error('Error fetching reports by priority:', error);
    return [];
  }
};

// Get auto-flagged reports
export const getAutoFlaggedReports = async (): Promise<FirestoreReport[]> => {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('autoFlagged', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const reports: FirestoreReport[] = [];

    snapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as FirestoreReport);
    });

    return reports;
  } catch (error) {
    console.error('Error fetching auto-flagged reports:', error);
    return [];
  }
};

// Get reports for a specific target
export const getReportsForTarget = async (
  targetType: 'project' | 'user' | 'comment',
  targetId: string
): Promise<FirestoreReport[]> => {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const reports: FirestoreReport[] = [];

    snapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as FirestoreReport);
    });

    return reports;
  } catch (error) {
    console.error('Error fetching reports for target:', error);
    return [];
  }
};

// ==================== RESOLVE REPORTS ====================

// Update report status
export const updateReportStatus = async (
  reportId: string,
  status: FirestoreReport['status'],
  adminId: string
): Promise<void> => {
  try {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'reviewing') {
      updateData.reviewedBy = adminId;
      updateData.reviewedAt = serverTimestamp();
    }

    await updateDoc(reportRef, updateData);
  } catch (error) {
    console.error('Error updating report status:', error);
    throw new Error('Failed to update report status');
  }
};

// Resolve report with action
export const resolveReport = async (
  reportId: string,
  resolution: string,
  actionTaken: FirestoreReport['actionTaken'],
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }

    const report = reportDoc.data() as FirestoreReport;

    await updateDoc(reportRef, {
      status: 'resolved',
      resolution,
      actionTaken,
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'resolve_report',
      targetType: 'report',
      targetId: reportId,
      targetName: `Report #${reportId.substring(0, 8)}`,
      details: `Report resolved: ${resolution}`,
      metadata: {
        actionTaken,
        reportCategory: report.category,
        targetType: report.targetType,
        targetId: report.targetId
      }
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    throw new Error('Failed to resolve report');
  }
};

// Dismiss report
export const dismissReport = async (
  reportId: string,
  reason: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  try {
    const reportRef = doc(db, REPORTS_COLLECTION, reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }

    const report = reportDoc.data() as FirestoreReport;

    await updateDoc(reportRef, {
      status: 'dismissed',
      resolution: reason,
      actionTaken: 'none',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log admin action
    await logAdminAction({
      adminId,
      adminEmail,
      action: 'resolve_report',
      targetType: 'report',
      targetId: reportId,
      targetName: `Report #${reportId.substring(0, 8)}`,
      details: `Report dismissed: ${reason}`,
      metadata: {
        actionTaken: 'none',
        reportCategory: report.category
      }
    });
  } catch (error) {
    console.error('Error dismissing report:', error);
    throw new Error('Failed to dismiss report');
  }
};

// ==================== STATISTICS ====================

// Get report statistics
export const getReportStatistics = async (): Promise<{
  total: number;
  pending: number;
  reviewing: number;
  resolved: number;
  dismissed: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byCategory: {
    [key: string]: number;
  };
  autoFlagged: number;
}> => {
  try {
    const reports = await getAllReports();

    const stats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      reviewing: reports.filter(r => r.status === 'reviewing').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      dismissed: reports.filter(r => r.status === 'dismissed').length,
      byPriority: {
        low: reports.filter(r => r.priority === 'low').length,
        medium: reports.filter(r => r.priority === 'medium').length,
        high: reports.filter(r => r.priority === 'high').length,
        critical: reports.filter(r => r.priority === 'critical').length
      },
      byCategory: {} as { [key: string]: number },
      autoFlagged: reports.filter(r => r.autoFlagged).length
    };

    // Count by category
    reports.forEach(report => {
      stats.byCategory[report.category] = (stats.byCategory[report.category] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting report statistics:', error);
    return {
      total: 0,
      pending: 0,
      reviewing: 0,
      resolved: 0,
      dismissed: 0,
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      byCategory: {},
      autoFlagged: 0
    };
  }
};


