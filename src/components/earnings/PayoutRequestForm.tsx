import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Smartphone, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PayoutRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSubmit: (amount: number, method: 'bank_transfer' | 'upi', upiId?: string) => Promise<void>;
}

export default function PayoutRequestForm({
  isOpen,
  onClose,
  availableBalance,
  onSubmit
}: PayoutRequestFormProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank_transfer' | 'upi'>('bank_transfer');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);

    // Validation
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (numAmount < 500) {
      toast.error('Minimum withdrawal amount is ₹500');
      return;
    }

    if (numAmount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (method === 'upi' && !upiId.trim()) {
      toast.error('Please enter UPI ID');
      return;
    }

    if (method === 'upi' && !upiId.includes('@')) {
      toast.error('Invalid UPI ID format');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(numAmount, method, method === 'upi' ? upiId : undefined);
    } catch (error) {
      console.error('Error requesting payout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [500, 1000, 2500, 5000];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
              <p className="text-sm text-gray-600">
                Available: {formatCurrency(availableBalance)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Demo Warning */}
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">
              This is a simulated payout. The process will be demonstrated but no real money will be transferred.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="500"
                max={availableBalance}
                step="100"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                required
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: ₹500 | Maximum: {formatCurrency(availableBalance)}
            </p>

            {/* Quick Amounts */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={quickAmount > availableBalance || isSubmitting}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ₹{quickAmount}
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawal Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Withdrawal Method *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  method === 'bank_transfer'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
                disabled={isSubmitting}
              >
                <div className="flex flex-col items-center space-y-2">
                  <CreditCard className={`w-6 h-6 ${method === 'bank_transfer' ? 'text-orange-600' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${method === 'bank_transfer' ? 'text-orange-600' : 'text-gray-700'}`}>
                    Bank Transfer
                  </span>
                  <span className="text-xs text-gray-500">2-3 business days</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  method === 'upi'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
                disabled={isSubmitting}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Smartphone className={`w-6 h-6 ${method === 'upi' ? 'text-orange-600' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${method === 'upi' ? 'text-orange-600' : 'text-gray-700'}`}>
                    UPI
                  </span>
                  <span className="text-xs text-gray-500">Instant</span>
                </div>
              </button>
            </div>
          </div>

          {/* UPI ID Input */}
          {method === 'upi' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID *
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@paytm"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe)
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Withdrawal Amount</span>
              <span className="font-medium text-gray-900">
                {amount ? formatCurrency(parseFloat(amount)) : '₹0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Processing Fee</span>
              <span className="font-medium text-gray-900">₹0</span>
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">You'll Receive</span>
              <span className="font-bold text-green-600">
                {amount ? formatCurrency(parseFloat(amount)) : '₹0'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || parseFloat(amount) < 500}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
