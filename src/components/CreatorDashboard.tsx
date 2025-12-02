import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, DollarSign, Rocket, Edit3, Heart, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjectsByCreator } from '../hooks/useProjects';
import { useDailyRevenue } from '../hooks/useDailyRevenue';
import { useAnalytics } from '../hooks/useAnalytics';
import LoadingSpinner from './common/LoadingSpinner';
import ActivityFeed from './creator/ActivityFeed';
import RecentSupportersWidget from './creator/RecentSupportersWidget';

interface CreatorDashboardProps {
  onBack: () => void;
}

export default function CreatorDashboard({ onBack }: CreatorDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects: userProjects, loading, error } = useProjectsByCreator(user?.uid || '');
  const { revenueData, loading: revenueLoading } = useDailyRevenue(user?.uid || '', 7);

  // Get analytics for first active project to show total views
  const firstActiveProject = userProjects.find(p => p.status === 'active');
  const { analytics } = useAnalytics(firstActiveProject?.id || '', 30);

  // Calculate summary statistics
  const { totalRaised, totalSupporters, totalViews, activeProjects } = useMemo(() => {
    const baseStats = userProjects.reduce(
      (acc, project) => ({
        totalRaised: acc.totalRaised + (project.raised || 0),
        totalSupporters: acc.totalSupporters + (project.supporters || 0),
        totalViews: acc.totalViews + (project.views || 0),
        activeProjects: project.status === 'active' ? acc.activeProjects + 1 : acc.activeProjects
      }),
      { totalRaised: 0, totalSupporters: 0, totalViews: 0, activeProjects: 0 }
    );

    // Use analytics data if available for more accurate view count
    if (analytics?.totalViews) {
      baseStats.totalViews = analytics.totalViews;
    }

    return baseStats;
  }, [userProjects, analytics]);

  // Generate chart data for last 7 days from real revenue data
  const chartData = useMemo(() => {
    if (!revenueData || revenueData.length === 0) {
      // Fallback to empty chart
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map(day => ({ day, amount: 0 }));
    }

    return revenueData.map((data, index) => {
      const date = new Date(data.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        day: dayName,
        amount: data.amount
      };
    });
  }, [revenueData]);

  const maxAmount = useMemo(() =>
    chartData.length > 0 ? Math.max(...chartData.map(d => d.amount)) : 1,
    [chartData]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Security check
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access the Creator Dashboard.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user.displayName || 'Creator'}! Here's your overview.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/projects/create')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
            >
              <Rocket className="w-5 h-5" />
              <span>Create Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Raised */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalRaised)}</h3>
              <p className="text-sm text-gray-600 mt-1">Total Raised</p>
              <p className="text-xs text-gray-500 mt-1">Total across all projects</p>
            </div>

            {/* Total Supporters */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{totalSupporters}</h3>
              <p className="text-sm text-gray-600 mt-1">Total Supporters</p>
              <p className="text-xs text-gray-500 mt-1">Across all projects</p>
            </div>

            {/* Total Views */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{totalViews}</h3>
              <p className="text-sm text-gray-600 mt-1">Total Views</p>
              <p className="text-xs text-gray-500 mt-1">Estimated based on engagement</p>
            </div>

            {/* Active Projects */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Rocket className="w-6 h-6 text-orange-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{activeProjects}</h3>
              <p className="text-sm text-gray-600 mt-1">Active Projects</p>
              <p className="text-xs text-gray-500 mt-1">All status types</p>
            </div>
          </div>

          {/* Weekly Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Weekly Revenue</h2>
              <span className="text-sm text-gray-500">Last 7 days</span>
            </div>

            {revenueLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : chartData.every(d => d.amount === 0) ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <BarChart3 className="w-12 h-12 mb-2" />
                <p>No revenue data yet</p>
                <p className="text-sm mt-1">Data will appear when you receive pledges</p>
              </div>
            ) : (
              <div className="h-64">
                <div className="flex items-end justify-between h-full space-x-2">
                  {chartData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex items-end justify-center h-48">
                        <div
                          className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                          style={{ height: `${maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatCurrency(data.amount)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 mt-2">{data.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Manage Projects */}
            <button
              onClick={() => navigate('/dashboard/projects/create')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Rocket className="w-6 h-6 text-orange-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Project</h3>
              <p className="text-sm text-gray-600">
                Start a new crowdfunding campaign in 4 easy steps
              </p>
            </button>

            {/* Post Update */}
            <button
              onClick={() => navigate('/dashboard/updates')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Edit3 className="w-6 h-6 text-blue-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Post Update</h3>
              <p className="text-sm text-gray-600">
                Share progress with your supporters
              </p>
            </button>

            {/* View Analytics */}
            <button
              onClick={() => navigate('/dashboard/analytics')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Analytics</h3>
              <p className="text-sm text-gray-600">
                Track views, engagement, and geographic data
              </p>
            </button>

            {/* View Supporters */}
            <button
              onClick={() => navigate('/dashboard/supporters')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-green-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Supporters</h3>
              <p className="text-sm text-gray-600">
                See who's backing your projects
              </p>
            </button>

            {/* Manage Earnings */}
            <button
              onClick={() => navigate('/dashboard/earnings')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-yellow-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Earnings</h3>
              <p className="text-sm text-gray-600">
                View balance and request withdrawals
              </p>
            </button>

            {/* View Comments */}
            <button
              onClick={() => navigate('/dashboard/engagement')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Comments</h3>
              <p className="text-sm text-gray-600">
                See what supporters are saying
              </p>
              <p className="text-xs text-indigo-600 mt-2 font-medium">
                ✓ Comments enabled for all supporters
              </p>
            </button>
          </div>

          {/* Recent Activity & Supporters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              {user?.uid && <ActivityFeed creatorId={user.uid} limit={10} />}
            </div>

            {/* Recent Supporters */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Supporters</h2>
              {user?.uid && <RecentSupportersWidget creatorId={user.uid} limit={5} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
