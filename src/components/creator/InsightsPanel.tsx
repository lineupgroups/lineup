import React from 'react';
import { Lightbulb, TrendingUp, Users, Clock, Target } from 'lucide-react';
import { FirestoreDonation } from '../../types/firestore';

interface InsightsPanelProps {
    donations: FirestoreDonation[];
    className?: string;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ donations, className = '' }) => {
    if (!donations || donations.length === 0) {
        return null;
    }

    // Calculate insights
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const avgAmount = totalAmount / donations.length;

    // Find peak time (simple hour bucket)
    const hourCounts: Record<number, number> = {};
    donations.forEach(d => {
        if (d.createdAt?.seconds) {
            const hour = new Date(d.createdAt.seconds * 1000).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
    });

    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const peakTimeStr = peakHour ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00` : 'N/A';

    const insights = [
        {
            icon: <TrendingUp className="w-5 h-5 text-green-400" />,
            title: "Average Donation",
            description: `Your average donation is ₹${avgAmount.toFixed(0)}, which is healthy for this category.`,
            color: "bg-green-500/10 border-green-500/20"
        },
        {
            icon: <Clock className="w-5 h-5 text-blue-400" />,
            title: "Peak Activity",
            description: `Most of your supporters donate between ${peakTimeStr}.`,
            color: "bg-blue-500/10 border-blue-100"
        },
        {
            icon: <Users className="w-5 h-5 text-purple-400" />,
            title: "Supporter Base",
            description: `You have ${new Set(donations.map(d => d.donorId)).size} unique supporters backing your projects.`,
            color: "bg-purple-500/10 border-purple-100"
        }
    ];

    return (
        <div className={`bg-[#111] rounded-3xl shadow-sm border border-neutral-800 p-6 ${className}`}>
            <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-bold text-brand-white">Smart Insights</h3>
            </div>

            <div className="space-y-4">
                {insights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-2xl border ${insight.color} flex gap-4`}>
                        <div className="flex-shrink-0 mt-1">
                            {insight.icon}
                        </div>
                        <div>
                            <h4 className="font-semibold text-brand-white text-sm">{insight.title}</h4>
                            <p className="text-sm text-neutral-400 mt-1">{insight.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/50">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Based on {donations.length} donations</span>
                    <button className="text-blue-400 font-medium hover:text-blue-400">View Full Report</button>
                </div>
            </div>
        </div>
    );
};
