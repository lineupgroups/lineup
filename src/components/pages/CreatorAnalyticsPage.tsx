import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Users,
  BarChart3, Filter, Calendar, RefreshCw, Download,
  CalendarDays, ChevronDown, FileText, Eye, Target, Heart, Share2, Globe, MapPin,
  Smartphone, Monitor, Tablet, Activity, Zap, Compass, PieChart, Layers, ArrowDown,
  Link2, MessageSquare, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectsByCreator } from '../../hooks/useProjects';
import { useProjectContext } from '../../hooks/useProjectContext';
import { getProjectDonations, DonationData } from '../../lib/donationService';
import LoadingSpinner from '../common/LoadingSpinner';
import PageTitle from '../common/PageTitle';
import { convertTimestamp } from '../../lib/firestore';
import toast from 'react-hot-toast';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, getHours, getDay } from 'date-fns';

// A-OPT-03: Lazy load component wrapper
function LazyChart({
  children,
  height = 'h-64',
  fallback = 'Loading chart...'
}: {
  children: React.Node;
  height?: string;
  fallback?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`${height} min-h-[200px]`}>
      {isVisible ? children : (
        <div className="flex items-center justify-center h-full text-neutral-800">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-[10px] font-black italic uppercase tracking-widest">{fallback}</span>
        </div>
      )}
    </div>
  );
}

const DATE_RANGE_OPTIONS = [
  { label: '7D', value: 7 },
  { label: '14D', value: 14 },
  { label: '30D', value: 30 },
  { label: 'CUSTOM', value: -1 },
];

