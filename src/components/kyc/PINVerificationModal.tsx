import { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { verifyCreatorPIN } from '../../lib/kycService';
import toast from 'react-hot-toast';

interface PINVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
    userId: string;
}

export default function PINVerificationModal({
    isOpen,
    onClose,
    onVerified,
    userId
}: PINVerificationModalProps) {
    const [pin, setPin] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);

    if (!isOpen) return null;

    const handlePINChange = (value: string) => {
        // Only allow digits, max 6
        const numericValue = value.replace(/\D/g, '').slice(0, 6);
        setPin(numericValue);
        setError('');
    };

    const handleVerify = async () => {
        if (pin.length !== 6) {
            setError('PIN must be 6 digits');
            return;
        }

        try {
            setVerifying(true);
            setError('');

            // Verify PIN with backend
            const isValid = await verifyCreatorPIN(userId, pin);

            if (isValid) {
                toast.success('Identity verified successfully!');
                onVerified();
                handleClose();
            } else {
                setAttempts(prev => prev + 1);
                setError('Invalid PIN. Please try again.');
                setPin('');

                if (attempts >= 2) {
                    toast.error('Multiple failed attempts. Please contact support if you forgot your PIN.');
                }
            }
        } catch (error: any) {
            console.error('PIN verification error:', error);
            setError(error.message || 'Failed to verify PIN. Please try again.');
            setPin('');
        } finally {
            setVerifying(false);
        }
    };

    const handleClose = () => {
        setPin('');
        setError('');
        setAttempts(0);
        onClose();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && pin.length === 6) {
            handleVerify();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Lock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Verify Your Identity</h3>
                            <p className="text-sm text-gray-500">Enter your 6-digit security PIN</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Security PIN
                        </label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => handlePINChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="••••••"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="off"
                            autoFocus
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            disabled={verifying}
                        />

                        {/* PIN Strength Indicator */}
                        <div className="mt-3 flex gap-1">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-colors ${i < pin.length ? 'bg-orange-500' : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Attempts Warning */}
                    {attempts > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-xs text-yellow-800">
                                Failed attempts: {attempts}/3
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>Why do we need this?</strong><br />
                            This PIN verifies that you're the account owner who submitted KYC,
                            preventing unauthorized project creation.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={verifying}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleVerify}
                            disabled={pin.length !== 6 || verifying}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${pin.length === 6 && !verifying
                                    ? 'bg-gradient-to-r from-orange-600 to-pink-600 text-white hover:from-orange-700 hover:to-pink-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {verifying ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                'Verify & Submit'
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <p className="text-xs text-gray-500 text-center">
                        🔒 Your PIN is never stored in plain text and is encrypted for security.
                    </p>
                </div>
            </div>
        </div>
    );
}
