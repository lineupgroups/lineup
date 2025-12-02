import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { KYC_AGE_LIMITS, isEligibleForKYC, isMinor } from '../../types/kyc';

interface AgeVerificationProps {
    onAgeVerified: (age: number, isMinor: boolean) => void;
    onBack?: () => void;
}

export default function AgeVerification({ onAgeVerified, onBack }: AgeVerificationProps) {
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [age, setAge] = useState<number | null>(null);
    const [error, setError] = useState('');

    const calculateAge = (dob: string): number => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const handleDateChange = (value: string) => {
        setDateOfBirth(value);
        setError('');

        if (value) {
            const calculatedAge = calculateAge(value);
            setAge(calculatedAge);

            // Validate age
            if (calculatedAge < KYC_AGE_LIMITS.MIN_AGE) {
                setError(`You must be at least ${KYC_AGE_LIMITS.MIN_AGE} years old to create projects`);
            } else if (calculatedAge > KYC_AGE_LIMITS.MAX_AGE) {
                setError('Please enter a valid date of birth');
            }
        } else {
            setAge(null);
        }
    };

    const handleContinue = () => {
        if (!age) {
            setError('Please enter your date of birth');
            return;
        }

        if (!isEligibleForKYC(age)) {
            return;
        }

        onAgeVerified(age, isMinor(age));
    };

    const isEligible = age !== null && isEligibleForKYC(age);
    const showMinorWarning = age !== null && isMinor(age);

    return (
        <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Age Verification</h2>
                <p className="text-gray-600">
                    Please confirm your age to proceed with KYC
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Date of Birth Input */}
                <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                    </label>
                    <input
                        type="date"
                        id="dob"
                        value={dateOfBirth}
                        onChange={(e) => handleDateChange(e.target.value)}
                        max={new Date().toISOString().split('T')[0]} // Can't select future dates
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Enter your date of birth as per your government ID
                    </p>
                </div>

                {/* Age Display */}
                {age !== null && (
                    <div className={`p-4 rounded-lg border-2 ${isEligible
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        <p className="text-sm font-medium text-gray-700">
                            Your Age: <span className="text-lg font-bold">{age} years</span>
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Success Message - Eligible */}
                {isEligible && !showMinorWarning && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-700">
                            <p className="font-medium">You're eligible for self-KYC</p>
                            <p className="text-xs mt-1">
                                You can complete the verification process using your own documents
                            </p>
                        </div>
                    </div>
                )}

                {/* Minor Warning */}
                {showMinorWarning && (
                    <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-700">
                            <p className="font-medium mb-1">Parent/Guardian KYC Required</p>
                            <p>
                                Since you're under 18, your parent or guardian must complete the KYC process
                                and provide their consent.
                            </p>
                            <ul className="mt-2 space-y-1 text-xs">
                                <li>• You'll need your parent/guardian's documents</li>
                                <li>• They must provide consent for you to create projects</li>
                                <li>• Their phone number will be verified</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Age Requirements Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Age Requirements:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Minimum age: {KYC_AGE_LIMITS.MIN_AGE} years (with parent consent)</li>
                        <li>• Adult age: {KYC_AGE_LIMITS.ADULT_AGE} years (self-KYC)</li>
                        <li>• Age verification is required for all creators</li>
                    </ul>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleContinue}
                        disabled={!isEligible}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${isEligible
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Continue
                    </button>
                </div>
            </div>

            {/* Privacy Note */}
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                    🔒 Your date of birth is used only for age verification and will be kept confidential.
                </p>
            </div>
        </div>
    );
}
