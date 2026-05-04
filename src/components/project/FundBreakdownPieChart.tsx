import { useState, useMemo } from 'react';

interface FundBreakdownItem {
    item: string;
    amount: number;
}

interface FundBreakdownPieChartProps {
    breakdown: FundBreakdownItem[];
}

// Dark theme gradient color palette
const COLORS = [
    { start: '#FF5B00', end: '#ff7529' }, // Brand Orange
    { start: '#8b5cf6', end: '#7c3aed' }, // Purple
    { start: '#06b6d4', end: '#0891b2' }, // Cyan
    { start: '#CCFF00', end: '#b3e600' }, // Brand Acid
    { start: '#f59e0b', end: '#d97706' }, // Amber
    { start: '#ec4899', end: '#db2777' }, // Pink
    { start: '#6366f1', end: '#4f46e5' }, // Indigo
    { start: '#14b8a6', end: '#0d9488' }, // Teal
    { start: '#f43f5e', end: '#e11d48' }, // Rose
    { start: '#84cc16', end: '#65a30d' }, // Lime
];

export default function FundBreakdownPieChart({ breakdown }: FundBreakdownPieChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const { total, slices } = useMemo(() => {
        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        let cumulativeAngle = 0;

        const slices = breakdown.map((item, index) => {
            const percentage = (item.amount / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = cumulativeAngle;
            cumulativeAngle += angle;

            return {
                ...item,
                percentage,
                startAngle,
                endAngle: cumulativeAngle,
                color: COLORS[index % COLORS.length],
            };
        });

        return { total, slices };
    }, [breakdown]);

    const describeArc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
        const startRad = ((startAngle - 90) * Math.PI) / 180;
        const endRad = ((endAngle - 90) * Math.PI) / 180;
        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        return [`M ${cx} ${cy}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, 'Z'].join(' ');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const activeIndex = hoveredIndex ?? selectedIndex;

    return (
        <div className="space-y-10">
            {/* Pie Chart Section */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
                {/* Chart Container */}
                <div className="relative w-72 h-72 flex-shrink-0">
                    <svg
                        viewBox="0 0 200 200"
                        className="w-full h-full drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                        role="img"
                    >
                        <defs>
                            {slices.map((slice, index) => (
                                <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={slice.color.start} />
                                    <stop offset="100%" stopColor={slice.color.end} />
                                </linearGradient>
                            ))}
                        </defs>

                        {slices.map((slice, index) => {
                            const isActive = activeIndex === index;
                            const scale = isActive ? 1.05 : 1;
                            const radius = 90 * scale;

                            return (
                                <path
                                    key={index}
                                    d={describeArc(100, 100, radius, slice.startAngle, slice.endAngle)}
                                    fill={`url(#gradient-${index})`}
                                    className="transition-all duration-500 cursor-pointer"
                                    style={{
                                        transformOrigin: '100px 100px',
                                        filter: isActive ? 'brightness(1.2) drop-shadow(0 0 15px rgba(255,255,255,0.2))' : 'none',
                                        opacity: activeIndex !== null && !isActive ? 0.3 : 1,
                                    }}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                                />
                            );
                        })}

                        {/* Luxury Center Donut */}
                        <circle cx="100" cy="100" r="55" fill="#111" />
                        <circle cx="100" cy="100" r="52" fill="#0A0A0A" className="opacity-50" />
                        
                        {/* Center Labels */}
                        <text x="100" y="88" textAnchor="middle" className="text-[8px] font-black italic uppercase tracking-[0.3em] fill-neutral-600">Total</text>
                        <text x="100" y="112" textAnchor="middle" className="text-sm font-black italic uppercase tracking-tighter fill-brand-white">
                            {formatCurrency(total)}
                        </text>
                    </svg>

                    {/* Tooltip-style Center Text on Hover */}
                    {activeIndex !== null && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                            <div className="bg-black/90 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 shadow-2xl text-center scale-90 opacity-0 animate-in fade-in zoom-in duration-300">
                                <p className="text-[9px] font-black italic uppercase tracking-widest text-brand-acid mb-1">
                                    {slices[activeIndex].percentage.toFixed(1)}%
                                </p>
                                <p className="text-[11px] font-black italic uppercase tracking-tight text-white">
                                    {slices[activeIndex].item}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modernized Legend */}
                <div className="flex-1 w-full space-y-2">
                    {slices.map((slice, index) => {
                        const isActive = activeIndex === index;

                        return (
                            <div
                                key={index}
                                className={`group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-500 border ${
                                    isActive 
                                    ? 'bg-white/5 border-neutral-700 shadow-[0_0_40px_rgba(0,0,0,0.5)] translate-x-2' 
                                    : 'border-transparent hover:bg-white/[0.02]'
                                }`}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Animated Color Mark */}
                                    <div className="relative">
                                        <div 
                                            className="w-3 h-3 rounded-full relative z-10"
                                            style={{ background: `linear-gradient(135deg, ${slice.color.start}, ${slice.color.end})` }}
                                        />
                                        {isActive && (
                                            <div 
                                                className="absolute inset-0 rounded-full blur-[8px] animate-pulse"
                                                style={{ backgroundColor: slice.color.start }}
                                            />
                                        )}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-black italic uppercase tracking-tight transition-colors duration-500 ${
                                            isActive ? 'text-brand-white' : 'text-neutral-500'
                                        }`}>
                                            {slice.item}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right flex items-center gap-4">
                                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black italic transition-all duration-500 ${
                                        isActive ? 'bg-brand-acid text-brand-black' : 'bg-neutral-900 text-neutral-500'
                                    }`}>
                                        {slice.percentage.toFixed(1)}%
                                    </div>
                                    <span className={`text-sm font-black italic tracking-tighter transition-all duration-500 ${
                                        isActive ? 'text-brand-orange scale-110' : 'text-neutral-400'
                                    }`}>
                                        {formatCurrency(slice.amount)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Premium Summary Bar */}
            <div className="bg-[#111] rounded-[2rem] p-8 border border-neutral-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-acid/5 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h3 className="text-[10px] font-black italic uppercase tracking-[0.3em] text-neutral-600 mb-2 flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-brand-acid" />
                            Financial Summary
                        </h3>
                        <h4 className="text-3xl font-black italic uppercase tracking-tighter text-brand-white">Total Fund Allocation</h4>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black italic uppercase tracking-tighter text-brand-acid drop-shadow-[0_0_20px_rgba(204,255,0,0.2)]">
                            {formatCurrency(total)}
                        </div>
                    </div>
                </div>

                {/* High-Impact Multi-Gradient Progress Bar */}
                <div className="relative">
                    <div className="h-4 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-800 p-0.5">
                        {slices.map((slice, index) => (
                            <div
                                key={index}
                                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full relative group/segment"
                                style={{
                                    width: `${slice.percentage}%`,
                                    background: `linear-gradient(90deg, ${slice.color.start}, ${slice.color.end})`,
                                    opacity: activeIndex !== null && activeIndex !== index ? 0.3 : 1,
                                    filter: activeIndex === index ? 'brightness(1.2)' : 'none',
                                }}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {activeIndex === index && (
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Tick Marks or Accents */}
                    <div className="flex justify-between mt-3 px-1">
                        {[0, 25, 50, 75, 100].map(mark => (
                            <div key={mark} className="flex flex-col items-center">
                                <div className="w-px h-1 bg-neutral-800 mb-1" />
                                <span className="text-[8px] font-black italic text-neutral-700">{mark}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

