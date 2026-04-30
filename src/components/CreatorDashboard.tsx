import { useMemo, useEffect, useState, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, DollarSign, Rocket,
  Wallet, Target, ArrowUpRight,
  ArrowDownRight, Clock, RefreshCw, TrendingUp, AlertTriangle, Sparkles, Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProjectsByCreator } from '../hooks/useProjects';
import { useAnalytics } from '../hooks/useAnalytics';
import { useEarnings } from '../hooks/useEarnings';
import { useDailyRevenue } from '../hooks/useDailyRevenue';
import { useProjectContext } from '../hooks/useProjectContext';
import { useUnrepliedComments } from '../hooks/useUnrepliedComments';
import { useNewBackersSinceLastVisit } from '../hooks/useNewBackersSinceLastVisit';
import { useGoalAchievements } from '../hooks/useGoalAchievements';
import { useRateLimit } from '../hooks/useRateLimit';
import { DashboardSkeleton } from './common/LoadingSpinner';
import PageTitle from './common/PageTitle';
import RealTimeIndicator from './common/RealTimeIndicator';
import OfflinePage from './common/OfflinePage';
import ActivityFeed from './creator/ActivityFeed';
import RecentSupportersWidget from './creator/RecentSupportersWidget';
import ActionAlertsBanner from './creator/ActionAlertsBanner';
import RevenueChart from './creator/RevenueChart';
import ProjectMilestones from './creator/ProjectMilestones';
import GoalCelebration from './creator/GoalCelebration';
import QuickActionsGrid from './creator/QuickActionsGrid';
import ShareMilestoneModal from './creator/ShareMilestoneModal';
import DashboardOnboarding, { useDashboardOnboarding } from './creator/DashboardOnboarding';
import WithdrawalHistoryWidget from './creator/WithdrawalHistoryWidget';
import CountUp from './animations/CountUp';
import toast from 'react-hot-toast';

interface CreatorDashboardProps {
  onBack: () => void;
}

// Memoized Trend Indicator component
const TrendIndicator = memo(({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) => {
  const diff = current - previous;

  if (current === 0 && previous === 0) {
    return <span className="text-xs text-neutral-500">No data yet</span>;
  }

  if (previous === 0 && current > 0) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-brand-acid">
        <ArrowUpRight className="w-3 h-3 mr-0.5" />
        +100%{suffix}
      </span>
    );
  }

  if (current === 0 && previous > 0) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-neutral-500">
        <ArrowDownRight className="w-3 h-3 mr-0.5" />
        No activity{suffix}
      </span>
    );
  }

  const percentChange = ((diff / previous) * 100);
  const isPositive = diff >= 0;
  const displayPercent = Math.abs(percentChange) > 999 ? '999+' : Math.abs(percentChange).toFixed(1);

  return (
    <span className={`inline-flex items-center text-xs font-medium ${isPositive ? 'text-brand-acid' : 'text-brand-orange'}`}>
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3 mr-0.5" />
      ) : (
        <ArrowDownRight className="w-3 h-3 mr-0.5" />
      )}
      {isPositive ? '+' : '-'}{displayPercent}%{suffix}
    </span>
  );
});

TrendIndicator.displayName = 'TrendIndicator';