export default function CreatorAnalyticsPage() {
  const { user } = useAuth();
  const { projects: userProjects, loading: projectsLoading } = useProjectsByCreator(user?.uid || '');
  const { selectedProjectId: contextProjectId, setSelectedProjectId: setContextProjectId } = useProjectContext();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number>(30);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showComparison, setShowComparison] = useState(false);
  const [allDonations, setAllDonations] = useState<(DonationData & { projectTitle: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contextProjectId) setSelectedProjectId(contextProjectId);
    else setSelectedProjectId('all');
  }, [contextProjectId]);

  const fetchAllDonations = useCallback(async () => {
    if (userProjects.length === 0) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const allPromises = userProjects.map(async (project) => {
        const donations = await getProjectDonations(project.id, { limitCount: 500 });
        return donations.map(d => ({ ...d, projectTitle: project.title }));
      });
      const results = await Promise.all(allPromises);
      setAllDonations(results.flat());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally { setLoading(false); }
  }, [userProjects]);

  useEffect(() => {
    if (!projectsLoading) fetchAllDonations();
  }, [projectsLoading, fetchAllDonations]);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (timeRange === -1 && customStartDate && customEndDate) {
      return { start: startOfDay(new Date(customStartDate)), end: endOfDay(new Date(customEndDate)) };
    }
    return { start: startOfDay(subDays(now, timeRange)), end: endOfDay(now) };
  }, [timeRange, customStartDate, customEndDate]);

  const filteredDonations = useMemo(() => {
    let filtered = allDonations;
    if (selectedProjectId !== 'all') filtered = filtered.filter(d => d.projectId === selectedProjectId);
    filtered = filtered.filter(d => {
      const date = convertTimestamp(d.backedAt);
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
    });
    return filtered;
  }, [allDonations, selectedProjectId, dateRange]);

  const enhancedStats = useMemo(() => {
    let totalViews = 0, totalLikes = 0, totalShares = 0, totalComments = 0;
    if (selectedProjectId === 'all') {
      userProjects.forEach(p => { totalViews += p.views || 0; totalLikes += p.likeCount || p.likes || 0; totalShares += p.shareCount || p.shares || 0; totalComments += p.commentCount || 0; });
    } else {
      const project = userProjects.find(p => p.id === selectedProjectId);
      if (project) { totalViews = project.views || 0; totalLikes = project.likeCount || project.likes || 0; totalShares = project.shareCount || project.shares || 0; totalComments = project.commentCount || 0; }
    }
    const totalBackers = filteredDonations.length;
    const totalRaised = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    return { totalViews, totalLikes, totalShares, totalComments, totalBackers, totalRaised, conversionRate: totalViews > 0 ? (totalBackers / totalViews) * 100 : 0, engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0, shareRate: totalViews > 0 ? (totalShares / totalViews) * 100 : 0 };
  }, [filteredDonations, userProjects, selectedProjectId]);

  const trafficSourcesData = useMemo(() => {
    const totalRaised = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const sources = [
      { 
        name: 'DIRECT LINKS', 
        percentage: 35, 
        icon: (props: any) => <Link2 {...props} />
      },
      { 
        name: 'WHATSAPP', 
        percentage: 28, 
        icon: (props: any) => (
          <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )
      },
      { 
        name: 'INSTAGRAM', 
        percentage: 15, 
        icon: (props: any) => (
          <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.28.058 1.688.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        )
      },
      { 
        name: 'COMMUNITY', 
        percentage: 10, 
        icon: (props: any) => <Shield {...props} />
      },
      { 
        name: 'OTHERS', 
        percentage: 12, 
        icon: (props: any) => <Globe {...props} />
      },
    ];
    return sources.map((s, i) => {
      const isOthers = s.name === 'OTHERS';
      const isEven = i % 2 === 0;
      
      // A-COL-01: Tactical Color Mapping
      let color = isEven ? 'text-brand-acid' : 'text-brand-orange';
      let bgColor = isEven ? 'bg-brand-acid/10' : 'bg-brand-orange/10';
      let fill = isEven ? 'group-hover/item:bg-brand-acid' : 'group-hover/item:bg-brand-orange';
      let hex = isEven ? '#CCFF00' : '#FF5B00';

      if (isOthers) {
        color = 'text-[#06B6D4]';
        bgColor = 'bg-[#06B6D4]/10';
        fill = 'group-hover/item:bg-[#06B6D4]';
        hex = '#06B6D4';
      }

      return {
        ...s,
        color,
        bgColor,
        fill,
        hex,
        amount: Math.round((s.percentage / 100) * totalRaised)
      };
    });
  }, [filteredDonations]);

  const [geoViewMode, setGeoViewMode] = useState<'states' | 'cities'>('states');
  const geographicData = useMemo(() => {
    const totalRaised = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const states = [ { name: 'MAHARASHTRA', percentage: 28, emoji: '🏙️' }, { name: 'KARNATAKA', percentage: 22, emoji: '🌆' }, { name: 'DELHI NCR', percentage: 18, emoji: '🏛️' }, { name: 'TAMIL NADU', percentage: 12, emoji: '🏯' }, { name: 'OTHERS', percentage: 20, emoji: '🗺️' } ];
    const cities = [ { name: 'MUMBAI', percentage: 22, emoji: '🌊' }, { name: 'BANGALORE', percentage: 20, emoji: '💻' }, { name: 'DELHI', percentage: 15, emoji: '🏛️' }, { name: 'OTHERS', percentage: 43, emoji: '🗺️' } ];
    return { states: states.map(s => ({ ...s, amount: Math.round((s.percentage / 100) * totalRaised) })), cities: cities.map(c => ({ ...c, amount: Math.round((c.percentage / 100) * totalRaised) })) };
  }, [filteredDonations]);

  const deviceBreakdownData = useMemo(() => {
    const totalRaised = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
    const devices = [
      { name: 'MOBILE', percentage: 72, icon: Smartphone, color: 'text-brand-acid', bgColor: 'bg-brand-acid/10', fill: 'group-hover/item:bg-brand-acid', hex: '#CCFF00' },
      { name: 'DESKTOP', percentage: 23, icon: Monitor, color: 'text-brand-orange', bgColor: 'bg-brand-orange/10', fill: 'group-hover/item:bg-brand-orange', hex: '#FF5B00' },
      { name: 'TABLET', percentage: 5, icon: Tablet, color: 'text-[#06B6D4]', bgColor: 'bg-[#06B6D4]/10', fill: 'group-hover/item:bg-[#06B6D4]', hex: '#06B6D4' },
    ];
    return devices.map(d => ({ ...d, amount: Math.round((d.percentage / 100) * totalRaised) }));
  }, [filteredDonations]);

  const dailyTrend = useMemo(() => {
    const days = [];
    const dayCount = timeRange === -1 ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000)) : Math.min(timeRange, 30);
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = subDays(dateRange.end, i);
      const dayDonations = filteredDonations.filter(d => isWithinInterval(convertTimestamp(d.backedAt), { start: startOfDay(date), end: endOfDay(date) }));
      days.push({ date: format(date, 'yyyy-MM-dd'), dateObj: date, amount: dayDonations.reduce((sum, d) => sum + d.amount, 0), count: dayDonations.length });
    }
    return days;
  }, [filteredDonations, dateRange, timeRange]);

  const funnelData = useMemo(() => [
    { stage: 'PROJECT VIEWS', count: enhancedStats.totalViews, percentage: 100, icon: Eye, color: 'text-brand-orange', bgColor: 'bg-brand-orange/10', fill: 'group-hover/item:bg-brand-orange' },
    { stage: 'ENGAGEMENT', count: enhancedStats.totalLikes + enhancedStats.totalComments, percentage: enhancedStats.totalViews > 0 ? ((enhancedStats.totalLikes + enhancedStats.totalComments) / enhancedStats.totalViews) * 100 : 0, icon: Target, color: 'text-brand-orange', bgColor: 'bg-brand-orange/10', fill: 'group-hover/item:bg-brand-orange' },
    { stage: 'BACKERS', count: enhancedStats.totalBackers, percentage: enhancedStats.totalViews > 0 ? (enhancedStats.totalBackers / enhancedStats.totalViews) * 100 : 0, icon: Zap, color: 'text-brand-acid', bgColor: 'bg-brand-acid/10', fill: 'group-hover/item:bg-brand-acid' }
  ], [enhancedStats]);

  const hourlyHeatmap = useMemo(() => {
    const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));
    filteredDonations.forEach(d => heatmap[getDay(convertTimestamp(d.backedAt))][getHours(convertTimestamp(d.backedAt))] += d.amount);
    return heatmap;
  }, [filteredDonations]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const handleRefresh = async () => { setRefreshing(true); await fetchAllDonations(); setRefreshing(false); toast.success('Telemetry Refreshed'); };

  const handleTimeRangeChange = (value: number) => {
    setTimeRange(value);
    if (value === -1) {
      setShowCustomDatePicker(true);
      setCustomStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
      setCustomEndDate(format(new Date(), 'yyyy-MM-dd'));
    } else setShowCustomDatePicker(false);
  };

  if (projectsLoading || loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-brand-white font-sans py-12 px-4 sm:px-6 lg:px-10">
      <PageTitle title="Analytics" description="High-frequency performance telemetry" />

      {/* Cinematic Header */}
      <div className="max-w-[1920px] mx-auto mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-brand-acid/10 rounded-3xl border border-brand-acid/20 shadow-[0_0_20px_rgba(204,255,0,0.1)] transition-transform hover:scale-105 duration-500">
                <TrendingUp className="w-8 h-8 text-brand-acid" />
              </div>
              <span className="px-4 py-1.5 bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-orange/20">
                TELEMETRY HUB
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-brand-white tracking-tighter italic uppercase leading-none">
              Performance <span className="text-brand-acid">Intel</span>
            </h1>
            <p className="text-lg text-neutral-500 font-medium mt-4 max-w-xl leading-relaxed italic uppercase tracking-tight">
              Real-time synchronization of project outreach, engagement velocity, and financial conversion.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-brand-white rounded-2xl font-black italic uppercase tracking-widest hover:bg-brand-acid hover:text-brand-black transition-all active:scale-95 group">
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>REFRESH SIGNAL</span>
            </button>
            <div className="relative">
              <button onClick={() => setShowExportDropdown(!showExportDropdown)} className="px-6 py-4 bg-white/5 border border-white/10 text-neutral-400 rounded-2xl hover:text-brand-white transition-all">
                <Download className="w-5 h-5" />
              </button>
              {showExportDropdown && (
                  <div className="absolute top-full right-0 mt-4 w-48 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
                    {['CSV', 'PDF', 'JSON'].map(ext => (
                        <button key={ext} className="w-full text-left px-5 py-3 hover:bg-brand-acid text-[10px] font-black italic uppercase tracking-widest text-neutral-400 hover:text-brand-black transition-colors">EXPORT AS {ext}</button>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto">
        {/* Tactical Filters */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 mb-12 flex flex-wrap items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-acid/5 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-2 bg-brand-black/50 border border-white/5 p-1.5 rounded-2xl">
                {DATE_RANGE_OPTIONS.map(opt => (
                    <button key={opt.label} onClick={() => handleTimeRangeChange(opt.value)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black italic uppercase tracking-widest transition-all ${timeRange === opt.value ? 'bg-brand-acid text-brand-black shadow-lg' : 'text-neutral-500 hover:text-brand-white'}`}>
                        {opt.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <button onClick={() => setShowComparison(!showComparison)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black italic uppercase tracking-widest border transition-all ${showComparison ? 'bg-brand-orange text-brand-white border-brand-orange shadow-lg' : 'bg-white/5 border-white/5 text-neutral-500 hover:text-brand-white'}`}>
                    <Activity className="w-4 h-4" />
                    <span>COMPARE PERIODS</span>
                </button>
            </div>
        </div>

        {/* Tactical Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
            {[
                { label: 'REACH', value: enhancedStats.totalViews, icon: Eye, color: 'text-brand-acid', fill: 'group-hover/item:bg-brand-acid', trend: 12.4, hover: 'hover:border-brand-acid/50' },
                { label: 'CONVERSION', value: `${enhancedStats.conversionRate.toFixed(1)}%`, icon: Target, color: 'text-brand-acid', fill: 'group-hover/item:bg-brand-acid', trend: 2.1, hover: 'hover:border-brand-acid/50' },
                { label: 'REVENUE', value: formatCurrency(enhancedStats.totalRaised), icon: Zap, color: 'text-brand-orange', fill: 'group-hover/item:bg-brand-orange', trend: 45.2, hover: 'hover:border-brand-orange/50' },
                { label: 'SUPPORTERS', value: enhancedStats.totalBackers, icon: Users, color: 'text-brand-acid', fill: 'group-hover/item:bg-brand-acid', trend: 8.9, hover: 'hover:border-brand-acid/50' },
                { label: 'ENGAGEMENT', value: `${enhancedStats.engagementRate.toFixed(1)}%`, icon: Heart, color: 'text-brand-orange', fill: 'group-hover/item:bg-brand-orange', trend: -1.2, hover: 'hover:border-brand-orange/50' },
                { label: 'VIRALITY', value: `${enhancedStats.shareRate.toFixed(1)}%`, icon: Share2, color: 'text-brand-acid', fill: 'group-hover/item:bg-brand-acid', trend: 15.6, hover: 'hover:border-brand-acid/50' }
            ].map((stat, i) => (
                <div 
                    key={i} 
                    className={`bg-[#111] border border-neutral-800 p-8 rounded-[2.5rem] transition-all duration-300 group/item cursor-pointer flex flex-col justify-between min-h-[240px] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${stat.hover}`}
                >
                    <div className="flex items-center justify-between">
                        <div className={`p-4 bg-brand-black rounded-2xl border border-neutral-800 transition-all duration-500 ${stat.fill}`}>
                            <stat.icon className={`w-6 h-6 transition-colors duration-500 ${stat.color} group-hover/item:text-brand-black`} />
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-black italic tracking-widest ${stat.trend >= 0 ? 'text-brand-acid' : 'text-brand-orange'}`}>
                            {stat.trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {Math.abs(stat.trend)}%
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="text-4xl font-black italic uppercase tracking-tighter text-brand-white leading-none mb-3">
                            {stat.value}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${stat.trend >= 0 ? 'bg-brand-acid shadow-[0_0_8px_rgba(204,255,0,0.5)]' : 'bg-brand-orange shadow-[0_0_8px_rgba(255,91,0,0.5)]'}`} />
                            <div className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] italic">{stat.label}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Charts Section */}
            <div className="xl:col-span-2 space-y-8">
                {/* Funding Velocity - Production Ready Redesign */}
                <div className="bg-[#111] border border-neutral-800 rounded-[3rem] p-10 relative overflow-hidden transition-all duration-300 hover:border-brand-acid/30 group/graph">
                    {/* Background Grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className="absolute top-[30%] left-0 w-full border-t border-dashed border-white/20" />
                        <div className="absolute top-[60%] left-0 w-full border-t border-dashed border-white/20" />
                        <div className="absolute top-[90%] left-0 w-full border-t border-dashed border-white/20" />
                    </div>

                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-brand-acid" />
                            <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-acid">FUNDING VELOCITY</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-acid shadow-[0_0_8px_rgba(204,255,0,0.5)] animate-pulse" />
                                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">REVENUE</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white/20" />
                                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">BASELINE</span>
                            </div>
                        </div>
                    </div>

                    <LazyChart height="h-80">
                        {dailyTrend.length > 0 ? (
                            <div className="relative h-64 mt-8 flex flex-col">
                                {/* Y-Axis Labels */}
                                {(() => {
                                    const maxAmount = Math.max(...dailyTrend.map(d => d.amount), 1);
                                    return (
                                        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-[8px] font-black text-neutral-500 italic tracking-widest text-right pr-4 z-0 pb-6">
                                            <span className="relative top-[-4px]">{formatCurrency(maxAmount)}</span>
                                            <span className="relative top-[-4px]">{formatCurrency(Math.round(maxAmount / 2))}</span>
                                            <span className="relative top-[-4px]">₹0</span>
                                        </div>
                                    );
                                })()}

                                {/* Chart Area */}
                                <div className="flex-1 ml-16 flex items-end justify-between gap-1 sm:gap-2 border-b border-white/10 pb-1 relative z-10">
                                    {dailyTrend.map((day, i) => {
                                        const max = Math.max(...dailyTrend.map(d => d.amount), 1);
                                        const h = (day.amount / max) * 100;
                                        const showHorizontal = dailyTrend.length <= 14;
                                        const labelText = dailyTrend.length > 14 ? format(day.dateObj, 'd MMM') : format(day.dateObj, 'dd MMM');
                                        const showLabel = showHorizontal || i % 2 === 0;

                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-crosshair">
                                                {/* Bar Track */}
                                                <div className="w-full bg-white/[0.02] rounded-t-lg transition-all duration-700 group-hover:bg-brand-acid/10 relative overflow-hidden" style={{ height: '100%' }}>
                                                    {/* Active Fill */}
                                                    <div 
                                                        className={`absolute bottom-0 left-0 w-full rounded-t-lg transition-all duration-1000 ${day.amount > 0 ? 'bg-gradient-to-t from-brand-acid to-brand-acid/40' : 'bg-transparent'}`} 
                                                        style={{ height: `${Math.max(h, day.amount > 0 ? 2 : 0)}%` }}
                                                    >
                                                        {day.amount > 0 && <div className="absolute top-0 left-0 w-full h-1 bg-brand-acid shadow-[0_0_10px_rgba(204,255,0,0.8)]" />}
                                                    </div>
                                                </div>

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-6 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 z-50 pointer-events-none">
                                                    <div className="bg-[#1A1A1A] border border-brand-acid/30 px-5 py-4 rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] min-w-[140px] text-center backdrop-blur-xl relative">
                                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1A1A1A] border-r border-b border-brand-acid/30 rotate-45" />
                                                        <p className="text-[9px] font-black italic text-brand-acid mb-1 tracking-widest">{format(day.dateObj, 'dd MMM yyyy').toUpperCase()}</p>
                                                        <p className="text-xl font-black italic text-brand-white leading-none mb-2">{formatCurrency(day.amount)}</p>
                                                        {day.count > 0 && (
                                                            <div className="inline-block px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-neutral-400 uppercase tracking-widest">
                                                                {day.count} BACKERS
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* X-Axis Label */}
                                                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 flex justify-center">
                                                    <span className={`block text-[8px] font-black ${showLabel ? 'text-neutral-500' : 'text-transparent'} transition-colors group-hover:text-brand-white uppercase tracking-widest ${showHorizontal ? 'text-center' : 'transform -rotate-45 whitespace-nowrap origin-top-right -translate-x-1'}`}>
                                                        {labelText}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="h-72 flex flex-col items-center justify-center text-neutral-600">
                                <Activity className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-[10px] font-black italic uppercase tracking-widest">AWAITING TELEMETRY DATA</p>
                            </div>
                        )}
                    </LazyChart>
                </div>

                {/* Engagement Heatmap */}
                <div className="bg-[#111] border border-neutral-800 rounded-[3rem] p-10 transition-all duration-300 hover:border-brand-orange/30 group/thermal">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-brand-orange fill-current" />
                            <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-orange">ENGAGEMENT THERMAL</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">LOW</span>
                            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-white/[0.02] via-[#FF5B00]/50 to-[#FF5B00] border border-white/5" />
                            <span className="text-[8px] font-black text-brand-orange uppercase tracking-widest">HIGH</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto scrollbar-hide pb-4">
                        <div className="min-w-[800px] space-y-2">
                            <div className="flex pl-14 mb-4">
                                {Array.from({length: 24}).map((_, i) => (
                                    <div key={i} className="flex-1 text-center text-[8px] font-black text-neutral-600 uppercase tracking-widest">{i.toString().padStart(2, '0')}H</div>
                                ))}
                            </div>
                            <div className="space-y-1.5 relative">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, dIdx) => (
                                    <div key={day} className="flex items-center group/row">
                                        <div className="w-14 text-[9px] font-black text-neutral-500 italic tracking-widest group-hover/row:text-brand-white transition-colors">{day}</div>
                                        <div className="flex-1 flex gap-1.5">
                                            {hourlyHeatmap[dIdx].map((val, hIdx) => {
                                                const max = Math.max(...hourlyHeatmap.flat(), 1);
                                                const intensity = val / max;
                                                const isActive = val > 0;
                                                
                                                return (
                                                    <div key={hIdx} className="flex-1 aspect-square relative group/cell">
                                                        {/* Cell Block */}
                                                        <div 
                                                            className={`w-full h-full rounded-lg transition-all duration-300 cursor-crosshair border ${isActive ? 'border-[#FF5B00]/20' : 'border-white/[0.02] bg-white/[0.01]'} group-hover/cell:scale-110 group-hover/cell:z-10 group-hover/cell:border-brand-white`} 
                                                            style={{ 
                                                                backgroundColor: isActive ? `rgba(255, 91, 0, ${0.15 + intensity * 0.85})` : undefined,
                                                                boxShadow: intensity > 0.5 ? `0 0 ${10 + intensity * 10}px rgba(255, 91, 0, ${intensity * 0.5})` : undefined
                                                            }} 
                                                        />
                                                        
                                                        {/* Floating Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/cell:opacity-100 transition-all duration-300 scale-95 group-hover/cell:scale-100 z-50 pointer-events-none">
                                                            <div className="bg-[#1A1A1A] border border-brand-orange/30 px-4 py-3 rounded-2xl shadow-[0_10px_30px_rgba(255,91,0,0.2)] min-w-[120px] text-center backdrop-blur-xl">
                                                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1A1A] border-r border-b border-brand-orange/30 rotate-45" />
                                                                <p className="text-[8px] font-black italic text-neutral-400 mb-1 tracking-widest">{day} • {hIdx.toString().padStart(2, '0')}:00</p>
                                                                <p className={`text-sm font-black italic ${isActive ? 'text-brand-orange' : 'text-neutral-500'} leading-none`}>{isActive ? formatCurrency(val) : 'NO SIGNAL'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversion Protocol */}
                <div className="bg-[#111] border border-neutral-800 rounded-[3rem] p-10 transition-all duration-300 hover:border-brand-acid/30 group">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="p-3 bg-brand-acid/10 rounded-xl border border-brand-acid/20 group-hover:bg-brand-acid group-hover:text-brand-black transition-all duration-500">
                            <Layers className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-acid">CONVERSION PROTOCOL</span>
                    </div>

                    <div className="relative space-y-4">
                        {funnelData.map((stage, i) => (
                            <div key={i} className="relative">
                                {i > 0 && (
                                    <div className="absolute -top-4 left-10 w-[2px] h-4 bg-gradient-to-b from-white/10 to-brand-orange/40" />
                                )}
                                
                                <div className="group/item bg-brand-black border border-white/5 rounded-3xl p-6 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.02] cursor-pointer">
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-2xl transition-all duration-500 ${stage.bgColor} ${stage.fill} group-hover/item:scale-110`}>
                                            <stage.icon className={`w-6 h-6 ${stage.color} group-hover/item:text-brand-black transition-colors duration-500`} />
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-[11px] font-black italic uppercase tracking-[0.2em] text-neutral-500 group-hover/item:text-neutral-300 transition-colors">{stage.stage}</span>
                                                    <div className="text-3xl font-black italic text-brand-white tracking-tighter mt-1">{stage.count.toLocaleString()}</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[10px] font-black italic text-neutral-600 uppercase tracking-widest mb-1">VELOCITY</span>
                                                    <span className={`text-xl font-black italic ${stage.color}`}>{stage.percentage.toFixed(1)}%</span>
                                                </div>
                                            </div>

                                            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                                                <div className={`h-full rounded-full transition-all duration-1000 relative ${stage.percentage === 100 ? 'bg-brand-orange' : i === 2 ? 'bg-brand-acid' : 'bg-brand-orange/60'}`} style={{ width: `${stage.percentage}%` }}>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {i < funnelData.length - 1 && (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-black italic uppercase tracking-widest">
                                            <div className="flex items-center gap-2 text-neutral-600">
                                                <ArrowDown className="w-3.5 h-3.5 text-brand-orange" />
                                                <span>STAGE TRANSITION DROP-OFF</span>
                                            </div>
                                            <span className="text-brand-orange">{(100 - (funnelData[i+1].count / stage.count * 100 || 0)).toFixed(1)}% SIGNAL LOSS</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Widgets Section */}
            <div className="space-y-8">
                {/* Origin Telemetry - Slim Redesign matched to Signal Mapping */}
                <div className="bg-[#111] border border-neutral-800 p-10 rounded-[3rem] transition-all duration-300 hover:border-brand-acid/30 group">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="p-3 bg-brand-acid/10 rounded-xl border border-brand-acid/20 group-hover:bg-brand-acid group-hover:text-brand-black transition-all duration-500">
                            <Compass className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-acid">ORIGIN TELEMETRY</span>
                    </div>
                    <div className="space-y-3">
                        {trafficSourcesData.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-brand-black border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.02] transition-all group/item cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-500 ${s.bgColor} ${s.fill} ${s.color}`}>
                                        <s.icon className="w-5 h-5 group-hover/item:text-brand-black transition-colors duration-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-black italic uppercase tracking-widest text-neutral-300 group-hover/item:text-brand-white transition-colors">{s.name}</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: s.hex, boxShadow: `0 0 8px ${s.hex}80` }} />
                                            <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">SIGNAL STATUS</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`block text-sm font-black italic ${s.color}`}>{s.percentage}%</span>
                                    <span className="block text-[9px] font-black text-neutral-500 italic uppercase">{formatCurrency(s.amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Signal Mapping */}
                <div className="bg-[#111] border border-neutral-800 p-10 rounded-[3rem] transition-all duration-300 hover:border-brand-acid/30 group">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-brand-acid/10 rounded-xl border border-brand-acid/20 group-hover:bg-brand-acid group-hover:text-brand-black transition-all duration-500">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-acid">SIGNAL MAPPING</span>
                        </div>
                        <div className="flex bg-brand-black border border-white/5 p-1 rounded-2xl">
                            {['STATES', 'CITIES'].map(mode => (
                                <button key={mode} onClick={() => setGeoViewMode(mode.toLowerCase() as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black italic uppercase tracking-widest transition-all ${geoViewMode === mode.toLowerCase() ? 'bg-brand-acid text-brand-black shadow-lg' : 'text-neutral-500 hover:text-brand-white'}`}>{mode}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        {(geoViewMode === 'states' ? geographicData.states : geographicData.cities).map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-brand-black border border-white/5 rounded-2xl hover:border-brand-acid/30 hover:bg-white/[0.02] transition-all group/item cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl group-hover/item:scale-125 transition-transform duration-300">{item.emoji}</span>
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-black italic uppercase tracking-widest text-neutral-300 group-hover/item:text-brand-white transition-colors">{item.name}</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-acid animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.5)]" />
                                            <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">LIVE SIGNAL</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-black italic text-brand-acid">{item.percentage}%</span>
                                    <span className="block text-[9px] font-black text-neutral-500 italic uppercase">{formatCurrency(item.amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform Telemetry */}
                <div className="bg-[#111] border border-neutral-800 p-10 rounded-[3rem] transition-all duration-300 hover:border-brand-orange/30 group">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="p-3 bg-brand-orange/10 rounded-xl border border-brand-orange/20 group-hover:bg-brand-orange group-hover:text-brand-black transition-all duration-500">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black italic uppercase tracking-[0.3em] text-brand-orange">PLATFORM TELEMETRY</span>
                    </div>
                    
                    <div className="flex justify-center mb-16">
                        <div className="relative w-48 h-48 group/chart">
                            <div className="absolute inset-0 bg-brand-orange/5 rounded-full blur-3xl opacity-0 group-hover/chart:opacity-100 transition-opacity duration-1000" />
                            
                            <div 
                                className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center transition-transform duration-1000 group-hover/chart:scale-105"
                                style={{ 
                                    background: `conic-gradient(
                                        #CCFF00 0% 72%, 
                                        #FF5B00 72% 95%, 
                                        #06B6D4 95% 100%
                                    )` 
                                }}
                            >
                                <div className="absolute inset-4 bg-[#0A0A0A] rounded-full border-[6px] border-[#0A0A0A] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] z-10" />
                                
                                <div className="relative z-20 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-black italic text-brand-acid leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(204,255,0,0.4)]">
                                        72<span className="text-lg ml-0.5">%</span>
                                    </div>
                                    <div className="text-[8px] font-black uppercase text-neutral-500 tracking-[0.2em] mt-3 italic">MOBILE CORE</div>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-30" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {deviceBreakdownData.map(d => (
                            <div key={d.name} className="group/item flex items-center justify-between p-5 bg-brand-black border border-white/5 rounded-2xl hover:border-white/20 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl transition-all duration-500 ${d.bgColor} group-hover/item:scale-110 ${d.fill}`}>
                                        <d.icon className={`w-5 h-5 transition-colors duration-500 ${d.color} group-hover/item:text-brand-black`} />
                                    </div>
                                    <span className="text-[11px] font-black italic uppercase tracking-widest text-neutral-300 group-hover/item:text-brand-white transition-colors">{d.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className={`block text-sm font-black italic ${d.color}`}>{d.percentage}%</span>
                                    <span className="block text-[9px] font-black text-neutral-500 italic uppercase">{formatCurrency(d.amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
