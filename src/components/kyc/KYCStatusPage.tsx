import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useKYC } from '../../hooks/useKYC';
import { DetailedKYCStatusBadge } from './KYCStatusBadge';
import CreatorCelebration from '../creator/CreatorCelebration';
import { ArrowLeft, Clock, CheckCircle, XCircle, FileText, CreditCard, Lock } from 'lucide-react';
import { maskAadhaarNumber, maskPANCard } from '../../types/kyc';

export default function KYCStatusPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { kycData, loading } = useKYC();
    const [showCelebration, setShowCelebration] = useState(false);

    // ✨ Show celebration modal when KYC is approved (first time visit)
    useEffect(() => {
        if (kycData?.status === 'approved' && !sessionStorage.getItem('celebration_shown')) {
            setShowCelebration(true);
            sessionStorage.setItem('celebration_shown', 'true');
        }
    }, [kycData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading KYC status...</p>
                </div>
            </div>
        );
    }

    if (!kycData) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No KYC Submission Found</h2>
                        <p className="text-gray-600 mb-6">
                            You haven't submitted your KYC yet. Complete your verification to become a creator.
                        </p>
                        <button
                            onClick={() => navigate('/kyc/submit')}
                            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-pink-700 transition-colors"
                        >
                            Start KYC Verification
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification Status</h1>
                    <p className="text-gray-600">
                        Track your creator verification progress
                    </p>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <DetailedKYCStatusBadge
                        status={kycData.status}
                        submittedAt={kycData.submittedAt?.toDate()}
                        reviewedAt={kycData.reviewedAt?.toDate()}
                        rejectionReason={kycData.rejectionReason}
                    />

                    {/* Timeline */}
                    <div className="mt-6 space-y-4">
                        {/* Submitted */}
                        {kycData.submittedAt && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">KYC Submitted</p>
                                    <p className="text-sm text-gray-500">
                                        {kycData.submittedAt.toDate().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Under Review */}
                        {kycData.status === 'under_review' && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Under Review</p>
                                    <p className="text-sm text-gray-500">
                                        Our team is reviewing your documents
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Approved */}
                        {kycData.status === 'approved' && kycData.reviewedAt && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">KYC Approved</p>
                                    <p className="text-sm text-gray-500">
                                        {kycData.reviewedAt.toDate().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Rejected */}
                        {kycData.status === 'rejected' && kycData.reviewedAt && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">KYC Rejected</p>
                                    <p className="text-sm text-gray-500">
                                        {kycData.reviewedAt.toDate().toLocaleString()}
                                    </p>
                                    {kycData.rejectionReason && (
                                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-800">
                                                <strong>Reason:</strong> {kycData.rejectionReason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* KYC Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Information</h2>

                    <div className="space-y-4">
                        {/* Age */}
                        <div>
                            <p className="text-sm text-gray-600">Age</p>
                            <p className="font-medium text-gray-900">{kycData.creatorAge} years</p>
                        </div>

                        {/* KYC Type */}
                        <div>
                            <p className="text-sm text-gray-600">Verification Type</p>
                            <p className="font-medium text-gray-900">
                                {kycData.kycType === 'self' ? 'Self KYC' : 'Parent/Guardian KYC'}
                            </p>
                        </div>

                        {/* Documents */}
                        {kycData.selfKYC && (
                            <>
                                <div>
                                    <p className="text-sm text-gray-600">Aadhaar Number</p>
                                    <p className="font-medium text-gray-900 font-mono">
                                        {maskAadhaarNumber(kycData.selfKYC.aadhaarNumber)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">PAN Card</p>
                                    <p className="font-medium text-gray-900 font-mono">
                                        {maskPANCard(kycData.selfKYC.panCard)}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Parent Guardian Info */}
                        {kycData.parentGuardianKYC && (
                            <>
                                <div className="border-t pt-4">
                                    <p className="text-sm text-gray-600">Parent/Guardian Name</p>
                                    <p className="font-medium text-gray-900">{kycData.parentGuardianKYC.parentName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Contact Number</p>
                                    <p className="font-medium text-gray-900">{kycData.parentGuardianKYC.parentPhone}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                    </div>

                    {kycData.paymentMethods.map((method, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Type</p>
                            <p className="font-medium text-gray-900">
                                {method.type === 'upi' ? `UPI: ${method.upiId}` : `Bank Account (${method.bankDetails?.bankName})`}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Security PIN Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Security PIN</h2>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-800">Security PIN set successfully</p>
                    </div>
                </div>

                {/* Actions */}
                {kycData.status === 'rejected' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
                        <p className="text-gray-600 mb-4">
                            Your KYC was rejected. Please review the reason above and resubmit with correct information.
                        </p>
                        <button
                            onClick={() => navigate('/kyc/submit')}
                            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-pink-700 transition-colors"
                        >
                            Resubmit KYC
                        </button>
                    </div>
                )}

                {kycData.status === 'approved' && (
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
                        <h2 className="text-xl font-bold mb-2">🎉 You're Verified!</h2>
                        <p className="text-green-50 mb-4">
                            Your KYC is approved. You can now create projects and start raising funds.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/projects/create')}
                            className="px-6 py-3 bg-white text-green-600 rounded-lg font-medium hover:shadow-lg transition-all"
                        >
                            Create Your First Project
                        </button>
                    </div>
                )}

                {(kycData.status === 'pending' || kycData.status === 'under_review') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-blue-900 mb-2">What's Next?</h2>
                        <p className="text-sm text-blue-700">
                            Our team typically reviews KYC submissions within 24-48 hours. You'll receive an email notification once your verification is complete.
                        </p>
                    </div>
                )}
            </div>

            {/* ✨ Celebration Modal */}
            <CreatorCelebration
                isOpen={showCelebration}
                onClose={() => setShowCelebration(false)}
                userName={user?.displayName || 'Creator'}
            />
        </div>
    );
}