export default function CreatorDashboard({ onBack }: CreatorDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects: userProjects, loading, error, refetch } = useProjectsByCreator(user?.uid || '');
  const { summary: earningsSummary } = useEarnings(user?.uid);

  // State management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    projectTitle: string;
    projectId: string;
    raised: number;
    goal: number;
    percentFunded: number;
    backerCount: number;
    daysLeft: number;
  } | null>(null);

  // Onboarding
  const { showOnboarding, completeOnboarding } = useDashboardOnboarding();

  // Rate limiting for refresh
  const { execute: executeWithRateLimit, isRateLimited, remainingTime } = useRateLimit({
    minInterval: 3000, // 3 seconds minimum between refreshes
    maxCalls: 10, // Max 10 refreshes per minute
    timeWindow: 60000
  });

  // Get project context for filtering
  const { selectedProjectId, selectedProject } = useProjectContext();
  const isFilteringByProject = selectedProject !== null;

  // Get unreplied comments count
  const { unrepliedCount } = useUnrepliedComments(user?.uid || '');
  const { newBackersCount } = useNewBackersSinceLastVisit(user?.uid || '');

  // Goal achievement celebrations
  const { newAchievement, dismissCelebration } = useGoalAchievements(userProjects || []);

  // Get the effective projects list
  const effectiveProjects = useMemo(() => {
    const projects = userProjects || [];
    if (selectedProjectId) {
      return projects.filter(p => p.id === selectedProjectId);
    }
    return projects;
  }, [userProjects, selectedProjectId]);

  // Get revenue data for trends
  const { revenueData: currentWeekRevenue } = useDailyRevenue(user?.uid || '', 7);
  const { revenueData: lastWeekRevenue } = useDailyRevenue(user?.uid || '', 14);

  // Get analytics for selected project
  const analyticsProjectId = selectedProjectId || effectiveProjects.find(p => p.status === 'active')?.id || '';
  const { analytics } = useAnalytics(analyticsProjectId, 30);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const baseStats = effectiveProjects.reduce(
      (acc, project) => ({
        totalRaised: acc.totalRaised + (project.raised || 0),
        totalSupporters: acc.totalSupporters + (project.supporters || 0),
        totalViews: acc.totalViews + (project.views || 0),
        activeProjects: project.status === 'active' ? acc.activeProjects + 1 : acc.activeProjects,
        pendingProjects: project.status === 'pending' ? acc.pendingProjects + 1 : acc.pendingProjects
      }),
      { totalRaised: 0, totalSupporters: 0, totalViews: 0, activeProjects: 0, pendingProjects: 0 }
    );

    if (analytics?.totalViews && selectedProjectId) {
      baseStats.totalViews = analytics.totalViews;
    }

    return baseStats;
  }, [effectiveProjects, analytics, selectedProjectId]);

  // Fixed trend calculation - uses actual week comparison
  const weeklyTrends = useMemo(() => {
    if (!currentWeekRevenue || !lastWeekRevenue) {
      return { revenue: { current: 0, previous: 0 }, supporters: { current: 0, previous: 0 } };
    }

    const thisWeekTotal = currentWeekRevenue.reduce((sum, d) => sum + d.amount, 0);

    // Get last week's data properly by comparing dates
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    const lastWeekTotal = lastWeekRevenue
      .filter(d => {
        const date = new Date(d.date);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      })
      .reduce((sum, d) => sum + d.amount, 0);

    const thisWeekSupporters = currentWeekRevenue.reduce((sum, d) => sum + d.supporters, 0);
    const lastWeekSupporters = lastWeekRevenue
      .filter(d => {
        const date = new Date(d.date);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      })
      .reduce((sum, d) => sum + d.supporters, 0);

    return {
      revenue: { current: thisWeekTotal, previous: lastWeekTotal },
      supporters: { current: thisWeekSupporters, previous: lastWeekSupporters }
    };
  }, [currentWeekRevenue, lastWeekRevenue]);

  // Calculate conversion rate
  const conversionRate = useMemo(() => {
    if (stats.totalViews === 0) return null;
    if (stats.totalSupporters > 0) {
      return ((stats.totalSupporters / stats.totalViews) * 100).toFixed(2);
    }
    return '0.00';
  }, [stats]);

  // Rate-limited refresh handler
  const handleRefresh = useCallback(async () => {
    const result = await executeWithRateLimit(async () => {
      setIsRefreshing(true);
      try {
        await refetch();
        setLastRefreshed(new Date());
        return true;
      } catch (err) {
        toast.error('Failed to refresh data. Please try again.');
        console.error('Refresh error:', err);
        return false;
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    });

    if (result === null) {
      toast.error(`Please wait ${Math.ceil(remainingTime / 1000)}s before refreshing again.`);
    }
  }, [executeWithRateLimit, refetch, remainingTime]);

  // Auto-refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceRefresh = Date.now() - lastRefreshed.getTime();
        if (timeSinceRefresh > 120000) {
          handleRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lastRefreshed, handleRefresh]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored!');
      handleRefresh();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleRefresh]);

  // Handle milestone share
  const handleMilestoneShare = useCallback((project: typeof userProjects[0], milestone: number) => {
    const daysLeft = project.deadline
      ? Math.max(0, Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    setShareModalData({
      isOpen: true,
      projectTitle: project.title,
      projectId: project.id,
      raised: project.raised || 0,
      goal: project.goal || 0,
      percentFunded: milestone,
      backerCount: project.supporters || 0,
      daysLeft
    });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  // Security check
  if (!user) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center font-sans">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-[#111] border border-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brand-acid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-brand-white mb-4">Authentication Required</h2>
          <p className="text-neutral-400 mb-6">
            You need to be logged in to access the Creator Dashboard.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-brand-acid text-brand-black rounded-xl font-bold hover:bg-[#b3e600] transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(204,255,0,0.2)]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Offline state
  if (!isOnline) {
    return <OfflinePage onRetry={handleRefresh} onGoHome={() => navigate('/')} />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black text-brand-white py-8 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-6">
                  <div className="h-10 bg-neutral-800 rounded-lg w-1/3"></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-32 bg-neutral-800 rounded-2xl"></div>
                      ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 h-80 bg-neutral-800 rounded-2xl"></div>
                      <div className="h-80 bg-neutral-800 rounded-2xl"></div>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center font-sans">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-[#111] border border-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-brand-orange" />
          </div>
          <h2 className="text-2xl font-bold text-brand-white mb-4">Something went wrong</h2>
          <p className="text-neutral-400 mb-2">{error}</p>
          <p className="text-sm text-neutral-500 mb-6">
            Please check your connection and try again.
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRateLimited}
            className="px-6 py-3 bg-brand-acid text-brand-black rounded-xl font-bold hover:bg-[#b3e600] transition-all disabled:opacity-50 flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(204,255,0,0.2)]"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black text-brand-white font-sans pb-12">
      {/* Onboarding */}
      <DashboardOnboarding
        isOpen={showOnboarding}
        onComplete={completeOnboarding}
        userName={user.displayName || 'Creator'}
      />

      {/* Goal Achievement Celebration */}
      {newAchievement && (
        <GoalCelebration
          isOpen={true}
          onClose={dismissCelebration}
          projectTitle={newAchievement.projectTitle}
          projectId={newAchievement.projectId}
          raised={newAchievement.raised}
          goal={newAchievement.goal}
          percentFunded={newAchievement.percentFunded}
        />
      )}

      {/* Share Milestone Modal */}
      {shareModalData && (
        <ShareMilestoneModal
          isOpen={shareModalData.isOpen}
          onClose={() => setShareModalData(null)}
          projectTitle={shareModalData.projectTitle}
          projectId={shareModalData.projectId}
          raised={shareModalData.raised}
          goal={shareModalData.goal}
          percentFunded={shareModalData.percentFunded}
          backerCount={shareModalData.backerCount}
          daysLeft={shareModalData.daysLeft}
        />
      )}

      {/* Dynamic Page Title */}
      <PageTitle title="Dashboard" description="Your creator dashboard overview" />

      {/* Header - Editorial Style */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-brand-orange/10 rounded-3xl border border-brand-orange/20 shadow-[0_0_20px_rgba(255,91,0,0.1)] transition-transform hover:scale-105 duration-500">
                  <Rocket className="w-8 h-8 text-brand-orange" />
                </div>
                <span className="px-4 py-1.5 bg-brand-acid/10 text-brand-acid text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-acid/20">
                  Control Center
                </span>
                <RealTimeIndicator
                    lastRefreshed={lastRefreshed}
                    isRefreshing={isRefreshing}
                    isConnected={isOnline}
                    onRefresh={handleRefresh}
                />
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
                Creator <span className="text-brand-acid">Studio</span>
              </h1>
              <p className="text-lg sm:text-xl text-neutral-400 font-medium mt-6 max-w-2xl leading-relaxed">
                {isFilteringByProject
                  ? <>Analyzing performance for <span className="text-brand-white font-black italic">"{selectedProject?.title}"</span></>
                  : <>Welcome back, <span className="text-brand-white font-black italic">{user.displayName || 'Creator'}</span>. Your empire at a glance.</>
                }
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-2">
                {/* Refresh button */}
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isRateLimited}
                    className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-brand-white rounded-2xl font-black italic uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 group"
                    title={isRateLimited ? `Wait ${Math.ceil(remainingTime / 1000)}s` : 'Sync real-time data'}
                >
                    <RefreshCw className={`w-5 h-5 text-brand-acid ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span>Sync Intel</span>
                </button>

                <button
                    onClick={() => navigate('/dashboard/projects/create')}
                    className="flex items-center gap-3 px-8 py-4 bg-brand-acid text-brand-black rounded-2xl font-black italic uppercase tracking-wider hover:bg-brand-acid shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all transform hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Project</span>
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Summary Cards - Responsive grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Total Raised */}
            <Link
              to="/dashboard/earnings"
              className="bg-[#111] rounded-3xl p-6 border border-neutral-800 hover:border-brand-acid/50 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-acid/10 rounded-2xl text-brand-acid group-hover:bg-brand-acid group-hover:text-brand-black transition-colors">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="hidden sm:block">
                  <TrendIndicator
                    current={weeklyTrends.revenue.current}
                    previous={weeklyTrends.revenue.previous}
                    suffix=" this week"
                  />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-brand-white tracking-tight">
                <CountUp end={stats.totalRaised} prefix="₹" />
              </h3>
              <p className="text-sm text-neutral-400 mt-2 font-medium">Total Raised</p>
              <p className="text-xs text-neutral-500 mt-1 hidden sm:block">
                This week: {formatCurrency(weeklyTrends.revenue.current)}
              </p>
            </Link>

            {/* Card 2: Active Backers */}
            <Link
              to="/dashboard/backers"
              className="bg-[#111] rounded-3xl p-6 border border-neutral-800 hover:border-brand-acid/50 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-acid/10 rounded-2xl text-brand-acid group-hover:bg-brand-acid group-hover:text-brand-black transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div className="hidden sm:block">
                  <TrendIndicator
                    current={weeklyTrends.supporters.current}
                    previous={weeklyTrends.supporters.previous}
                    suffix=" new"
                  />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-brand-white tracking-tight">
                <CountUp end={stats.totalSupporters} />
              </h3>
              <p className="text-sm text-neutral-400 mt-2 font-medium">Active Backers</p>
              <p className="text-xs text-neutral-500 mt-1 hidden sm:block">
                {weeklyTrends.supporters.current > 0
                  ? `${weeklyTrends.supporters.current} new this week`
                  : 'No new backers this week'
                }
              </p>
            </Link>

            {/* Card 3: Available Balance - Now clickable */}
            <Link
              to="/dashboard/earnings"
              className="bg-[#111] rounded-3xl p-6 border border-brand-orange/30 hover:border-brand-orange transition-all duration-300 group cursor-pointer col-span-2 sm:col-span-1 shadow-[0_0_15px_rgba(255,91,0,0.1)] hover:shadow-[0_0_25px_rgba(255,91,0,0.2)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange group-hover:bg-brand-orange group-hover:text-brand-black transition-colors">
                  <Wallet className="w-6 h-6" />
                </div>
                {(earningsSummary?.pendingBalance || 0) > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-full border border-neutral-700">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatCurrency(earningsSummary?.pendingBalance || 0)} pending
                  </span>
                )}
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-brand-white tracking-tight">
                {formatCurrency(earningsSummary?.availableBalance || 0)}
              </h3>
              <p className="text-sm text-neutral-400 mt-2 font-medium">Available to Withdraw</p>
              {(earningsSummary?.availableBalance || 0) >= 500 ? (
                <div className="mt-3">
                    <span className="inline-block px-4 py-1.5 bg-brand-orange text-brand-black text-xs font-bold rounded-full transition-colors group-hover:bg-[#ff7529]">
                    Withdraw Now →
                    </span>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 mt-3">
                  Minimum ₹500 required
                </p>
              )}
            </Link>

            {/* Card 4: Conversion Rate */}
            <Link
              to="/dashboard/analytics"
              className="bg-[#111] rounded-3xl p-6 border border-neutral-800 hover:border-brand-acid/50 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-acid/10 rounded-2xl text-brand-acid group-hover:bg-brand-acid group-hover:text-brand-black transition-colors">
                  <Target className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-neutral-800 text-brand-acid text-xs font-bold rounded-full hidden sm:flex items-center border border-neutral-700">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Conversion
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-brand-white tracking-tight">
                {conversionRate !== null ? `${conversionRate}%` : 'N/A'}
              </h3>
              <p className="text-sm text-neutral-400 mt-2 font-medium">View → Support</p>
              <p className="text-xs text-neutral-500 mt-1 hidden sm:block">
                {stats.totalViews > 0
                  ? `${stats.totalViews.toLocaleString('en-IN')} views → ${stats.totalSupporters} backers`
                  : 'Need more data'}
              </p>
            </Link>
          </div>

          {/* Action Alerts Banner */}
          {user?.uid && userProjects.length > 0 && (
            <ActionAlertsBanner
              creatorId={user.uid}
              projects={userProjects}
              onMilestoneShare={handleMilestoneShare}
            />
          )}

          {/* Revenue Chart & Milestones - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {user?.uid && <RevenueChart creatorId={user.uid} />}
            </div>
            <div className="space-y-6">
              <ProjectMilestones
                projects={userProjects}
                onShareMilestone={handleMilestoneShare}
              />
              {/* Withdrawal History Widget */}
              <WithdrawalHistoryWidget limit={3} />
            </div>
          </div>

          {/* Quick Actions Grid */}
          <QuickActionsGrid
            projectCount={userProjects.length}
            unrepliedCount={unrepliedCount}
            newBackersThisWeek={newBackersCount}
            availableBalance={earningsSummary?.availableBalance || 0}
          />

          {/* Recent Activity & Supporters - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                      <div className="p-2 bg-brand-acid/10 rounded-lg">
                          <Sparkles className="w-5 h-5 text-brand-acid" />
                      </div>
                      <h2 className="text-xl font-bold text-brand-white tracking-tight">
                        {selectedProject
                            ? `"${selectedProject.title}" Activity`
                            : 'Recent Activity'
                        }
                      </h2>
                  </div>
                  <Link
                      to="/dashboard/notifications"
                      className="text-sm text-brand-acid hover:text-brand-white font-semibold transition-colors"
                  >
                      View all →
                  </Link>
              </div>
              <div className="p-6">
                {user?.uid && <ActivityFeed creatorId={user.uid} limit={10} />}
              </div>
            </div>

            {/* Recent Supporters */}
            <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-brand-orange/10 rounded-lg">
                            <Users className="w-5 h-5 text-brand-orange" />
                        </div>
                        <h2 className="text-xl font-bold text-brand-white tracking-tight">
                        {selectedProject
                            ? `"${selectedProject.title}" Backers`
                            : 'Recent Backers'
                        }
                        </h2>
                    </div>
                    <Link
                        to="/dashboard/backers"
                        className="text-sm text-brand-orange hover:text-brand-white font-semibold transition-colors"
                    >
                        View all →
                    </Link>
                </div>
                <div className="p-6">
                    {user?.uid && <RecentSupportersWidget creatorId={user.uid} limit={10} />}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
