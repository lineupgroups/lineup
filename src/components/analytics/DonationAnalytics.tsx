import React, { useState, useMemo } from 'react';
import { FirestoreDonation } from '../../types/firestore';
import { Download, TrendingUp, Users, DollarSign, Calendar, BarChart3, PieChart } from 'lucide-react';
import { exportToCSV, exportToJSON, exportDonationSummaryPDF } from '../../utils/exportService';

interface DonationAnalyticsProps {
    donations: FirestoreDonation[];
    isLoading?: boolean;
}

export const DonationAnalytics: React.FC<DonationAnalyticsProps> = ({ donations, isLoading }) => {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
        const avgAmount = totalAmount / (donations.length || 1);
        const uniqueDonors = new Set(donations.map(d => d.donorId)).size;
        const anonymousCount = donations.filter(d => d.anonymous).length;
        const anonymousPercentage = (anonymousCount / (donations.length || 1)) * 100;

        return {
            totalAmount,
            avgAmount,
            uniqueDonors,
            anonymousPercentage,
            totalDonations: donations.length
        };
    }, [donations]);

    // Prepare Chart Data (Simple aggregation)
    const chartData = useMemo(() => {
        const data: Record<string, number> = {};

        donations.forEach(d => {
            if (!d.createdAt?.seconds) return;
            const date = new Date(d.createdAt.seconds * 1000);
            let key = '';

            if (timeRange === 'week' || timeRange === 'month') {
                key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }

            data[key] = (data[key] || 0) + d.amount;
        });

        // Sort by date (this is a simplified sort, might need better logic for real apps)
        return Object.entries(data).slice(-7); // Just show last 7 data points for simplicity in this mockup
    }, [donations, timeRange]);

    const maxChartValue = Math.max(...chartData.map(([_, val]) => val), 1);

    const handleExport = (format: 'csv' | 'json' | 'pdf') => {
        const filename = `donations_export_${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'csv':
                exportToCSV(donations, filename);
                break;
            case 'json':
                exportToJSON(donations, filename);
                break;
            case 'pdf':
                exportDonationSummaryPDF(donations, 'Donation Analytics Report');
                break;
        }
    };

    if (isLoading) {
        return <div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    Donation Analytics
                </h2>

                <div className="flex gap-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                        <option value="all">All Time</option>
                    </select>

                    <div className="relative group">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 hidden group-hover:block z-10">
                            <button onClick={() => handleExport('csv')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as CSV</button>
                            <button onClick={() => handleExport('pdf')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as PDF</button>
                            <button onClick={() => handleExport('json')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Export as JSON</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Total Raised</span>
                        <DollarSign className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        ₹{stats.totalAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-green-600 mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +12% vs last period
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Avg. Donation</span>
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        ₹{stats.avgAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Unique Donors</span>
                        <Users className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.uniqueDonors}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Anonymous</span>
                        <Users className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.anonymousPercentage.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Donation Trends</h3>

                    {chartData.length > 0 ? (
                        <div className="h-64 flex items-end justify-between gap-2">
                            {chartData.map(([label, value], i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="relative w-full flex items-end justify-center h-full">
                                        <div
                                            className="w-full max-w-[40px] bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-all duration-300 relative group-hover:opacity-90"
                                            style={{ height: `${(value / maxChartValue) * 100}%` }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                ₹{value.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 truncate w-full text-center">{label}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No data available for this period
                        </div>
                    )}
                </div>

                {/* Distribution / Insights */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="text-sm text-blue-800 font-medium mb-1">Top Performing Day</div>
                            <div className="text-xs text-blue-600">
                                Most donations happen on weekends. Consider launching campaigns on Fridays.
                            </div>
                        </div>

                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="text-sm text-green-800 font-medium mb-1">Goal Progress</div>
                            <div className="text-xs text-green-600">
                                You are on track to reach your funding goals based on current velocity.
                            </div>
                        </div>

                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="text-sm text-purple-800 font-medium mb-1">Donor Retention</div>
                            <div className="text-xs text-purple-600">
                                {stats.uniqueDonors > 5 ? 'Great job retaining donors!' : 'Focus on engaging more unique donors.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
