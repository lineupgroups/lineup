import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { submitKYC } from '../../lib/kycService';
import { validateAadhaarNumber, validatePANCard, KYCDocument, PaymentMethod, ParentGuardianKYC } from '../../types/kyc';
import toast from 'react-hot-toast';
import AgeVerification from './AgeVerification';
import DocumentUploader from './DocumentUploader';
import PaymentMethodForm from './PaymentMethodForm';
import SecurityPINSetup from './SecurityPINSetup';
import { CheckCircle, ArrowLeft } from 'lucide-react';

type Step = 'age' | 'documents' | 'payment' | 'pin' | 'review';

export default function KYCSubmissionPage() {
    const navigate = useNavigate();
    const { user, refreshUserData } = useAuth();

    // State
    const [currentStep, setCurrentStep] = useState<Step>('age');
    const [submitting, setSubmitting] = useState(false);

    // Form data
    const [age, setAge] = useState<number | null>(null);
    const [isUserMinor, setIsUserMinor] = useState(false);
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [panCard, setPanCard] = useState('');
    const [addressProofUrl, setAddressProofUrl] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [securityPinHash, setSecurityPinHash] = useState('');

    // Parent/Guardian data (for minors)
    const [parentName, setParentName] = useState('');
    const [parentPhone, setParentPhone] = useState('');
    const [parentConsent, setParentConsent] = useState(false);

    const steps: { id: Step; label: string; number: number }[] = [
        { id: 'age', label: 'Age Verification', number: 1 },
        { id: 'documents', label: 'Documents', number: 2 },
        { id: 'payment', label: 'Payment Details', number: 3 },
        { id: 'pin', label: 'Security PIN', number: 4 },
        { id: 'review', label: 'Review & Submit', number: 5 },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const handleAgeVerified = (verifiedAge: number, minor: boolean) => {
        setAge(verifiedAge);
        setIsUserMinor(minor);
        setCurrentStep('documents');
    };

    const handleDocumentsComplete = () => {
        if (!addressProofUrl) {
            toast.error('Please upload address proof');
            return;
        }
        if (!aadhaarNumber || !validateAadhaarNumber(aadhaarNumber)) {
            toast.error('Please enter a valid Aadhaar number');
            return;
        }
        if (!panCard || !validatePANCard(panCard)) {
            toast.error('Please enter a valid PAN card number');
            return;
        }
        setCurrentStep('payment');
    };

    const handlePaymentMethodSet = (method: PaymentMethod) => {
        setPaymentMethod(method);
        setCurrentStep('pin');
    };

    const handlePINSet = (pinHash: string) => {
        setSecurityPinHash(pinHash);
        setCurrentStep('review');
    };

    const handleSubmitKYC = async () => {
        if (!user) {
            toast.error('You must be logged in to submit KYC');
            return;
        }

        // Fix: Validate age is properly set and not null/undefined
        if (age === null || age === undefined || typeof age !== 'number') {
            toast.error('Please complete age verification first');
            setCurrentStep('age');
            return;
        }

        if (!paymentMethod) {
            toast.error('Please set up a payment method');
            setCurrentStep('payment');
            return;
        }

        if (!securityPinHash) {
            toast.error('Please set up your security PIN');
            setCurrentStep('pin');
            return;
        }

        try {
            setSubmitting(true);

            // Prepare KYC document
            const kycDoc: KYCDocument = {
                aadhaarNumber,
                panCard: panCard.toUpperCase(),
                addressProof: addressProofUrl,
                verified: false,
            };

            // Prepare submission data - age is guaranteed to be a number here
            const kycData = {
                creatorAge: age, // This is now guaranteed to be a number
                kycType: (isUserMinor ? 'parent_guardian' : 'self') as 'self' | 'parent_guardian',
                paymentMethods: [paymentMethod],
            };

            if (isUserMinor) {
                // For minors, use parent/guardian KYC
                const parentGuardianKYC: ParentGuardianKYC = {
                    parentName,
                    parentPhone,
                    relationship: 'parent',
                    consentGiven: parentConsent,
                    consentDate: new Date() as any,
                    kyc: kycDoc,
                };
                Object.assign(kycData, { parentGuardianKYC });
            } else {
                // For adults, use self KYC
                Object.assign(kycData, { selfKYC: kycDoc });
            }

            // Submit KYC
            await submitKYC(user.uid, kycData, securityPinHash);

            // Refresh user data
            await refreshUserData();

            toast.success('KYC submitted successfully! We will review it shortly.');
            navigate('/kyc/status');
        } catch (error) {
            console.error('KYC submission error:', error);
            toast.error('Failed to submit KYC. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Verification</h1>
                    <p className="text-gray-600">
                        Complete KYC verification to unlock creator features and start creating projects
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${index < currentStepIndex
                                            ? 'bg-green-600 text-white'
                                            : index === currentStepIndex
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}
                                    >
                                        {index < currentStepIndex ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : (
                                            step.number
                                        )}
                                    </div>
                                    <p className={`text-xs mt-2 text-center ${index === currentStepIndex ? 'text-gray-900 font-medium' : 'text-gray-500'
                                        }`}>
                                        {step.label}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-1 mx-2 rounded transition-colors ${index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                                            }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="transition-all duration-300">
                    {currentStep === 'age' && (
                        <AgeVerification
                            onAgeVerified={handleAgeVerified}
                            onBack={() => navigate(-1)}
                        />
                    )}

                    {currentStep === 'documents' && (
                        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
                                <p className="text-gray-600">
                                    {isUserMinor
                                        ? 'Upload your parent/guardian documents for verification'
                                        : 'Upload your documents for identity verification'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Aadhaar Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={aadhaarNumber}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                            setAadhaarNumber(value);
                                        }}
                                        placeholder="Enter 12-digit Aadhaar number"
                                        maxLength={12}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        PAN Card Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={panCard}
                                        onChange={(e) => {
                                            const value = e.target.value.toUpperCase().slice(0, 10);
                                            setPanCard(value);
                                        }}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase"
                                    />
                                </div>

                                <DocumentUploader
                                    label="Address Proof"
                                    description="Upload utility bill, bank statement, or any government-issued address proof"
                                    documentType="addressProof"
                                    onUploadComplete={setAddressProofUrl}
                                    currentUrl={addressProofUrl}
                                />

                                {isUserMinor && (
                                    <>
                                        <div className="border-t pt-6 mt-6">
                                            <h3 className="font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Parent/Guardian Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={parentName}
                                                        onChange={(e) => setParentName(e.target.value)}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Parent/Guardian Phone <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={parentPhone}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                            setParentPhone(value);
                                                        }}
                                                        placeholder="10-digit mobile number"
                                                        maxLength={10}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                    />
                                                </div>

                                                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <input
                                                        type="checkbox"
                                                        id="parentConsent"
                                                        checked={parentConsent}
                                                        onChange={(e) => setParentConsent(e.target.checked)}
                                                        className="mt-1"
                                                    />
                                                    <label htmlFor="parentConsent" className="text-sm text-yellow-800">
                                                        I confirm that I am the parent/guardian and give consent for the minor to create projects on this platform.
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setCurrentStep('age')}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleDocumentsComplete}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-pink-700 transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 'payment' && (
                        <PaymentMethodForm
                            onPaymentMethodSet={handlePaymentMethodSet}
                            currentMethod={paymentMethod || undefined}
                            onBack={() => setCurrentStep('documents')}
                        />
                    )}

                    {currentStep === 'pin' && (
                        <SecurityPINSetup
                            onPINSet={handlePINSet}
                            onBack={() => setCurrentStep('payment')}
                        />
                    )}

                    {currentStep === 'review' && (
                        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
                                <p className="text-gray-600">
                                    Please review your information before submitting
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Age</p>
                                    <p className="font-semibold text-gray-900">{age} years</p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Documents</p>
                                    <p className="font-semibold text-gray-900">✓ All documents uploaded</p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                                    <p className="font-semibold text-gray-900">
                                        {paymentMethod?.type === 'upi' ? `UPI: ${paymentMethod.upiId}` : 'Bank Account'}
                                    </p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Security PIN</p>
                                    <p className="font-semibold text-gray-900">✓ PIN set successfully</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>What happens next?</strong><br />
                                    Our team will review your documents within 24-48 hours. You'll receive an email notification once your KYC is approved.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setCurrentStep('pin')}
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmitKYC}
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit KYC'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
