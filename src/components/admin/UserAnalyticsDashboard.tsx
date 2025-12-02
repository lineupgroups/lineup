import React from 'react';
import { Users, TrendingUp, MapPin, Activity } from 'lucide-react';
import { useUserAnalytics } from '../../hooks/useUserAnalytics';

export default function UserAnalyticsDashboard() {
  const { analytics, loading, error } = useUserAnalytics();

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (error || !analytics) {
    return <div className="text-center py-8 text-red-600">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalUsers}</p>
          <p className="text-sm text-gray-500 mt-2">
            {analytics.activeUsers} active ({Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}%)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Creators</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.creators}</p>
          <p className="text-sm text-gray-500 mt-2">
            {analytics.verifiedCreators} verified
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Supporters</h3>
            <Activity className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.supporters}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Moderation</h3>
            <Users className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm text-gray-600">
            Suspended: <span className="font-semibold">{analytics.suspendedUsers}</span>
          </p>
          <p className="text-sm text-gray-600">
            Banned: <span className="font-semibold">{analytics.bannedUsers}</span>
          </p>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth (Last 30 Days)</h3>
        <div className="h-64">
          {/* Simple bar chart using CSS */}
          <div className="flex items-end justify-between h-full space-x-1">
            {analytics.userGrowth.slice(-30).map((day, index) => {
              const maxCount = Math.max(...analytics.userGrowth.map(d => d.count));
              const height = (day.count / maxCount) * 100;
              
              return (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.count} users`}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.date}: {day.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Creator vs Supporter Ratio */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {analytics.creatorVsSupporterRatio.creators}
            </p>
            <p className="text-sm text-gray-600">Only Creators</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {analytics.creatorVsSupporterRatio.supporters}
            </p>
            <p className="text-sm text-gray-600">Only Supporters</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {analytics.creatorVsSupporterRatio.both}
            </p>
            <p className="text-sm text-gray-600">Both</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">
              {analytics.creatorVsSupporterRatio.neitherYet}
            </p>
            <p className="text-sm text-gray-600">Neither Yet</p>
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top States */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top States</h3>
          </div>
          <div className="space-y-3">
            {analytics.geographicDistribution.slice(0, 10).map((state, index) => {
              const maxCount = analytics.geographicDistribution[0]?.count || 1;
              const percentage = (state.count / maxCount) * 100;
              
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{state.state}</span>
                    <span className="text-gray-600">{state.count} users</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Cities</h3>
          </div>
          <div className="space-y-3">
            {analytics.cityDistribution.slice(0, 10).map((city, index) => {
              const maxCount = analytics.cityDistribution[0]?.count || 1;
              const percentage = (city.count / maxCount) * 100;
              
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{city.city}</span>
                    <span className="text-gray-600">{city.count} users</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Retention Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Retention</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 border-2 border-blue-200 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{analytics.retentionMetrics.week1}%</p>
            <p className="text-sm text-gray-600 mt-2">1 Week Retention</p>
            <p className="text-xs text-gray-500">Still active after 1 week</p>
          </div>
          <div className="text-center p-4 border-2 border-green-200 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{analytics.retentionMetrics.week2}%</p>
            <p className="text-sm text-gray-600 mt-2">2 Week Retention</p>
            <p className="text-xs text-gray-500">Still active after 2 weeks</p>
          </div>
          <div className="text-center p-4 border-2 border-purple-200 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{analytics.retentionMetrics.month1}%</p>
            <p className="text-sm text-gray-600 mt-2">1 Month Retention</p>
            <p className="text-xs text-gray-500">Still active after 1 month</p>
          </div>
        </div>
      </div>
    </div>
  );
}


