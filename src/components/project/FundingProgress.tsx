import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface FundingProgressProps {
    raised: number;
    goal: number;
    daysLeft: number;
    supporters: number;
    animated?: boolean;
}

export default function FundingProgress({
    raised,
    goal,
    daysLeft,
    supporters,
    animated = true
}: FundingProgressProps) {
    const [displayPercentage, setDisplayPercentage] = useState(0);
    const actualPercentage = Math.min((raised / goal) * 100, 100);
    const isGoalReached = actualPercentage >= 100;

    // Animate progress bar on mount
    useEffect(() => {
        if (animated) {
            const timer = setTimeout(() => {
                setDisplayPercentage(actualPercentage);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setDisplayPercentage(actualPercentage);
        }
    }, [actualPercentage, animated]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getProgressColor = () => {
        if (actualPercentage >= 100) return 'from-green-500 to-emerald-500';
        return 'from-orange-500 to-red-500';
    };

    const milestones = [
        { percent: 25, label: '25%', reached: actualPercentage >= 25 },
        { percent: 50, label: '50%', reached: actualPercentage >= 50 },
        { percent: 75, label: '75%', reached: actualPercentage >= 75 },
        { percent: 100, label: '100%', reached: actualPercentage >= 100 }
    ];

    return (
        <div className="funding-progress">
            {/* Main Stats */}
            <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
                    {formatCurrency(raised)}
                    {isGoalReached && (
                        <span className="inline-flex items-center">
                            <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                        </span>
                    )}
                </div>
                <div className="text-gray-600">
                    of {formatCurrency(goal)} goal
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-1000 ease-out rounded-full shadow-lg`}
                        style={{ width: `${displayPercentage}%` }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                            style={{
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s infinite'
                            }}
                        />

                        {/* Percentage label */}
                        {displayPercentage > 10 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white drop-shadow-md">
                                {actualPercentage.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Milestones */}
                <div className="relative mt-2">
                    <div className="flex justify-between items-center">
                        {milestones.map((milestone, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center"
                                style={{ marginLeft: index === 0 ? '0' : 'auto', marginRight: index === milestones.length - 1 ? '0' : 'auto' }}
                            >
                                <div
                                    className={`w-2 h-2 rounded-full transition-all duration-500 ${milestone.reached
                                        ? 'bg-green-500 shadow-lg shadow-green-500/50 scale-125'
                                        : 'bg-gray-400'
                                        }`}
                                />
                                <span className={`text-xs mt-1 font-medium transition-colors duration-500 ${milestone.reached ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                    {milestone.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Goal Reached Celebration */}
            {isGoalReached && (
                <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg animate-pulse-slow">
                    <div className="flex items-center justify-center gap-2 text-green-800 font-semibold">
                        <span className="text-2xl">🎉</span>
                        <span>Goal Reached!</span>
                        <span className="text-2xl">🎉</span>
                    </div>
                </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="font-bold text-gray-900">{actualPercentage.toFixed(0)}%</div>
                    <div className="text-xs text-gray-600">Funded</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="font-bold text-gray-900">{supporters}</div>
                    <div className="text-xs text-gray-600">Supporters</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="font-bold text-gray-900">{daysLeft}</div>
                    <div className="text-xs text-gray-600">Days Left</div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.8;
                    }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
