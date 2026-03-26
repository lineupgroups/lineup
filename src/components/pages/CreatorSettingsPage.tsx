import { useState, useMemo } from 'react';
import {
    Settings as SettingsIcon, Bell, Shield, Lock, Calendar, AlertTriangle,
    Check, X, Mail, MessageCircle, Clock, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import { useProjectContext } from '../../hooks/useProjectContext';
import { useKYC } from '../../hooks/useKYC';
import PageTitle from '../common/PageTitle';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { extendProjectDeadline, cancelProject } from '../../lib/projectManagement';
import { maskAadhaarNumber, maskPANCard } from '../../types/kyc';

export default function CreatorSettingsPage() {
    const { user } = useAuth();
    const { projects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');
    const { selectedProject } = useProjectContext();

    // Mock notification preferences state
    const [notifications, setNotifications] = useState({
        email: {
            newDonation: true,
            milestoneReached: true,
            weeklyAnalytics: true,
            payoutProcessed: true,
            marketing: false,
        },
        whatsapp: {
            largePayouts: true,
            projectEnding: true,
            dailySummary: false,
        }
    });

    // Real KYC data from hook
    const { kycData, loading: kycLoading } = useKYC();

    // Mock Security data (sessions would need real authentication tracking)
    const mockSecurityData = {
        twoFactorEnabled: false,
        activeSessions: [
            { device: 'Chrome on Windows', lastActive: 'Active now', location: 'India' },
            { device: 'Safari on iPhone', lastActive: '2 days ago', location: 'India' },
        ]
    };

    // Extension form state
    const [extensionDays, setExtensionDays] = useState(7);
    const [extensionReason, setExtensionReason] = useState('');
    const [showExtensionForm, setShowExtensionForm] = useState(false);

    // Cancellation form state
    const [cancellationReason, setCancellationReason] = useState('');
    const [showCancellationConfirm, setShowCancellationConfirm] = useState(false);

    // Get the project to manage (selected project or first project)
    const managedProject = useMemo(() => {
        if (selectedProject) return selectedProject;
        return projects.length > 0 ? projects[0] : null;
    }, [selectedProject, projects]);

    // Calculate project status and progress
    const projectInfo = useMemo(() => {
        if (!managedProject) return null;

        // Use 'goal' and 'raised' which are the actual fields in FirestoreProject
        const goalAmount = managedProject.goal || managedProject.goalAmount || 0;
        const currentAmount = managedProject.raised || managedProject.currentAmount || 0;

        const progress = goalAmount > 0
            ? (currentAmount / goalAmount) * 100
            : 0;

        const endDate = managedProject.endDate
            ? new Date(managedProject.endDate.seconds ? managedProject.endDate.seconds * 1000 : managedProject.endDate)
            : null;

        const daysLeft = endDate
            ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : managedProject.daysLeft || 0;

        return {
            title: managedProject.title,
            status: managedProject.status || 'active',
            currentAmount: currentAmount,
            goalAmount: goalAmount,
            progress: Math.min(progress, 100),
            daysLeft,
        };
    }, [managedProject]);

    const handleNotificationChange = (category: 'email' | 'whatsapp', key: string) => {
        if (category === 'email') {
            setNotifications(prev => ({
                ...prev,
                email: {
                    ...prev.email,
                    [key]: !prev.email[key as keyof typeof prev.email]
                }
            }));
        } else {
            setNotifications(prev => ({
                ...prev,
                whatsapp: {
                    ...prev.whatsapp,
                    [key]: !prev.whatsapp[key as keyof typeof prev.whatsapp]
                }
            }));
        }
    };

    const handleSaveNotifications = () => {
        toast.success('Notification preferences saved (Mock)');
    };

    // Loading states for async operations
    const [isExtending, setIsExtending] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const handleExtendDeadline = async () => {
        if (extensionDays < 1 || extensionDays > 30) {
            toast.error('Extension must be between 1-30 days');
            return;
        }
        if (!extensionReason.trim()) {
            toast.error('Please provide a reason for extension');
            return;
        }
        if (!managedProject || !user) {
            toast.error('No project selected');
            return;
        }

        setIsExtending(true);
        try {
            const result = await extendProjectDeadline({
                projectId: managedProject.id,
                extensionDays,
                reason: extensionReason,
                requestedBy: user.uid
            });

            if (result.success) {
                toast.success(result.message);
                setShowExtensionForm(false);
                setExtensionReason('');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Failed to extend deadline. Please try again.');
        } finally {
            setIsExtending(false);
        }
    };

    const handleCancelProject = async () => {
        if (!cancellationReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
        }
        if (!managedProject || !user) {
            toast.error('No project selected');
            return;
        }

        setIsCancelling(true);
        try {
            const result = await cancelProject({
                projectId: managedProject.id,
                reason: cancellationReason,
                requestedBy: user.uid
            });

            if (result.success) {
                toast.success(result.message);
                setShowCancellationConfirm(false);
                setCancellationReason('');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Failed to cancel project. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (projectsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Dynamic Page Title */}
            <PageTitle title="Settings" description="Manage your account and project settings" />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-2.5 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl shadow-lg">
                                <SettingsIcon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Manage your account, notifications, and project settings
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Column */}
                    <div className="space-y-6">

                        {/* Project Management */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-red-500">
                                <div className="flex items-center space-x-2 text-white">
                                    <Calendar className="w-5 h-5" />
                                    <h3 className="font-semibold">Project Management</h3>
                                </div>
                            </div>

                            {projectInfo ? (
                                <div className="p-6 space-y-6">
                                    {/* Project Status */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">Project Status</span>
                                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${projectInfo.status === 'active' ? 'bg-green-100 text-green-700' :
                                                projectInfo.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${projectInfo.status === 'active' ? 'bg-green-500' :
                                                    projectInfo.status === 'paused' ? 'bg-yellow-500' :
                                                        'bg-gray-500'
                                                    }`} />
                                                {projectInfo.status.charAt(0).toUpperCase() + projectInfo.status.slice(1)}
                                            </span>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-600">Funding Progress</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(projectInfo.currentAmount)} / {formatCurrency(projectInfo.goalAmount)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="bg-gradient-to-r from-orange-500 to-red-500 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${projectInfo.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{projectInfo.progress.toFixed(1)}% funded</p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">Days Left</span>
                                            <span className={`text-lg font-bold ${projectInfo.daysLeft <= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {projectInfo.daysLeft} days
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => setShowExtensionForm(!showExtensionForm)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            Extend Deadline
                                        </button>
                                        <button
                                            onClick={() => setShowCancellationConfirm(!showCancellationConfirm)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel Project
                                        </button>
                                    </div>

                                    {/* Extension Form */}
                                    {showExtensionForm && (
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                                            <h4 className="font-medium text-blue-900">Extend Deadline</h4>
                                            <div>
                                                <label className="block text-sm font-medium text-blue-800 mb-1">
                                                    Extension (days)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={30}
                                                        value={extensionDays}
                                                        onChange={(e) => setExtensionDays(Number(e.target.value))}
                                                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                    <span className="text-sm text-blue-700">(max 30 days)</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-blue-800 mb-1">
                                                    Reason for extension
                                                </label>
                                                <textarea
                                                    value={extensionReason}
                                                    onChange={(e) => setExtensionReason(e.target.value)}
                                                    placeholder="Explain why you need more time..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                />
                                            </div>
                                            <button
                                                onClick={handleExtendDeadline}
                                                disabled={isExtending}
                                                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isExtending ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Extending...
                                                    </>
                                                ) : (
                                                    'Request Extension'
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Cancellation Form */}
                                    {showCancellationConfirm && (
                                        <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-4">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-medium text-red-900">Cancel Project</h4>
                                                    <p className="text-sm text-red-700 mt-1">
                                                        This action cannot be undone. All backers will be notified and refunds will be processed.
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-red-800 mb-1">
                                                    Cancellation Reason
                                                </label>
                                                <textarea
                                                    value={cancellationReason}
                                                    onChange={(e) => setCancellationReason(e.target.value)}
                                                    placeholder="Why are you cancelling this project?"
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                                />
                                            </div>
                                            <button
                                                onClick={handleCancelProject}
                                                disabled={isCancelling}
                                                className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isCancelling ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Cancelling...
                                                    </>
                                                ) : (
                                                    'Cancel Project'
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No projects to manage</p>
                                    <p className="text-sm text-gray-400 mt-1">Create a project to manage its settings here</p>
                                </div>
                            )}
                        </div>

                        {/* Notification Preferences */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center space-x-2">
                                    <Bell className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Email Notifications */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { key: 'newDonation', label: 'New donation received' },
                                            { key: 'milestoneReached', label: 'Project milestone reached' },
                                            { key: 'weeklyAnalytics', label: 'Weekly analytics report' },
                                            { key: 'payoutProcessed', label: 'Payout processed' },
                                            { key: 'marketing', label: 'Marketing and promotional emails' },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                                                <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.label}</span>
                                                <button
                                                    onClick={() => handleNotificationChange('email', item.key)}
                                                    className={`relative w-11 h-6 rounded-full transition-colors ${notifications.email[item.key as keyof typeof notifications.email]
                                                        ? 'bg-green-500'
                                                        : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notifications.email[item.key as keyof typeof notifications.email]
                                                            ? 'translate-x-5'
                                                            : ''
                                                            }`}
                                                    />
                                                </button>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Push Notifications */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-gray-400" />
                                            <h4 className="font-medium text-gray-400">Push Notifications</h4>
                                        </div>
                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Coming Soon</span>
                                    </div>
                                </div>

                                {/* WhatsApp Notifications */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MessageCircle className="w-4 h-4 text-green-500" />
                                        <h4 className="font-medium text-gray-900">WhatsApp Notifications</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { key: 'largePayouts', label: 'Payout above ₹10,000' },
                                            { key: 'projectEnding', label: 'Project ending in 24 hours' },
                                            { key: 'dailySummary', label: 'Daily donation summary' },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                                                <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.label}</span>
                                                <button
                                                    onClick={() => handleNotificationChange('whatsapp', item.key)}
                                                    className={`relative w-11 h-6 rounded-full transition-colors ${notifications.whatsapp[item.key as keyof typeof notifications.whatsapp]
                                                        ? 'bg-green-500'
                                                        : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notifications.whatsapp[item.key as keyof typeof notifications.whatsapp]
                                                            ? 'translate-x-5'
                                                            : ''
                                                            }`}
                                                    />
                                                </button>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveNotifications}
                                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">

                        {/* KYC & Verification */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-5 h-5 text-green-600" />
                                    <h3 className="font-semibold text-gray-900">KYC & Verification</h3>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {kycLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                ) : kycData ? (
                                    <>
                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">Status</span>
                                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${kycData.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                kycData.status === 'pending' || kycData.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {kycData.status === 'approved' ? (
                                                    <><Check className="w-4 h-4" /> Verified</>
                                                ) : kycData.status === 'pending' || kycData.status === 'under_review' ? (
                                                    <><Clock className="w-4 h-4" /> {kycData.status === 'under_review' ? 'Under Review' : 'Pending'}</>
                                                ) : (
                                                    <><X className="w-4 h-4" /> Rejected</>
                                                )}
                                            </span>
                                        </div>

                                        {kycData.status === 'approved' && (
                                            <>
                                                {kycData.reviewedAt && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">Verified On</span>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {kycData.reviewedAt.toDate().toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'long', year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="pt-4 border-t border-gray-200">
                                                    <p className="text-sm font-medium text-gray-700 mb-3">Documents Submitted:</p>
                                                    <div className="space-y-2">
                                                        {/* Aadhaar */}
                                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <Check className="w-4 h-4 text-green-600" />
                                                                <span className="text-sm text-gray-700">Aadhaar</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500 font-mono">
                                                                {kycData.selfKYC?.aadhaarNumber
                                                                    ? maskAadhaarNumber(kycData.selfKYC.aadhaarNumber)
                                                                    : kycData.parentGuardianKYC?.kyc?.aadhaarNumber
                                                                        ? maskAadhaarNumber(kycData.parentGuardianKYC.kyc.aadhaarNumber)
                                                                        : 'XXXX-XXXX-****'}
                                                            </span>
                                                        </div>
                                                        {/* PAN */}
                                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <Check className="w-4 h-4 text-green-600" />
                                                                <span className="text-sm text-gray-700">PAN</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500 font-mono">
                                                                {kycData.selfKYC?.panCard
                                                                    ? maskPANCard(kycData.selfKYC.panCard)
                                                                    : kycData.parentGuardianKYC?.kyc?.panCard
                                                                        ? maskPANCard(kycData.parentGuardianKYC.kyc.panCard)
                                                                        : '******'}
                                                            </span>
                                                        </div>
                                                        {/* Address Proof */}
                                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <Check className="w-4 h-4 text-green-600" />
                                                                <span className="text-sm text-gray-700">Address Proof</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500">
                                                                {(kycData.selfKYC?.addressProof || kycData.parentGuardianKYC?.kyc?.addressProof)
                                                                    ? 'Uploaded'
                                                                    : 'Not uploaded'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* KYC Type Badge */}
                                                {kycData.kycType && (
                                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                                        <span className="text-sm text-gray-600">KYC Type</span>
                                                        <span className="text-sm font-medium text-gray-900 capitalize">
                                                            {kycData.kycType === 'self' ? 'Self Verified (18+)' : 'Parent/Guardian (Minor)'}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {kycData.status === 'rejected' && (
                                            <div className="p-4 bg-red-50 rounded-lg">
                                                <p className="text-sm text-red-700">
                                                    <strong>Reason:</strong> {kycData.rejectionReason || 'Documents could not be verified'}
                                                </p>
                                                <button
                                                    onClick={() => toast.success('Please contact support to resubmit KYC')}
                                                    className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                                >
                                                    Contact Support
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500">No KYC data found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Security Settings */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center space-x-2">
                                    <Lock className="w-5 h-5 text-purple-600" />
                                    <h3 className="font-semibold text-gray-900">Security</h3>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Security PIN */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Security PIN</h4>
                                            <p className="text-sm text-gray-500">Your 6-digit PIN for project creation</p>
                                        </div>
                                        <button
                                            onClick={() => toast.success('Change PIN (Mock)')}
                                            className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                                        >
                                            Change PIN
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Created: {kycData?.pinCreatedAt
                                            ? kycData.pinCreatedAt.toDate().toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'long', year: 'numeric'
                                            })
                                            : 'Not available'}
                                    </p>
                                </div>

                                {/* Two-Factor Authentication */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                                            <p className="text-sm text-gray-500">Add an extra layer of security</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${mockSecurityData.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                                                {mockSecurityData.twoFactorEnabled ? 'Enabled' : 'Not Enabled'}
                                            </span>
                                            <button
                                                onClick={() => toast.success('2FA coming soon!')}
                                                className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                                                disabled
                                            >
                                                Coming Soon
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Sessions */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-gray-900">Active Sessions</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {mockSecurityData.activeSessions.map((session, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{session.device}</p>
                                                    <p className="text-xs text-gray-500">{session.location}</p>
                                                </div>
                                                <span className={`text-xs font-medium ${session.lastActive === 'Active now' ? 'text-green-600' : 'text-gray-500'
                                                    }`}>
                                                    {session.lastActive}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => toast.success('Signed out from all devices (Mock)')}
                                        className="mt-4 w-full py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm"
                                    >
                                        Sign Out All Devices
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
