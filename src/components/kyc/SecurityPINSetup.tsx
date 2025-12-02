import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Info } from 'lucide-react';
import { validateSecurityPIN } from '../../types/kyc';
import { hashSecurityPIN } from '../../lib/kycService';

interface SecurityPINSetupProps {
    onPINSet: (pinHash: string) => void;
    onBack?: () => void;
}

export default function SecurityPINSetup({ onPINSet, onBack }: SecurityPINSetupProps) {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState('');
    const [isHashing, setIsHashing] = useState(false);

    const handlePINChange = (value: string) => {
        // Only allow digits, max 6
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setPin(numericValue);
        setError('');
    };

    const handleConfirmPINChange = (value: string) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setConfirmPin(numericValue);
        setError('');
    };

    const handleSubmit = async () => {
        // Validate PIN
        const validation = validateSecurityPIN(pin);
        if (!validation.isValid) {
            setError(validation.errors[0]);
            return;
        }

        // Check if PINs match
        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        try {
            setIsHashing(true);

            // Hash the PIN
            const pinHash = await hashSecurityPIN(pin);

            // Call parent callback with hashed PIN
            onPINSet(pinHash);
        } catch (error) {
            console.error('Error hashing PIN:', error);
            setError('Failed to secure your PIN. Please try again.');
        } finally {
            setIsHashing(false);
        }
    };

    const isPINsMatch = pin.length === 6 && confirmPin === pin;
    const canSubmit = isPINsMatch && !error && !isHashing;

    return (
        <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-10 h-10 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Security PIN</h2>
                <p className="text-gray-600">
                    This PIN will be required when creating projects to verify your identity
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* PIN Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Create 6-Digit PIN
                    </label>
                    <div className="relative">
                        <input
                            type={showPin ? 'text' : 'password'}
                            value={pin}
                            onChange={(e) => handlePINChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="••••••"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {/* PIN Strength Indicator */}
                    {pin.length > 0 && (
                        <div className="mt-2 flex gap-1">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-colors ${i < pin.length ? 'bg-orange-500' : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirm PIN Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm PIN
                    </label>
                    <input
                        type={showPin ? 'text' : 'password'}
                        value={confirmPin}
                        onChange={(e) => handleConfirmPINChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="••••••"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="off"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {isPINsMatch && !error && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-700 font-medium">
                            PINs match and are secure!
                        </p>
                    </div>
                )}

                {/* PIN Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <h4 className="font-medium text-blue-900">PIN Requirements:</h4>
                    </div>
                    <ul className="text-sm text-blue-700 space-y-1 ml-7">
                        <li className="flex items-center gap-2">
                            <span className={pin.length === 6 ? 'text-green-600' : ''}>
                                {pin.length === 6 ? '✓' : '•'}
                            </span>
                            Must be exactly 6 digits
                        </li>
                        <li className="flex items-center gap-2">
                            <span>•</span>
                            No sequential numbers (e.g., 123456, 654321)
                        </li>
                        <li className="flex items-center gap-2">
                            <span>•</span>
                            No repeating digits (e.g., 111111, 000000)
                        </li>
                        <li className="flex items-center gap-2">
                            <span>•</span>
                            Keep it confidential and memorable
                        </li>
                    </ul>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> You'll need this PIN every time you create a project.
                        Make sure to remember it!
                    </p>
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
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${canSubmit
                                ? 'bg-gradient-to-r from-orange-600 to-pink-600 text-white hover:from-orange-700 hover:to-pink-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isHashing ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Securing PIN...
                            </span>
                        ) : (
                            'Set PIN and Continue'
                        )}
                    </button>
                </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                    🔒 Your PIN is encrypted and stored securely. We never store it in plain text.
                </p>
            </div>
        </div>
    );
}
