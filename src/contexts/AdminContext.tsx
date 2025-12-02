import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { isAdminUser, hasAdminPermission, AdminAction } from '../config/admin';
import { FirestoreProject, FirestoreUser } from '../types/firestore';
import toast from 'react-hot-toast';

interface AdminContextType {
  isAdmin: boolean;
  pendingProjects: FirestoreProject[];
  allProjects: FirestoreProject[];
  allUsers: FirestoreUser[];
  loading: boolean;
  approveProject: (projectId: string, reason?: string) => Promise<void>;
  rejectProject: (projectId: string, reason: string) => Promise<void>;
  hasPermission: (action: AdminAction) => boolean;
  refreshData: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: React.ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [pendingProjects, setPendingProjects] = useState<FirestoreProject[]>([]);
  const [allProjects, setAllProjects] = useState<FirestoreProject[]>([]);
  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = isAdminUser(user?.email);

  // Check if admin has specific permission
  const hasPermission = (action: AdminAction): boolean => {
    return hasAdminPermission(user?.email, action);
  };

  // Approve a project
  const approveProject = async (projectId: string, reason?: string) => {
    if (!isAdmin || !user) {
      toast.error('Unauthorized action');
      return;
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      
      // First, get the project to check its launch settings
      const projectDoc = await getDoc(projectRef);
      if (!projectDoc.exists()) {
        toast.error('Project not found');
        return;
      }
      
      const projectData = projectDoc.data();
      const launchType = projectData.launchType || 'immediate';
      const scheduledDate = projectData.scheduledDate;
      
      let newStatus = 'active';
      let successMessage = 'Project approved and launched successfully!';
      
      // Handle different launch types
      if (launchType === 'scheduled' && scheduledDate) {
        const scheduledDateTime = scheduledDate.toDate ? scheduledDate.toDate() : new Date(scheduledDate);
        const now = new Date();
        
        if (scheduledDateTime > now) {
          // Future scheduled launch - keep as approved but not active yet
          newStatus = 'approved_scheduled';
          successMessage = `Project approved! Will launch automatically on ${scheduledDateTime.toLocaleDateString()}`;
        } else {
          // Scheduled date is in the past or now - launch immediately
          newStatus = 'active';
          successMessage = 'Project approved and launched successfully!';
        }
      }
      // For immediate launch, always set to active
      
      await updateDoc(projectRef, {
        approvalStatus: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: user.uid,
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      toast.success(successMessage);
    } catch (error) {
      console.error('Error approving project:', error);
      toast.error('Failed to approve project');
      throw error;
    }
  };

  // Reject a project
  const rejectProject = async (projectId: string, reason: string) => {
    if (!isAdmin || !user) {
      toast.error('Unauthorized action');
      return;
    }

    if (!reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        approvalStatus: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: user.uid,
        rejectionReason: reason,
        status: 'rejected', // Set project status to rejected
        updatedAt: serverTimestamp()
      });

      toast.success('Project rejected');
    } catch (error) {
      console.error('Error rejecting project:', error);
      toast.error('Failed to reject project');
      throw error;
    }
  };

  // Refresh all admin data
  const refreshData = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      // This will trigger the real-time listeners to refresh
      // The actual data fetching is handled by the useEffect hooks
    } catch (error) {
      console.error('Error refreshing admin data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Listen for pending projects (real-time)
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'projects'),
      where('approvalStatus', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects: FirestoreProject[] = [];
      snapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() } as FirestoreProject);
      });
      setPendingProjects(projects);
    }, (error) => {
      console.error('Error listening to pending projects:', error);
    });

    return unsubscribe;
  }, [isAdmin]);

  // Listen for all projects (real-time)
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'projects'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects: FirestoreProject[] = [];
      snapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() } as FirestoreProject);
      });
      setAllProjects(projects);
    }, (error) => {
      console.error('Error listening to all projects:', error);
    });

    return unsubscribe;
  }, [isAdmin]);

  // Fetch all users (not real-time to avoid performance issues)
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const users: FirestoreUser[] = [];
        snapshot.forEach((doc) => {
          users.push({ uid: doc.id, ...doc.data() } as FirestoreUser);
        });
        setAllUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const value: AdminContextType = {
    isAdmin,
    pendingProjects,
    allProjects,
    allUsers,
    loading,
    approveProject,
    rejectProject,
    hasPermission,
    refreshData
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
