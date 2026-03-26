import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign, Users, Sparkles, Trophy, Zap, Rocket } from 'lucide-react';
import { useDailyRevenue } from '../../hooks/useDailyRevenue';
import { useProjectContext } from '../../hooks/useProjectContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface RevenueChartProps {
    creatorId: string;
}

type DateRange = 7 | 14 | 30;

/**
 * Premium Revenue Chart with Enhanced UI
 * - Clean light theme matching dashboard
 * - Time period selector (7, 14, 30 days - max 30 since campaigns are 30 days)
 * - Project context aware
 * - Premium bar chart with visible grid lines
 */
export default function RevenueChart({ creatorId }: RevenueChartProps) {
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

    const chartTitle = selectedProject
        ? `"${selectedProject.title}" Revenue`
        : 'Revenue Overview';

    // Calculate Y-axis labels (4 steps)
    const yAxisLabels = useMemo(() => {
        if (maxAmount <= 1) return ['₹0', '₹0', '₹0', '₹0', '₹0'];
        const steps = 4;
        const stepValue = maxAmount / steps;
        return Array.from({ length: steps + 1 }, (_, i) => formatCurrency(stepValue * (steps - i)));
    }, [maxAmount]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Clean Light Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                                <BarChart3 className="w-4 h-4 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 truncate max-w-xs">
                                {chartTitle}
                            </h2>
                        </div>
                        <p className="text-sm text-gray-500">
                            {selectedProject
                                ? 'Showing revenue for selected project'
                                : 'Track your earnings over time'
                            }
                        </p>
                    </div>

                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {dateRangeOptions.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setDateRange(value)}
                                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${dateRange === value
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    {/* Total Revenue - Featured with gradient border */}
                    <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-1.5 text-green-600 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-semibold">Total</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                    </div>

                    {/* Average Daily */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-xs font-semibold">Avg/Day</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avgDaily)}</p>
                    </div>

                    {/* Supporters */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-semibold">Backers</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{stats.totalSupporters}</p>
                    </div>

                    {/* Trend */}
                    <div className={`rounded-xl p-4 border ${stats.trendPercent >= 0
                        ? 'bg-green-50 border-green-100'
                        : 'bg-red-50 border-red-100'
                        }`}>
                        <div className={`flex items-center gap-1.5 mb-1 ${stats.trendPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.trendPercent >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="text-xs font-semibold">Trend</span>
                        </div>
                        <p className={`text-xl font-bold ${stats.trendPercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {stats.trendPercent >= 0 ? '+' : ''}{stats.trendPercent}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner />
                    </div>
                ) : chartData.length === 0 || chartData.every(d => d.amount === 0) ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-4">
                        <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl mb-4">
                            <Sparkles className="w-10 h-10 text-orange-500" />
                        </div>
                        <p className="font-semibold text-gray-700 text-center">No revenue data yet</p>
                        <p className="text-sm mt-2 text-center max-w-sm text-gray-500">
                            Your earnings chart will show here once backers support your projects.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                            <a
                                href="/dashboard/projects"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
                            >
                                <Rocket className="w-4 h-4" />
                                Create a Project
                            </a>
                            <a
                                href="/dashboard/analytics"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <BarChart3 className="w-4 h-4" />
                                View Analytics
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Chart Container with Y-Axis */}
                        <div className="flex">
                            {/* Y-Axis Labels */}
                            <div className="w-14 flex flex-col justify-between h-56 text-xs text-gray-400 font-medium pr-2">
                                {yAxisLabels.map((label, i) => (
                                    <span key={i} className="text-right leading-none">{label}</span>
                                ))}
                            </div>

                            {/* Chart Area with Grid */}
                            <div className="flex-1 relative h-56">
                                {/* Horizontal Grid Lines - More visible */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <div
                                            key={i}
                                            className="w-full border-t border-gray-200"
                                            style={{ borderStyle: i === 4 ? 'solid' : 'dashed' }}
                                        ></div>
                                    ))}
                                </div>

                                {/* Bars Container */}
                                <div className="relative flex items-end h-full gap-1">
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
                                                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-10">
                                                        <div className="p-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-lg">
                                                            <Trophy className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bar */}
                                                <div
                                                    className={`w-full max-w-8 rounded-t-md transition-all duration-200 cursor-pointer relative ${isBestDay
                                                        ? 'bg-gradient-to-t from-amber-500 to-yellow-400'
                                                        : isHovered
                                                            ? 'bg-gradient-to-t from-orange-600 to-red-500'
                                                            : 'bg-gradient-to-t from-orange-500 to-red-500'
                                                        } ${isHovered ? 'shadow-lg shadow-orange-500/30' : ''}`}
                                                    style={{
                                                        height: `${Math.max(heightPercent, data.amount > 0 ? 4 : 0)}%`,
                                                        minHeight: data.amount > 0 ? '8px' : '0'
                                                    }}
                                                >
                                                    {/* Tooltip */}
                                                    {isHovered && (
                                                        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-20">
                                                            <div className="bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl whitespace-nowrap">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {isBestDay && <Zap className="w-4 h-4 text-yellow-400" />}
                                                                    <span className="font-bold text-base">{formatFullCurrency(data.amount)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-gray-300 text-xs">
                                                                    <Users className="w-3 h-3" />
                                                                    <span>{data.supporters} backers</span>
                                                                </div>
                                                                <p className="text-gray-400 text-xs mt-1">{data.fullDate}</p>
                                                                {isBestDay && (
                                                                    <p className="text-yellow-400 text-xs font-medium mt-1 flex items-center gap-1">
                                                                        <Trophy className="w-3 h-3" /> Best day!
                                                                    </p>
                                                                )}
                                                                {/* Arrow */}
                                                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
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
                        <div className="flex mt-3 pl-14">
                            {chartData.map((data, index) => {
                                const isBestDay = index === stats.bestDayIndex && data.amount > 0;
                                const showLabel = dateRange <= 7 || (dateRange <= 14 && index % 2 === 0) || (dateRange > 14 && index % 3 === 0);

                                return (
                                    <div key={index} className="flex-1 text-center min-w-0">
                                        {showLabel && (
                                            <span className={`text-xs font-medium ${isBestDay ? 'text-amber-600' : 'text-gray-500'
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
            <div className="px-6 pb-4 pt-2 flex items-center justify-between text-sm border-t border-gray-100">
                {stats.bestDay.amount > 0 ? (
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg">
                            <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-gray-600">
                            Best day: <span className="font-bold text-amber-600">{formatFullCurrency(stats.bestDay.amount)}</span>
                            <span className="text-gray-400 ml-1">on {stats.bestDay.day}</span>
                        </span>
                    </div>
                ) : (
                    <span></span>
                )}
                <span className="flex items-center gap-2 text-gray-400 text-xs">
                    <Sparkles className="w-3 h-3" />
                    Hover bars for details
                </span>
            </div>
        </div>
    );
}
