import { useState, useEffect, useCallback } from 'react';
import {
  getAllReports,
  getReportsByStatus,
  getReportsByPriority,
  getAutoFlaggedReports,
  getReportsForTarget,
  updateReportStatus,
  resolveReport,
  dismissReport,
  getReportStatistics,
  reportProject,
  reportUser
} from '../lib/reports';
import { FirestoreReport } from '../types/firestore';
import toast from 'react-hot-toast';

export const useReports = () => {
  const [reports, setReports] = useState<FirestoreReport[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allReports, stats] = await Promise.all([
        getAllReports(),
        getReportStatistics()
      ]);
      setReports(allReports);
      setStatistics(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Submit a report
  const submitProjectReport = async (
    projectId: string,
    reportedBy: string,
    reporterName: string,
    reporterEmail: string,
    category: FirestoreReport['category'],
    description: string
  ): Promise<boolean> => {
    try {
      await reportProject(projectId, reportedBy, reporterName, reporterEmail, category, description);
      toast.success('Report submitted successfully');
      await fetchReports(); // Refresh reports
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit report';
      toast.error(message);
      return false;
    }
  };

  const submitUserReport = async (
    userId: string,
    reportedBy: string,
    reporterName: string,
    reporterEmail: string,
    category: FirestoreReport['category'],
    description: string
  ): Promise<boolean> => {
    try {
      await reportUser(userId, reportedBy, reporterName, reporterEmail, category, description);
      toast.success('Report submitted successfully');
      await fetchReports(); // Refresh reports
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit report';
      toast.error(message);
      return false;
    }
  };

  // Update report status
  const handleUpdateStatus = async (
    reportId: string,
    status: FirestoreReport['status'],
    adminId: string
  ): Promise<boolean> => {
    try {
      await updateReportStatus(reportId, status, adminId);
      toast.success('Report status updated');
      await fetchReports(); // Refresh reports
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update report';
      toast.error(message);
      return false;
    }
  };

  // Resolve report
  const handleResolveReport = async (
    reportId: string,
    resolution: string,
    actionTaken: FirestoreReport['actionTaken'],
    adminId: string,
    adminEmail: string
  ): Promise<boolean> => {
    try {
      await resolveReport(reportId, resolution, actionTaken, adminId, adminEmail);
      toast.success('Report resolved');
      await fetchReports(); // Refresh reports
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve report';
      toast.error(message);
      return false;
    }
  };

  // Dismiss report
  const handleDismissReport = async (
    reportId: string,
    reason: string,
    adminId: string,
    adminEmail: string
  ): Promise<boolean> => {
    try {
      await dismissReport(reportId, reason, adminId, adminEmail);
      toast.success('Report dismissed');
      await fetchReports(); // Refresh reports
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to dismiss report';
      toast.error(message);
      return false;
    }
  };

  // Filter reports
  const filterReportsByStatus = useCallback((status: FirestoreReport['status']) => {
    return reports.filter(r => r.status === status);
  }, [reports]);

  const filterReportsByPriority = useCallback((priority: FirestoreReport['priority']) => {
    return reports.filter(r => r.priority === priority);
  }, [reports]);

  const getAutoFlagged = useCallback(() => {
    return reports.filter(r => r.autoFlagged);
  }, [reports]);

  return {
    reports,
    statistics,
    loading,
    error,
    refetch: fetchReports,
    submitProjectReport,
    submitUserReport,
    updateStatus: handleUpdateStatus,
    resolveReport: handleResolveReport,
    dismissReport: handleDismissReport,
    filterByStatus: filterReportsByStatus,
    filterByPriority: filterReportsByPriority,
    getAutoFlagged
  };
};


