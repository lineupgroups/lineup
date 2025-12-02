import { useState } from 'react';
import { X, CheckCircle, XCircle, FileText, CreditCard, User, Phone } from 'lucide-react';
import { UserKYCData, maskAadhaarNumber, maskPANCard } from '../../types/kyc';
import { useAuth } from '../../contexts/AuthContext';

interface KYCDocumentViewerProps {
    kyc: UserKYCData;
    onClose: () => void;
    onApprove: (kycId: string, adminId: string) => void;
    onReject: (kycId: string, adminId: string, reason: string) => void;
}

export default function KYCDocumentViewer({ kyc, onClose, onApprove, onReject }: KYCDocumentViewerProps) {
    const { user } = useAuth();
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleApprove = async () => {
        if (!user) return;
        setProcessing(true);
        try {
            await onApprove(kyc.id, user.uid);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!user || !rejectionReason.trim()) return;
        setProcessing(true);
        try {
            await onReject(kyc.id, user.uid, rejectionReason);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">KYC Document Review</h3>
                        <p className="text-sm text-gray-600">Document ID: {kyc.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* User Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            User Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">User ID</p>
                                <p className="font-mono text-sm text-gray-900">{kyc.userId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Age</p>
                                <p className="font-semibold text-gray-900">{kyc.creatorAge} years</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Type</p>
                                <p className="font-semibold text-gray-900 capitalize">{kyc.kycType === 'self' ? 'Self KYC' : 'Parent/Guardian KYC'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Submitted</p>
                                <p className="font-semibold text-gray-900">{kyc.submittedAt?.toDate().toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* KYC Documents */}
                    {kyc.selfKYC && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-green-600" />
                                KYC Documents
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Aadhaar Number</p>
                                    <p className="font-mono text-lg text-gray-900">{maskAadhaarNumber(kyc.selfKYC.aadhaarNumber)}</p>
                                    {kyc.selfKYC.aadhaarNumber && (
                                        <img
                                            src={kyc.selfKYC.addressProof}
                                            alt="Aadhaar"
                                            className="mt-2 max-w-full h-auto rounded-lg border border-gray-200"
                                        />
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">PAN Card</p>
                                    <p className="font-mono text-lg text-gray-900">{maskPANCard(kyc.selfKYC.panCard)}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">Address Proof</p>
                                    {kyc.selfKYC.addressProof && (
                                        <img
                                            src={kyc.selfKYC.addressProof}
                                            alt="Address Proof"
                                            className="mt-2 max-w-full h-auto rounded-lg border border-gray-200"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Parent/Guardian Info */}
                    {kyc.parentGuardianKYC && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <User className="w-5 h-5 text-purple-600" />
                                Parent/Guardian Information
                            </h4>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="font-semibold text-gray-900">{kyc.parentGuardianKYC.parentName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Phone</p>
                                    <p className="font-mono text-gray-900">{kyc.parentGuardianKYC.parentPhone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Relationship</p>
                                    <p className="font-semibold text-gray-900 capitalize">{kyc.parentGuardianKYC.relationship}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Methods */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-green-600" />
                            Payment Methods
                        </h4>
                        {kyc.paymentMethods.map((method, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 mb-2">
                                <p className="text-sm text-gray-600">Type</p>
                                <p className="font-semibold text-gray-900">
                                    {method.type === 'upi' ? `UPI: ${method.upiId}` : `Bank: ${method.bankDetails?.bankName}`}
                                </p>
                                {method.type === 'bank' && method.bankDetails && (
                                    <div className="mt-2 text-sm">
                                        <p className="text-gray-600">
                                            Account: {method.bankDetails.accountHolderName} - {method.bankDetails.accountNumber}
                                        </p>
                                        <p className="text-gray-600">IFSC: {method.bankDetails.ifscCode}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    {kyc.status === 'pending' || kyc.status === 'under_review' ? (
                        !showRejectForm ? (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleApprove}
                                    disabled={processing}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {processing ? 'Approving...' : 'Approve KYC'}
                                </button>
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    disabled={processing}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Reject KYC
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason *
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Please provide a clear reason for rejection..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleReject}
                                        disabled={processing || !rejectionReason.trim()}
                                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {processing ? 'Rejecting...' : 'Confirm Rejection'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowRejectForm(false);
                                            setRejectionReason('');
                                        }}
                                        disabled={processing}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className={`p-4 rounded-lg ${kyc.status === 'approved'
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}>
                            <p className={`font-semibold ${kyc.status === 'approved' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {kyc.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                            </p>
                            {kyc.reviewedAt && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Reviewed on {kyc.reviewedAt.toDate().toLocaleString()}
                                </p>
                            )}
                            {kyc.rejectionReason && (
                                <p className="text-sm text-red-700 mt-2">
                                    Reason: {kyc.rejectionReason}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
