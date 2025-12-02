import React, { useState } from 'react';
import { CreditCard, Building2, Info } from 'lucide-react';
import { PaymentMethod } from '../../types/kyc';

interface PaymentMethodFormProps {
    onPaymentMethodSet: (method: PaymentMethod) => void;
    currentMethod?: PaymentMethod;
    onBack?: () => void;
}

export default function PaymentMethodForm({
    onPaymentMethodSet,
    currentMethod,
    onBack
}: PaymentMethodFormProps) {
    const [paymentType, setPaymentType] = useState<'upi' | 'bank'>(
        currentMethod?.type || 'upi'
    );

    // UPI fields
    const [upiId, setUpiId] = useState(currentMethod?.upiId || '');

    // Bank fields
    const [accountHolderName, setAccountHolderName] = useState(
        currentMethod?.bankDetails?.accountHolderName || ''
    );
    const [accountNumber, setAccountNumber] = useState(
        currentMethod?.bankDetails?.accountNumber || ''
    );
    const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState(
        currentMethod?.bankDetails?.ifscCode || ''
    );
    const [bankName, setBankName] = useState(
        currentMethod?.bankDetails?.bankName || ''
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateUPI = (upi: string): boolean => {
        // UPI format: username@bankname (e.g., user@paytm, user@oksbi)
        const upiRegex = /^[\w.-]+@[\w.-]+$/;
        return upiRegex.test(upi);
    };

    const validateIFSC = (ifsc: string): boolean => {
        // IFSC format: 4 letters + 7 digits (e.g., SBIN0001234)
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        return ifscRegex.test(ifsc.toUpperCase());
    };

    const validateAccountNumber = (accNum: string): boolean => {
        // Account number should be 9-18 digits
        return /^\d{9,18}$/.test(accNum);
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};

        if (paymentType === 'upi') {
            if (!upiId.trim()) {
                newErrors.upiId = 'UPI ID is required';
            } else if (!validateUPI(upiId)) {
                newErrors.upiId = 'Invalid UPI ID format (e.g., user@paytm)';
            }
        } else {
            if (!accountHolderName.trim()) {
                newErrors.accountHolderName = 'Account holder name is required';
            }
            if (!accountNumber.trim()) {
                newErrors.accountNumber = 'Account number is required';
            } else if (!validateAccountNumber(accountNumber)) {
                newErrors.accountNumber = 'Invalid account number (9-18 digits)';
            }
            if (accountNumber !== confirmAccountNumber) {
                newErrors.confirmAccountNumber = 'Account numbers do not match';
            }
            if (!ifscCode.trim()) {
                newErrors.ifscCode = 'IFSC code is required';
            } else if (!validateIFSC(ifscCode)) {
                newErrors.ifscCode = 'Invalid IFSC code format';
            }
            if (!bankName.trim()) {
                newErrors.bankName = 'Bank name is required';
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // Create payment method object
            const paymentMethod: PaymentMethod = {
                type: paymentType,
                isPrimary: true,
            };

            if (paymentType === 'upi') {
                paymentMethod.upiId = upiId.trim();
            } else {
                paymentMethod.bankDetails = {
                    accountHolderName: accountHolderName.trim(),
                    accountNumber: accountNumber.trim(),
                    ifscCode: ifscCode.toUpperCase().trim(),
                    bankName: bankName.trim(),
                };
            }

            onPaymentMethodSet(paymentMethod);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h2>
                <p className="text-gray-600">
                    Add your payment method to receive funds from your projects
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Payment Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setPaymentType('upi')}
                            className={`p-4 border-2 rounded-lg transition-all ${paymentType === 'upi'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <CreditCard className={`w-8 h-8 mx-auto mb-2 ${paymentType === 'upi' ? 'text-green-600' : 'text-gray-400'
                                }`} />
                            <p className="font-medium text-gray-900">UPI</p>
                            <p className="text-xs text-gray-500 mt-1">Instant transfer</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPaymentType('bank')}
                            className={`p-4 border-2 rounded-lg transition-all ${paymentType === 'bank'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Building2 className={`w-8 h-8 mx-auto mb-2 ${paymentType === 'bank' ? 'text-green-600' : 'text-gray-400'
                                }`} />
                            <p className="font-medium text-gray-900">Bank Account</p>
                            <p className="text-xs text-gray-500 mt-1">Direct deposit</p>
                        </button>
                    </div>
                </div>

                {/* UPI Form */}
                {paymentType === 'upi' && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-2">
                                UPI ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="upiId"
                                value={upiId}
                                onChange={(e) => {
                                    setUpiId(e.target.value);
                                    setErrors({ ...errors, upiId: '' });
                                }}
                                placeholder="yourname@paytm"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.upiId ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.upiId && (
                                <p className="text-sm text-red-600 mt-1">{errors.upiId}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Enter your UPI ID (e.g., yourname@paytm, yourname@oksbi)
                            </p>
                        </div>
                    </div>
                )}

                {/* Bank Account Form */}
                {paymentType === 'bank' && (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-2">
                                Account Holder Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="accountHolderName"
                                value={accountHolderName}
                                onChange={(e) => {
                                    setAccountHolderName(e.target.value);
                                    setErrors({ ...errors, accountHolderName: '' });
                                }}
                                placeholder="As per bank records"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.accountHolderName ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.accountHolderName && (
                                <p className="text-sm text-red-600 mt-1">{errors.accountHolderName}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="accountNumber"
                                value={accountNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    setAccountNumber(value);
                                    setErrors({ ...errors, accountNumber: '' });
                                }}
                                placeholder="Enter account number"
                                maxLength={18}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.accountNumber ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.accountNumber && (
                                <p className="text-sm text-red-600 mt-1">{errors.accountNumber}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmAccountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="confirmAccountNumber"
                                value={confirmAccountNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    setConfirmAccountNumber(value);
                                    setErrors({ ...errors, confirmAccountNumber: '' });
                                }}
                                placeholder="Re-enter account number"
                                maxLength={18}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.confirmAccountNumber ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.confirmAccountNumber && (
                                <p className="text-sm text-red-600 mt-1">{errors.confirmAccountNumber}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-2">
                                IFSC Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="ifscCode"
                                value={ifscCode}
                                onChange={(e) => {
                                    setIfscCode(e.target.value.toUpperCase());
                                    setErrors({ ...errors, ifscCode: '' });
                                }}
                                placeholder="SBIN0001234"
                                maxLength={11}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 uppercase ${errors.ifscCode ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.ifscCode && (
                                <p className="text-sm text-red-600 mt-1">{errors.ifscCode}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
                                Bank Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="bankName"
                                value={bankName}
                                onChange={(e) => {
                                    setBankName(e.target.value);
                                    setErrors({ ...errors, bankName: '' });
                                }}
                                placeholder="State Bank of India"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.bankName ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.bankName && (
                                <p className="text-sm text-red-600 mt-1">{errors.bankName}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Why do we need this?</p>
                        <p className="text-xs">
                            This account will be used to transfer funds raised from your projects.
                            You can update this information later from your dashboard.
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
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
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
