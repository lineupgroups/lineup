import React, { useState, useEffect } from 'react';
import { X, Heart, Shield, CreditCard, Lock, CheckCircle, User, Mail, AlertCircle } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { processDonation } from '../../lib/donationService';
import toast from 'react-hot-toast';
import { generateAnonymousId } from '../../utils/anonymousUser';
import { useEnhancedUserProfile } from '../../hooks/useEnhancedUserProfile';
import SuccessConfetti from '../animations/SuccessConfetti';

interface BackProjectModalProps {
    project: {
        id: string;
        title: string;
        creatorName: string;
        image?: string;
        rewardTiers?: Array<{
            id: string;
            title: string;
            amount: number;
            description: string;
            remaining?: number;
        }>;
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const BackProjectModal: React.FC<BackProjectModalProps> = ({ project, isOpen, onClose, onSuccess }) => {
    const [user] = useAuthState(auth);
    const { profile } = useEnhancedUserProfile(user?.uid);
    const [step, setStep] = useState<'amount' | 'payment' | 'success'>('amount');
    const [selectedTier, setSelectedTier] = useState<string | null>(null);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Sync anonymous state with profile setting
    useEffect(() => {
        if (profile?.donateAnonymousByDefault) {
            setIsAnonymous(true);
        }
    }, [profile]);

    const isAnonymousForced = profile?.donateAnonymousByDefault || false;

    // Payment form (mock)
    const [paymentDetails, setPaymentDetails] = useState({
        name: user?.displayName || '',
        email: user?.email || '',
        phone: ''
    });

    if (!isOpen) return null;

    const selectedTierData = project.rewardTiers?.find(t => t.id === selectedTier);
    const amount = selectedTier ? selectedTierData?.amount || 0 : parseInt(customAmount) || 0;

    // Calculate anonymous preview
    const anonymousPreview = user ? generateAnonymousId(user.uid) : 'anonymous_user####';

    const handleBackProject = async () => {
        if (!user) {
            toast.error('Please sign in to back this project');
            return;
        }

        if (amount < 100) {
            toast.error('Minimum backing amount is ₹100');
            return;
        }

        if (!paymentDetails.name || !paymentDetails.email) {
            toast.error('Please fill in all required payment details');
            return;
        }

        setIsProcessing(true);

        try {
            // Simulate payment processing delay (mock payment gateway)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Process the donation using the new service
            const result = await processDonation({
                userId: user.uid,
                projectId: project.id,
                amount,
                rewardTier: selectedTierData?.title,
                isAnonymous,
                paymentDetails: {
                    name: paymentDetails.name,
                    email: paymentDetails.email,
                    phone: paymentDetails.phone || undefined,
                },
            });

            if (result.success) {
                setStep('success');
                setShowConfetti(true);
                toast.success('🎉 Donation successful!');

                // Call success callback after a delay
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                    // Reset state
                    setStep('amount');
                    setSelectedTier(null);
                    setCustomAmount('');
                    setIsAnonymous(false);
                    setShowConfetti(false);
                }, 3000);
            } else {
                // Show validation errors
                const errorMessage = result.errors && result.errors.length > 0
                    ? result.errors[0]
                    : 'Failed to process donation';
                toast.error(errorMessage);
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Error backing project:', error);
            toast.error('Failed to back project. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {step === 'amount' && (
                    <>
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Back this project</h2>
                                    <p className="text-sm text-gray-600 mt-1">Choose a reward tier or enter a custom amount</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {/* Reward Tiers */}
                            {project.rewardTiers && project.rewardTiers.length > 0 && (
                                <div className="space-y-3 mb-6">
                                    <h3 className="font-semibold text-gray-900">Select a reward tier</h3>
                                    {project.rewardTiers.map((tier) => (
                                        <button
                                            key={tier.id}
                                            onClick={() => {
                                                setSelectedTier(tier.id);
                                                setCustomAmount('');
                                            }}
                                            className={`
                        w-full text-left p-4 border-2 rounded-lg transition-all duration-200
                        ${selectedTier === tier.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-300 bg-white'
                                                }
                      `}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-gray-900">{tier.title}</h4>
                                                <span className="text-lg font-bold text-blue-600">
                                                    ₹{tier.amount.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{tier.description}</p>
                                            {tier.remaining !== undefined && (
                                                <p className="text-xs text-gray-500">
                                                    {tier.remaining} of {tier.remaining + 10} remaining
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Custom Amount */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Or enter a custom amount</h3>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => {
                                            setCustomAmount(e.target.value);
                                            setSelectedTier(null);
                                        }}
                                        placeholder="Enter amount"
                                        min="100"
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Minimum amount: ₹100</p>
                            </div>

                            {/* Anonymous Backing Option */}
                            <div className={`mt-6 p-4 border rounded-lg ${isAnonymousForced ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-amber-200'}`}>
                                <label className={`flex items-start gap-3 ${isAnonymousForced ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        checked={isAnonymous}
                                        disabled={isAnonymousForced}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500 disabled:opacity-50"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">Make this donation anonymous</span>
                                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Privacy</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Hide your identity from the creator and other backers
                                        </p>
                                        {isAnonymousForced && (
                                            <p className="text-xs text-amber-800 mt-2 font-medium">
                                                * This is enabled by default based on your profile settings.
                                            </p>
                                        )}
                                        {isAnonymous && (
                                            <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                                                <Shield className="w-3 h-3" />
                                                You'll appear as: <span className="font-mono font-semibold">{anonymousPreview}</span>
                                            </p>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setStep('payment')}
                                disabled={amount < 100}
                                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Continue to Payment • ₹{amount.toLocaleString('en-IN')}
                            </button>
                        </div>
                    </>
                )}

                {step === 'payment' && (
                    <>
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <button
                                        onClick={() => setStep('amount')}
                                        className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                                    >
                                        ← Back to amount selection
                                    </button>
                                    <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                                    <p className="text-sm text-gray-600 mt-1">Complete your backing</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {/* Order Summary */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Project:</span>
                                        <span className="font-medium text-gray-900">{project.title}</span>
                                    </div>
                                    {selectedTierData && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Reward:</span>
                                            <span className="font-medium text-gray-900">{selectedTierData.title}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount:</span>
                                        <span className="font-medium text-gray-900">₹{amount.toLocaleString('en-IN')}</span>
                                    </div>
                                    {isAnonymous && (
                                        <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                            <span className="text-amber-700 flex items-center gap-1">
                                                <Shield className="w-3 h-3" />
                                                Anonymous Backing
                                            </span>
                                            <span className="font-mono text-xs text-amber-700">{anonymousPreview}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4 mb-6">
                                <h3 className="font-semibold text-gray-900">Contact Information</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Full Name
                                        </div>
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentDetails.name}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email Address
                                        </div>
                                    </label>
                                    <input
                                        type="email"
                                        value={paymentDetails.email}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={paymentDetails.phone}
                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, phone: e.target.value })}
                                        placeholder="+91 XXXXX XXXXX"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Mock Payment Method */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Payment Method</h3>

                                <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3 mb-3">
                                        <CreditCard className="w-5 h-5 text-blue-600" />
                                        <span className="font-medium text-gray-900">Demo Payment (No actual charge)</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        This is a demonstration mode. No real payment will be processed.
                                    </p>
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Lock className="w-4 h-4 text-green-600" />
                                    <span>Your information is secure and encrypted</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={handleBackProject}
                                disabled={isProcessing || !paymentDetails.name || !paymentDetails.email}
                                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Heart className="w-5 h-5" />
                                        Complete Backing • ₹{amount.toLocaleString('en-IN')}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {step === 'success' && (
                    <div className="p-8 text-center">
                        <div className="mb-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
                            <p className="text-gray-600">
                                You've successfully backed <span className="font-semibold">{project.title}</span>
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</span>
                                </div>
                                {selectedTierData && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Reward:</span>
                                        <span className="font-medium text-gray-900">{selectedTierData.title}</span>
                                    </div>
                                )}
                                {isAnonymous && (
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                        <span className="text-amber-700 flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            Anonymous Backing
                                        </span>
                                        <span className="font-mono text-xs text-amber-700">Yes</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isAnonymous && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-2 text-sm text-amber-800">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p>
                                        You backed this project anonymously. The creator and other backers will see you as{' '}
                                        <span className="font-mono font-semibold">{anonymousPreview}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className="text-sm text-gray-600">
                            A confirmation email has been sent to {paymentDetails.email}
                        </p>
                    </div>
                )}
            </div>

            {/* Success Confetti */}
            <SuccessConfetti
                show={showConfetti}
                duration={4000}
                onComplete={() => setShowConfetti(false)}
            />
        </div>
    );
};

export default BackProjectModal;
