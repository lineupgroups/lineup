import { useState } from 'react';
import { Calendar, Globe, Lock, CheckCircle, Rocket, CreditCard } from 'lucide-react';
import { UserKYCData } from '../../types/kyc';

interface Step3LaunchProps {
    data: {
        type: 'immediate' | 'scheduled';
        scheduledDate?: Date;
        privacy: 'public' | 'private';
    };
    onUpdate: (data: any) => void;
    onSubmit: () => void;
    onBack: () => void;
    isSubmitting: boolean;
    projectData: any;
    kycData?: UserKYCData;
}

export default function Step3Launch({
    data,
    onUpdate,
    onSubmit,
    onBack,
    isSubmitting,
    projectData,
    kycData
}: Step3LaunchProps) {
    const [launchType, setLaunchType] = useState<'immediate' | 'scheduled'>(data.type || 'immediate');
    const [scheduledDate, setScheduledDate] = useState(data.scheduledDate || new Date());
    const [privacy, setPrivacy] = useState<'public' | 'private'>(data.privacy || 'public');

    const handleLaunchTypeChange = (type: 'immediate' | 'scheduled') => {
        setLaunchType(type);
        onUpdate({ type, scheduledDate: type === 'scheduled' ? scheduledDate : undefined, privacy });
    };

    const handleScheduledDateChange = (date: Date) => {
        setScheduledDate(date);
        onUpdate({ type: launchType, scheduledDate: date, privacy });
    };

    const handlePrivacyChange = (newPrivacy: 'public' | 'private') => {
        setPrivacy(newPrivacy);
        onUpdate({ type: launchType, scheduledDate, privacy: newPrivacy });
    };

    const handleSubmit = () => {
        onUpdate({ type: launchType, scheduledDate, privacy });
        onSubmit();
    };

    const primaryPayment = kycData?.paymentMethods.find(pm => pm.isPrimary) || kycData?.paymentMethods[0];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Launch</h2>
                <p className="text-gray-600">
                    Review your project details and choose when to launch
                </p>
            </div>

            {/* Project Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Project Summary
                </h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-gray-600">Title</p>
                        <p className="font-medium text-gray-900">{projectData.basics?.title || 'Untitled'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Funding Goal</p>
                        <p className="font-medium text-gray-900">₹{projectData.basics?.fundingGoal?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-medium text-gray-900">{projectData.basics?.category || 'Not set'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium text-gray-900">{projectData.basics?.duration || 30} days</p>
                    </div>
                </div>
            </div>

            {/* Payment Method (From KYC) */}
            {kycData && primaryPayment && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        Payment Method (From Your KYC)
                    </h3>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium text-gray-900">
                            {primaryPayment.type === 'upi' ? `UPI: ${primaryPayment.upiId}` : `Bank Account (${primaryPayment.bankDetails?.bankName})`}
                        </p>
                        <p className="text-xs text-green-700 mt-2">
                            ✓ Verified during KYC - funds will be transferred to this account
                        </p>
                    </div>
                </div>
            )}

            {/* Launch Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    When would you like to launch?
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => handleLaunchTypeChange('immediate')}
                        className={`p-4 border-2 rounded-lg transition-all ${launchType === 'immediate'
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <Rocket className={`w-8 h-8 mx-auto mb-2 ${launchType === 'immediate' ? 'text-orange-600' : 'text-gray-400'
                            }`} />
                        <p className="font-medium text-gray-900">Launch Immediately</p>
                        <p className="text-xs text-gray-500 mt-1">After admin approval</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleLaunchTypeChange('scheduled')}
                        className={`p-4 border-2 rounded-lg transition-all ${launchType === 'scheduled'
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <Calendar className={`w-8 h-8 mx-auto mb-2 ${launchType === 'scheduled' ? 'text-orange-600' : 'text-gray-400'
                            }`} />
                        <p className="font-medium text-gray-900">Schedule Launch</p>
                        <p className="text-xs text-gray-500 mt-1">Choose a future date</p>
                    </button>
                </div>

                {launchType === 'scheduled' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Launch Date
                        </label>
                        <input
                            type="datetime-local"
                            value={scheduledDate.toISOString().slice(0, 16)}
                            onChange={(e) => handleScheduledDateChange(new Date(e.target.value))}
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                )}
            </div>

            {/* Privacy */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Project Visibility
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => handlePrivacyChange('public')}
                        className={`p-4 border-2 rounded-lg transition-all ${privacy === 'public'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <Globe className={`w-8 h-8 mx-auto mb-2 ${privacy === 'public' ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                        <p className="font-medium text-gray-900">Public</p>
                        <p className="text-xs text-gray-500 mt-1">Everyone can discover</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => handlePrivacyChange('private')}
                        className={`p-4 border-2 rounded-lg transition-all ${privacy === 'private'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <Lock className={`w-8 h-8 mx-auto mb-2 ${privacy === 'private' ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                        <p className="font-medium text-gray-900">Private</p>
                        <p className="text-xs text-gray-500 mt-1">Only via direct link</p>
                    </button>
                </div>
            </div>

            {/* Admin Review Notice */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow-600" />
                    Admin Review Required
                </h3>
                <p className="text-sm text-yellow-800">
                    After clicking "Submit for Review", your project will be reviewed by our team before going live.
                    You'll receive an email notification once it's approved (typically within 24-48 hours).
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                        </span>
                    ) : (
                        'Submit for Review'
                    )}
                </button>
            </div>

            {/* Security Note */}
            <div className="text-center">
                <p className="text-xs text-gray-500">
                    🔒 You'll be asked to verify your identity with your security PIN before submission
                </p>
            </div>
        </div>
    );
}
