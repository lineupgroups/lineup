import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader, Info } from 'lucide-react';
import { checkUsernameAvailability, changeUsername } from '../../lib/usernameService';
import { validateUsername, canChangeUsername, getDaysUntilNextChange, getNextAllowedChangeDate } from '../../utils/usernameValidation';
import toast from 'react-hot-toast';

interface UsernameChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUsername: string;
    userId: string;
    lastChangedAt: Date | null;
    onSuccess: () => void;
}

const UsernameChangeModal: React.FC<UsernameChangeModalProps> = ({
    isOpen,
    onClose,
    currentUsername,
    userId,
    lastChangedAt,
    onSuccess
}) => {
    const [newUsername, setNewUsername] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isChanging, setIsChanging] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(false);

    const canChange = canChangeUsername(lastChangedAt);
    const daysRemaining = getDaysUntilNextChange(lastChangedAt);
    const nextAllowedDate = getNextAllowedChangeDate(lastChangedAt);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setNewUsername('');
            setValidationError(null);
            setAvailabilityMessage(null);
            setIsAvailable(false);
        }
    }, [isOpen]);

    // Debounced availability check
    useEffect(() => {
        if (!newUsername || validationError) {
            setAvailabilityMessage(null);
            setIsAvailable(false);
            return;
        }

        const checkTimeout = setTimeout(async () => {
            setIsChecking(true);
            const result = await checkUsernameAvailability(newUsername, userId);
            setIsAvailable(result.isAvailable);
            setAvailabilityMessage(result.message || null);
            setIsChecking(false);
        }, 500); // 500ms debounce

        return () => clearTimeout(checkTimeout);
    }, [newUsername, validationError, userId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewUsername(value);

        // Validate format
        if (value) {
            const validation = validateUsername(value);
            setValidationError(validation.isValid ? null : validation.error || null);
        } else {
            setValidationError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canChange) {
            toast.error(`You can change your username in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`);
            return;
        }

        if (validationError || !isAvailable) {
            return;
        }

        setIsChanging(true);

        try {
            const result = await changeUsername(userId, newUsername, currentUsername, lastChangedAt);

            if (result.success) {
                toast.success(result.message);
                onSuccess();
                onClose();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error changing username:', error);
            toast.error('Failed to change username. Please try again.');
        } finally {
            setIsChanging(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Change Username</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isChanging}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Current Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Username
                        </label>
                        <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-600">
                            @{currentUsername}
                        </div>
                    </div>

                    {/* Rate Limit Warning */}
                    {!canChange && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-800 mb-1">
                                    Rate Limit Active
                                </p>
                                <p className="text-yellow-700">
                                    You can change your username again in{' '}
                                    <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>
                                    {nextAllowedDate && (
                                        <span className="block mt-1">
                                            Next change: {nextAllowedDate.toLocaleDateString()}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Username Rules:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                                <li>3-20 characters</li>
                                <li>Letters, numbers, and underscores only</li>
                                <li>Cannot start or end with underscore</li>
                                <li>Can change once every 7 days</li>
                            </ul>
                        </div>
                    </div>

                    {/* New Username Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Username
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                @
                            </div>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={handleInputChange}
                                placeholder="username"
                                disabled={!canChange || isChanging}
                                className={`w-full pl-8 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${validationError
                                        ? 'border-red-300 focus:ring-red-500'
                                        : isAvailable && newUsername
                                            ? 'border-green-300 focus:ring-green-500'
                                            : 'border-gray-300 focus:ring-blue-500'
                                    } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                                maxLength={20}
                            />
                            {isChecking && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader className="w-5 h-5 text-gray-400 animate-spin" />
                                </div>
                            )}
                            {!isChecking && newUsername && !validationError && isAvailable && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Check className="w-5 h-5 text-green-500" />
                                </div>
                            )}
                            {!isChecking && validationError && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                </div>
                            )}
                        </div>

                        {/* Validation/Availability Messages */}
                        {validationError && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {validationError}
                            </p>
                        )}
                        {!validationError && availabilityMessage && (
                            <p
                                className={`mt-1 text-sm flex items-center gap-1 ${isAvailable ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {isAvailable ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                {availabilityMessage}
                            </p>
                        )}
                    </div>

                    {/* Character Count */}
                    <div className="text-right text-sm text-gray-500">
                        {newUsername.length}/20 characters
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isChanging}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={!canChange || !isAvailable || !newUsername || !!validationError || isChanging}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isChanging && <Loader className="w-4 h-4 animate-spin" />}
                        {isChanging ? 'Changing...' : 'Change Username'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UsernameChangeModal;
