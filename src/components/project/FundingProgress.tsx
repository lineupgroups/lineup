import { useEffect, useState } from 'react';
import { Target, Users, Clock, TrendingUp } from 'lucide-react';

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
    const [displayRaised, setDisplayRaised] = useState(0);
    const actualPercentage = Math.min((raised / goal) * 100, 100);
    const isGoalReached = actualPercentage >= 100;

    // Animate progress bar and counter on mount
    useEffect(() => {
        if (animated) {
            const timer = setTimeout(() => {
                setDisplayPercentage(actualPercentage);
            }, 200);

            // Animate the raised amount counter
            const duration = 1500;
            const steps = 40;
            const increment = raised / steps;
            let current = 0;
            let step = 0;

            const counterInterval = setInterval(() => {
                step++;
                current = Math.min(increment * step, raised);
                setDisplayRaised(Math.round(current));
                if (step >= steps) clearInterval(counterInterval);
            }, duration / steps);

            return () => {
                clearTimeout(timer);
                clearInterval(counterInterval);
            };
        } else {
            setDisplayPercentage(actualPercentage);
            setDisplayRaised(raised);
        }
    }, [actualPercentage, animated, raised]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Raised Amount — Hero Display */}
            <div className="text-center py-2">
                <p className="text-[10px] font-black italic uppercase tracking-[0.25em] text-neutral-500 mb-3">
                    Total Raised
                </p>
                <div className="text-4xl sm:text-5xl font-black italic text-brand-white tracking-tighter leading-none">
                    {formatCurrency(displayRaised)}
                </div>
                <p className="text-sm text-neutral-500 font-medium mt-2">
                    of <span className="text-neutral-300 font-bold">{formatCurrency(goal)}</span> goal
                </p>
            </div>

            {/* Progress Bar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black italic uppercase tracking-[0.2em] text-neutral-500">
                        Progress
                    </span>
                    <span className={`text-sm font-black italic ${isGoalReached ? 'text-brand-acid' : 'text-brand-orange'}`}>
                        {actualPercentage.toFixed(1)}%
                    </span>
                </div>
                <div className="relative w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/10">
                    <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-[1.5s] ease-out ${
                            isGoalReached
                                ? 'bg-brand-acid shadow-[0_0_20px_rgba(204,255,0,0.4)]'
                                : 'bg-brand-orange shadow-[0_0_20px_rgba(255,91,0,0.3)]'
                        }`}
                        style={{ width: `${displayPercentage}%` }}
                    >
                        {/* Shimmer */}
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                            style={{
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2.5s infinite linear'
                            }}
                        />
                    </div>
                </div>

                {/* Milestone markers */}
                <div className="flex justify-between mt-3">
                    {[25, 50, 75, 100].map((milestone) => {
                        const reached = actualPercentage >= milestone;
                        return (
                            <div key={milestone} className="flex flex-col items-center gap-1">
                                <div
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
                                        reached
                                            ? 'bg-brand-acid shadow-[0_0_6px_rgba(204,255,0,0.5)]'
                                            : 'bg-neutral-700'
                                    }`}
                                />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                    reached ? 'text-brand-acid' : 'text-neutral-600'
                                }`}>
                                    {milestone}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Goal Reached Celebration */}
            {isGoalReached && (
                <div className="p-4 bg-brand-acid/5 border border-brand-acid/20 rounded-2xl text-center">
                    <p className="text-[11px] font-black italic uppercase tracking-[0.2em] text-brand-acid">
                        🎉 Goal Achieved 🎉
                    </p>
                </div>
            )}

            {/* Stats Grid — Dashboard Style */}
            <div className="grid grid-cols-3 gap-3">
                {/* Funded */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center group hover:border-brand-acid/30 transition-all duration-300">
                    <div className="flex justify-center mb-2.5">
                        <div className="p-2 bg-brand-acid/10 rounded-xl text-brand-acid group-hover:bg-brand-acid group-hover:text-brand-black transition-colors">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black italic text-brand-white tracking-tight">
                        {actualPercentage.toFixed(0)}%
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-500 mt-1">
                        Funded
                    </div>
                </div>

                {/* Supporters */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center group hover:border-brand-orange/30 transition-all duration-300">
                    <div className="flex justify-center mb-2.5">
                        <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange group-hover:bg-brand-orange group-hover:text-brand-black transition-colors">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black italic text-brand-white tracking-tight">
                        {supporters}
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-500 mt-1">
                        Backers
                    </div>
                </div>

                {/* Days Left */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center group hover:border-brand-acid/30 transition-all duration-300">
                    <div className="flex justify-center mb-2.5">
                        <div className="p-2 bg-brand-acid/10 rounded-xl text-brand-acid group-hover:bg-brand-acid group-hover:text-brand-black transition-colors">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-black italic text-brand-white tracking-tight">
                        {daysLeft}
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-500 mt-1">
                        Days Left
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
}
