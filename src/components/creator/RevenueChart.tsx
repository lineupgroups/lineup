import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign, Users, Sparkles, Trophy, Zap, Rocket } from 'lucide-react';
import { useDailyRevenue } from '../../hooks/useDailyRevenue';
import { useProjectContext } from '../../hooks/useProjectContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface RevenueChartProps {
    creatorId: string;
    hasProjects?: boolean;
}

type DateRange = 7 | 14 | 30;

/**
 * Premium Revenue Chart with Enhanced UI
 * - Dark theme matching brand UI
 * - Time period selector (7, 14, 30 days - max 30 since campaigns are 30 days)
 * - Project context aware
 * - Premium bar chart with visible grid lines
 */
export default function RevenueChart({ creatorId, hasProjects = false }: RevenueChartProps) {
    const [dateRange, setDateRange] = useState<DateRange>(7);
    const { revenueData, loading } = useDailyRevenue(creatorId, dateRange);
    const { selectedProjectId: _selectedProjectId, selectedProject } = useProjectContext();
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    const chartData = useMemo(() => {
        if (!revenueData || revenueData.length === 0) {
            return [];
        }

        return revenueData.map((data) => {
            const date = new Date(data.date);
            let dayLabel: string;

            if (dateRange <= 7) {
                dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
            } else if (dateRange <= 14) {
                dayLabel = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            } else {
                dayLabel = date.toLocaleDateString('en-US', { day: 'numeric' });
            }

            return {
                day: dayLabel,
                shortDay: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
                amount: data.amount,
                supporters: data.supporters || 0,
                date: data.date,
                fullDate: date.toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })
            };
        });
    }, [revenueData, dateRange]);

    const maxAmount = useMemo(() =>
        chartData.length > 0 ? Math.max(...chartData.map(d => d.amount), 1) : 1,
        [chartData]
    );

    // Calculate summary statistics
    const stats = useMemo(() => {
        const totalRevenue = chartData.reduce((sum, d) => sum + d.amount, 0);
        const totalSupporters = chartData.reduce((sum, d) => sum + d.supporters, 0);
        const avgDaily = chartData.length > 0 ? totalRevenue / chartData.length : 0;
        const bestDayIndex = chartData.findIndex(d => d.amount === Math.max(...chartData.map(x => x.amount)));
        const bestDay = chartData[bestDayIndex] || { amount: 0, day: '-', fullDate: '-' };

        // Calculate comparison with previous period
        const midpoint = Math.floor(chartData.length / 2);
        const firstHalf = chartData.slice(0, midpoint).reduce((sum, d) => sum + d.amount, 0);
        const secondHalf = chartData.slice(midpoint).reduce((sum, d) => sum + d.amount, 0);

        let trendPercent = 0;
        if (firstHalf > 0) {
            trendPercent = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
        } else if (secondHalf > 0) {
            trendPercent = 100;
        }

        return {
            totalRevenue,
            totalSupporters,
            avgDaily,
            bestDay,
            bestDayIndex,
            trendPercent
        };
    }, [chartData]);

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${amount.toFixed(0)}`;
    };

    const formatFullCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Only show 7D, 14D, 30D (campaigns are max 30 days)
    const dateRangeOptions: { value: DateRange; label: string }[] = [
        { value: 7, label: '7D' },
        { value: 14, label: '14D' },
        { value: 30, label: '30D' }
    ];

    const chartTitle = 'Revenue Overview';

    // Calculate Y-axis labels (4 steps)
    const yAxisLabels = useMemo(() => {
        if (maxAmount <= 1) return ['₹0', '₹0', '₹0', '₹0', '₹0'];
        const steps = 4;
        const stepValue = maxAmount / steps;
        return Array.from({ length: steps + 1 }, (_, i) => formatCurrency(stepValue * (steps - i)));
    }, [maxAmount]);

    return (
        <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden flex flex-col h-full">
            {/* Clean Dark Header */}
            <div className="p-6 border-b border-neutral-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-brand-orange/10 rounded-xl border border-brand-orange/20">
                                <BarChart3 className="w-5 h-5 text-brand-orange" />
                            </div>
                            <h2 className="text-xl font-bold text-brand-white tracking-tight truncate max-w-xs">
                                {chartTitle}
                            </h2>
                        </div>
                        <p className="text-sm text-neutral-400 font-medium">
                            Track your earnings over time
                        </p>
                    </div>

                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                            {dateRangeOptions.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setDateRange(value)}
                                    className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-300 ${dateRange === value
                                        ? 'bg-brand-acid text-brand-black shadow-md'
                                        : 'text-neutral-500 hover:text-brand-white hover:bg-neutral-800'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {/* Total Revenue - Featured */}
                    <div className="relative bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                        <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-bold tracking-wide uppercase">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-white tracking-tight">{formatCurrency(stats.totalRevenue)}</p>
                    </div>

                    {/* Average Daily */}
                    <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
                        <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-xs font-bold tracking-wide uppercase">Avg/Day</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-white tracking-tight">{formatCurrency(stats.avgDaily)}</p>
                    </div>

                    {/* Supporters */}
                    <div className="bg-sky-500/10 rounded-2xl p-4 border border-sky-500/20">
                        <div className="flex items-center gap-1.5 text-sky-400 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold tracking-wide uppercase">Backers</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-white tracking-tight">{stats.totalSupporters}</p>
                    </div>

                    {/* Trend */}
                    <div className={`rounded-2xl p-4 border ${stats.trendPercent >= 0
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                        }`}>
                        <div className={`flex items-center gap-1.5 mb-1 ${stats.trendPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stats.trendPercent >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="text-xs font-bold tracking-wide uppercase">Trend</span>
                        </div>
                        <p className={`text-2xl font-bold tracking-tight ${stats.trendPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stats.trendPercent >= 0 ? '+' : ''}{stats.trendPercent}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="p-6 flex-grow flex flex-col justify-end min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : chartData.length === 0 || chartData.every(d => d.amount === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 px-4">
                        <div className="p-4 bg-brand-orange/10 rounded-2xl mb-4 border border-brand-orange/20">
                            <Sparkles className="w-10 h-10 text-brand-orange" />
                        </div>
                        <p className="font-bold text-brand-white text-center">No revenue data yet</p>
                        <p className="text-sm mt-2 text-center max-w-sm text-neutral-400">
                            Your earnings chart will show here once backers support your projects.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            {!hasProjects && (
                                <a
                                    href="/dashboard/projects/create"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-acid text-brand-black text-sm font-bold rounded-xl hover:bg-[#b3e600] transition-colors"
                                >
                                    <Rocket className="w-4 h-4" />
                                    Create a Project
                                </a>
                            )}
                            <a
                                href="/dashboard/analytics"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 border border-neutral-800 text-brand-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition-colors"
                            >
                                <BarChart3 className="w-4 h-4" />
                                View Analytics
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="relative h-full flex flex-col justify-end pt-8">
                        {/* Chart Container with Y-Axis */}
                        <div className="flex h-56">
                            {/* Y-Axis Labels */}
                            <div className="w-14 flex flex-col justify-between h-full text-xs text-neutral-500 font-bold pr-3">
                                {yAxisLabels.map((label, i) => (
                                    <span key={i} className="text-right leading-none">{label}</span>
                                ))}
                            </div>

                            {/* Chart Area with Grid */}
                            <div className="flex-1 relative h-full">
                                {/* Horizontal Grid Lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <div
                                            key={i}
                                            className="w-full border-t border-neutral-800"
                                            style={{ borderStyle: i === 4 ? 'solid' : 'dashed', opacity: i === 4 ? 1 : 0.5 }}
                                        ></div>
                                    ))}
                                </div>

                                {/* Bars Container */}
                                <div className="relative flex items-end h-full gap-2">
                                    {chartData.map((data, index) => {
                                        const heightPercent = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
                                        const isBestDay = index === stats.bestDayIndex && data.amount > 0;
                                        const isHovered = hoveredBar === index;

                                        return (
                                            <div
                                                key={index}
                                                className="flex-1 flex flex-col items-center min-w-0 h-full justify-end relative group"
                                                onMouseEnter={() => setHoveredBar(index)}
                                                onMouseLeave={() => setHoveredBar(null)}
                                            >
                                                {/* Best Day Crown */}
                                                {isBestDay && (
                                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                                        <div className="p-1.5 bg-brand-acid rounded-full shadow-[0_0_10px_rgba(204,255,0,0.5)]">
                                                            <Trophy className="w-3 h-3 text-brand-black" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bar */}
                                                <div
                                                    className={`w-full max-w-[40px] rounded-t-xl transition-all duration-300 cursor-pointer relative ${isBestDay
                                                        ? 'bg-brand-acid shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                                                        : isHovered
                                                            ? 'bg-brand-orange shadow-[0_0_15px_rgba(255,91,0,0.3)]'
                                                            : 'bg-neutral-800 hover:bg-neutral-700'
                                                        }`}
                                                    style={{
                                                        height: `${Math.max(heightPercent, data.amount > 0 ? 4 : 0)}%`,
                                                        minHeight: data.amount > 0 ? '8px' : '0'
                                                    }}
                                                >
                                                    {/* Tooltip */}
                                                    {isHovered && (
                                                        <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
                                                            <div className="bg-brand-white text-brand-black text-sm px-4 py-3 rounded-xl shadow-2xl whitespace-nowrap border border-neutral-200">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {isBestDay && <Zap className="w-4 h-4 text-brand-orange" />}
                                                                    <span className="font-extrabold text-lg">{formatFullCurrency(data.amount)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-neutral-600 text-xs font-bold">
                                                                    <Users className="w-3.5 h-3.5" />
                                                                    <span>{data.supporters} backers</span>
                                                                </div>
                                                                <p className="text-neutral-500 text-xs mt-1 font-medium">{data.fullDate}</p>
                                                                {isBestDay && (
                                                                    <p className="text-brand-orange text-xs font-bold mt-1.5 flex items-center gap-1 bg-brand-orange/10 w-fit px-2 py-0.5 rounded-full">
                                                                        <Trophy className="w-3 h-3" /> Best day!
                                                                    </p>
                                                                )}
                                                                {/* Arrow */}
                                                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-brand-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* X-Axis Labels */}
                        <div className="flex mt-4 pl-14">
                            {chartData.map((data, index) => {
                                const isBestDay = index === stats.bestDayIndex && data.amount > 0;
                                const showLabel = dateRange <= 7 || (dateRange <= 14 && index % 2 === 0) || (dateRange > 14 && index % 3 === 0);

                                return (
                                    <div key={index} className="flex-1 text-center min-w-0">
                                        {showLabel && (
                                            <span className={`text-[11px] font-bold tracking-wide uppercase ${isBestDay ? 'text-brand-acid' : 'text-neutral-500'
                                                }`}>
                                                {data.day}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-between text-sm border-t border-neutral-800 bg-neutral-900/50">
                {stats.bestDay.amount > 0 ? (
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-brand-acid/20 rounded-lg border border-brand-acid/30">
                            <Trophy className="w-4 h-4 text-brand-acid" />
                        </div>
                        <span className="text-neutral-400 font-medium">
                            Best day: <span className="font-bold text-brand-white">{formatFullCurrency(stats.bestDay.amount)}</span>
                            <span className="text-neutral-500 ml-1">on {stats.bestDay.day}</span>
                        </span>
                    </div>
                ) : (
                    <span></span>
                )}
                <span className="flex items-center gap-1.5 text-neutral-500 text-xs font-bold tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" />
                    HOVER BARS FOR DETAILS
                </span>
            </div>
        </div>
    );
}
