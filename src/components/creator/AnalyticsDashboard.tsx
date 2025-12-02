import React, { useState } from 'react';
import { TrendingUp, Users, Eye, Share2, Heart, MapPin, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useProjectDonations } from '../../hooks/useProjectDonations';
import LoadingSpinner from '../common/LoadingSpinner';
import { DonationAnalytics } from '../analytics/DonationAnalytics';
import { InsightsPanel } from './InsightsPanel';

interface AnalyticsDashboardProps {
  projectId: string;
}

export default function AnalyticsDashboard({ projectId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const { analytics, geographicData, loading, error } = useAnalytics(projectId, timeRange);
  const { donations, loading: donationsLoading } = useProjectDonations(projectId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
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
        <p className="text-red-800">Error loading analytics: {error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 rounded-xl p-12 text-center">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Analytics data will appear once your project starts receiving activity.</p>
      </div>
    );
  }

  const topCities = geographicData?.cities.slice(0, 5) || [];
  const topStates = geographicData?.states.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Project Analytics</h2>
        <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as 7 | 30 | 90)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === days
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Smart Insights */}
      <InsightsPanel donations={donations} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Total Views</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.totalUniqueVisitors} unique visitors</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalSupporters}</p>
          <p className="text-sm text-gray-600">Total Supporters</p>
          <p className="text-xs text-gray-500 mt-1">{formatCurrency(analytics.totalAmountRaised)} raised</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="w-5 h-5 text-red-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalLikes}</p>
          <p className="text-sm text-gray-600">Total Likes</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.totalFollows} follows</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalShares}</p>
          <p className="text-sm text-gray-600">Total Shares</p>
          <p className="text-xs text-gray-500 mt-1">{analytics.totalComments} comments</p>
        </div>
      </div>

      {/* Detailed Donation Analytics */}
      <DonationAnalytics donations={donations} isLoading={donationsLoading} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funding Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Trend</h3>
          {analytics.dailyData && analytics.dailyData.length > 0 ? (
            <div className="space-y-3">
              {analytics.dailyData.slice(0, 7).reverse().map((day) => {
                const maxAmount = Math.max(...analytics.dailyData.map(d => d.amountRaised));
                const width = maxAmount > 0 ? (day.amountRaised / maxAmount) * 100 : 0;

                return (
                  <div key={day.date} className="flex items-center space-x-3">
                    <div className="w-24 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-6 rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          {formatCurrency(day.amountRaised)}
                        </span>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">
                      {day.supporters}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No funding data yet</p>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            {[
              { icon: Smartphone, label: 'Mobile', count: analytics.deviceBreakdown.mobile, color: 'bg-blue-500' },
              { icon: Monitor, label: 'Desktop', count: analytics.deviceBreakdown.desktop, color: 'bg-green-500' },
              { icon: Tablet, label: 'Tablet', count: analytics.deviceBreakdown.tablet, color: 'bg-purple-500' }
            ].map(({ icon: Icon, label, count, color }) => {
              const total = analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.desktop + analytics.deviceBreakdown.tablet;
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                    <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Geographic Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Cities</h3>
          </div>
          {topCities.length > 0 ? (
            <div className="space-y-3">
              {topCities.map((city, index) => (
                <div key={city.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{city.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${city.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {city.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No geographic data yet</p>
          )}
        </div>

        {/* Top States */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top States</h3>
          </div>
          {topStates.length > 0 ? (
            <div className="space-y-3">
              {topStates.map((state, index) => (
                <div key={state.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{state.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${state.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {state.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No geographic data yet</p>
          )}
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-sm p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Conversion Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-2xl font-bold">
              {analytics.totalViews > 0
                ? ((analytics.totalSupporters / analytics.totalViews) * 100).toFixed(2)
                : 0}%
            </p>
            <p className="text-sm opacity-90">View to Support Rate</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-2xl font-bold">
              {analytics.totalSupporters > 0
                ? formatCurrency(analytics.totalAmountRaised / analytics.totalSupporters)
                : formatCurrency(0)}
            </p>
            <p className="text-sm opacity-90">Average Donation</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-2xl font-bold">
              {analytics.totalLikes > 0
                ? ((analytics.totalSupporters / analytics.totalLikes) * 100).toFixed(2)
                : 0}%
            </p>
            <p className="text-sm opacity-90">Like to Support Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
