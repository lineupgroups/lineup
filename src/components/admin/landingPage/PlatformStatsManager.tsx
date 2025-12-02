import React, { useState } from 'react';
import { BarChart3, RefreshCw, Save } from 'lucide-react';
import { usePlatformStats } from '../../../hooks/useLandingPage';
import { updateManualStats, calculatePlatformStats } from '../../../lib/landingPage';
import toast from 'react-hot-toast';

export default function PlatformStatsManager() {
  const { stats, loading } = usePlatformStats();
  const [manualStats, setManualStats] = useState({
    totalProjectsCreated: 0,
    totalProjectsFunded: 0,
    totalAmountRaised: 0,
    totalSupporters: 0,
    successRate: 0
  });
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      await calculatePlatformStats();
      toast.success('Statistics calculated and updated!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to calculate statistics');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveManual = async () => {
    try {
      await updateManualStats(manualStats);
      toast.success('Manual statistics saved!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Statistics Manager</h2>

      {/* Current Stats */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-4">Current Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats?.totalProjectsCreated || 0}</div>
            <div className="text-sm text-gray-600">Projects Created</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats?.totalProjectsFunded || 0}</div>
            <div className="text-sm text-gray-600">Projects Funded</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">₹{(stats?.totalAmountRaised || 0).toLocaleString('en-IN')}</div>
            <div className="text-sm text-gray-600">Total Raised</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats?.successRate || 0}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
        >
          <RefreshCw className={`w-5 h-5 ${isCalculating ? 'animate-spin' : ''}`} />
          Recalculate from Database
        </button>
      </div>

      {/* Manual Stats Override */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Manual Statistics Override</h3>
        <p className="text-sm text-gray-600 mb-4">Use these values when "Manual" mode is enabled in Settings</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Total Projects</label>
            <input
              type="number"
              value={manualStats.totalProjectsCreated}
              onChange={(e) => setManualStats({ ...manualStats, totalProjectsCreated: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Projects Funded</label>
            <input
              type="number"
              value={manualStats.totalProjectsFunded}
              onChange={(e) => setManualStats({ ...manualStats, totalProjectsFunded: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Total Amount Raised (₹)</label>
            <input
              type="number"
              value={manualStats.totalAmountRaised}
              onChange={(e) => setManualStats({ ...manualStats, totalAmountRaised: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Success Rate (%)</label>
            <input
              type="number"
              value={manualStats.successRate}
              onChange={(e) => setManualStats({ ...manualStats, successRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={handleSaveManual}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
        >
          <Save className="w-5 h-5" />
          Save Manual Statistics
        </button>
      </div>
    </div>
  );
}

