import React, { useState } from 'react';
import { DollarSign, TrendingUp, Download, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEarnings } from '../../hooks/useEarnings';
import BankDetailsForm from './BankDetailsForm';
import PayoutRequestForm from './PayoutRequestForm';
import LoadingSpinner from '../common/LoadingSpinner';

export default function EarningsDashboard() {
  const { user } = useAuth();
  const {
    earnings,
    payouts,
    summary,
    loading,
    error,
    processingPayout,
    updateBankDetails,
    withdrawFunds,
    refetch
  } = useEarnings(user?.uid);

  const [showBankForm, setShowBankForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
        <p className="text-red-800 text-center">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-gray-50 rounded-xl p-12 text-center">
        <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Earnings Data</h3>
        <p className="text-gray-600">Start receiving donations to see your earnings here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner - Mocked System */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg mb-1">Demo Payment System</h3>
            <p className="text-sm opacity-90">
              This is a mocked payment system for demonstration purposes. No real money will be transferred.
              Bank details and payouts are simulated for testing the interface.
            </p>
          </div>
        </div>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRaised)}</p>
          <p className="text-sm text-gray-600">Total Raised</p>
          <p className="text-xs text-gray-500 mt-1">All time earnings</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.availableBalance)}</p>
          <p className="text-sm text-gray-600">Available Balance</p>
          <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.pendingBalance)}</p>
          <p className="text-sm text-gray-600">Pending Balance</p>
          <p className="text-xs text-gray-500 mt-1">Being processed</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Download className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalWithdrawn)}</p>
          <p className="text-sm text-gray-600">Total Withdrawn</p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>
      </div>

      {/* Platform Fee Info */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-900">Platform Fee: {summary.platformFeePercentage}%</p>
            <p className="text-xs text-orange-700 mt-1">
              Total platform fees: {formatCurrency(summary.platformFees)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-orange-700">Net earnings after fees</p>
            <p className="text-lg font-bold text-orange-900">
              {formatCurrency(summary.totalRaised - summary.platformFees)}
            </p>
          </div>
        </div>
      </div>

      {/* Bank Details & Withdrawal Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
            {summary.hasBankDetails && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Verified
              </span>
            )}
          </div>

          {summary.hasBankDetails && earnings?.bankDetails ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Account Holder</p>
                <p className="font-medium text-gray-900">{earnings.bankDetails.accountHolderName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Number</p>
                <p className="font-medium text-gray-900">{earnings.bankDetails.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">IFSC Code</p>
                <p className="font-medium text-gray-900">{earnings.bankDetails.ifscCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bank Name</p>
                <p className="font-medium text-gray-900">{earnings.bankDetails.bankName}</p>
              </div>
              <button
                onClick={() => setShowBankForm(true)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Update Bank Details
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No bank details added yet</p>
              <button
                onClick={() => setShowBankForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
              >
                Add Bank Details
              </button>
            </div>
          )}
        </div>

        {/* Withdrawal */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Funds</h3>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Available to withdraw</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary.availableBalance)}</p>
          </div>

          {summary.availableBalance >= 500 ? (
            <button
              onClick={() => setShowPayoutForm(true)}
              disabled={!summary.hasBankDetails || processingPayout}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {processingPayout ? (
                <>
                  <LoadingSpinner size="sm" color="text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Withdraw Funds</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Minimum withdrawal: ₹500</p>
              <p className="text-xs text-gray-500 mt-1">
                Need {formatCurrency(500 - summary.availableBalance)} more
              </p>
            </div>
          )}

          {!summary.hasBankDetails && (
            <p className="text-xs text-amber-600 mt-3 text-center">
              Please add bank details to withdraw funds
            </p>
          )}
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
        </div>

        {payouts && payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payout.requestedAt.toDate().toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center space-x-2">
                        {payout.method === 'upi' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                        <span className="capitalize">{payout.method.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {payout.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                        {getStatusIcon(payout.status)}
                        <span className="capitalize">{payout.status}</span>
                      </span>
                      {payout.status === 'failed' && payout.failureReason && (
                        <p className="text-xs text-red-600 mt-1">{payout.failureReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Download className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No payout history yet</p>
            <p className="text-sm text-gray-500 mt-1">Withdrawals will appear here</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBankForm && (
        <BankDetailsForm
          isOpen={showBankForm}
          onClose={() => setShowBankForm(false)}
          onSubmit={async (details) => {
            await updateBankDetails(details);
            setShowBankForm(false);
            refetch();
          }}
          existingDetails={earnings?.bankDetails}
        />
      )}

      {showPayoutForm && (
        <PayoutRequestForm
          isOpen={showPayoutForm}
          onClose={() => setShowPayoutForm(false)}
          availableBalance={summary.availableBalance}
          onSubmit={async (amount, method, upiId) => {
            await withdrawFunds(amount, method, upiId);
            setShowPayoutForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
