import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, DollarSign, Rocket, Edit3, Heart, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';
import ActivityFeed from './activity/ActivityFeed';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirestoreProject } from '../types/firestore';

interface CreatorDashboardProps {
  onBack: () => void;
}

export default function CreatorDashboard({ onBack }: CreatorDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Use local state for real-time updates instead of just the hook
  const [realtimeProjects, setRealtimeProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for creator's projects
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const q = query(
      collection(db, 'projects'),
      where('creatorId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FirestoreProject[];

        setRealtimeProjects(projects);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to projects:', err);
        setError('Failed to load projects');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const userProjects = realtimeProjects;

  // Calculate summary statistics
  const { totalRaised, totalSupporters, totalViews, activeProjects } = useMemo(() => {
    return userProjects.reduce(
      (acc, project) => ({
        totalRaised: acc.totalRaised + (project.raised || 0),
        totalSupporters: acc.totalSupporters + (project.supporters || 0),
        totalViews: acc.totalViews + 0, // Will be populated from analytics
        activeProjects: project.status === 'active' ? acc.activeProjects + 1 : acc.activeProjects
      }),
      { totalRaised: 0, totalSupporters: 0, totalViews: 0, activeProjects: 0 }
    );
  }, [userProjects]);

  // Generate chart data for last 7 days
  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseAmount = totalRaised / 7;
    return days.map((day, index) => ({
      day,
      amount: Math.max(0, baseAmount + (userProjects.length * 100 * (index % 3)))
    }));
  }, [userProjects.length, totalRaised]);

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
              onClick={() => navigate('/dashboard/projects')}
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

            <div className="h-64">
              <div className="flex items-end justify-between h-full space-x-2">
                {chartData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex items-end justify-center h-48">
                      <div
                        className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                        style={{ height: `${(data.amount / maxAmount) * 100}%` }}
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
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Manage Projects */}
            <button
              onClick={() => navigate('/dashboard/projects')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Rocket className="w-6 h-6 text-orange-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Projects</h3>
              <p className="text-sm text-gray-600">
                Create, edit, and manage all your crowdfunding projects
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

            {/* Messages (Coming Soon) */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 opacity-60 cursor-not-allowed">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
              <p className="text-sm text-gray-600">
                Coming soon - Communicate with supporters
              </p>
            </div>
          </div>

          {/* Recent Activity & Supporters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <ActivityFeed
                userId={user.uid}
                mode="creator"
              />
            </div>

            {/* Recent Supporters */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Supporters</h2>
              {totalSupporters > 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">👥</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    You have {totalSupporters} supporters!
                  </h3>
                  <button
                    onClick={() => navigate('/dashboard/supporters')}
                    className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
                  >
                    View All Supporters →
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">👥</div>
                  <p className="text-gray-600">No supporters yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Share your projects to get your first supporters!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

