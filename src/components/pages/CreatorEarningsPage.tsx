import React from 'react';
import EarningsDashboard from '../earnings/EarningsDashboard';

export default function CreatorEarningsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings</h1>
          <p className="text-gray-600">
            Manage your earnings, withdrawals, and payment settings
          </p>
        </div>

        {/* Earnings Dashboard */}
        <EarningsDashboard />
      </div>
    </div>
  );
}
