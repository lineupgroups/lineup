import { useState, useMemo } from 'react';

interface FundBreakdownItem {
    item: string;
    amount: number;
}

interface FundBreakdownPieChartProps {
    breakdown: FundBreakdownItem[];
}

// Beautiful gradient color palette
const COLORS = [
    { start: '#f97316', end: '#ea580c' }, // Orange
    { start: '#8b5cf6', end: '#7c3aed' }, // Purple
    { start: '#06b6d4', end: '#0891b2' }, // Cyan
    { start: '#10b981', end: '#059669' }, // Emerald
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

    // Calculate total and percentages
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

    // SVG path for pie slice
    const describeArc = (
        cx: number,
        cy: number,
        radius: number,
        startAngle: number,
        endAngle: number
    ) => {
        const startRad = ((startAngle - 90) * Math.PI) / 180;
        const endRad = ((endAngle - 90) * Math.PI) / 180;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        return [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z',
        ].join(' ');
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
        <div className="space-y-6">
            {/* Pie Chart */}
            <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Chart */}
                <div className="relative w-64 h-64 flex-shrink-0">
                    <svg
                        viewBox="0 0 200 200"
                        className="w-full h-full drop-shadow-lg"
                        role="img"
                        aria-label="Fund breakdown pie chart"
                    >
                        <defs>
                            {slices.map((slice, index) => (
                                <linearGradient
                                    key={`gradient-${index}`}
                                    id={`gradient-${index}`}
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                >
                                    <stop offset="0%" stopColor={slice.color.start} />
                                    <stop offset="100%" stopColor={slice.color.end} />
                                </linearGradient>
                            ))}
                        </defs>

                        {slices.map((slice, index) => {
                            const isActive = activeIndex === index;
                            const scale = isActive ? 1.05 : 1;
                            const radius = 85 * scale;

                            return (
                                <path
                                    key={index}
                                    d={describeArc(100, 100, radius, slice.startAngle, slice.endAngle)}
                                    fill={`url(#gradient-${index})`}
                                    className="transition-all duration-300 cursor-pointer"
                                    style={{
                                        transformOrigin: '100px 100px',
                                        filter: isActive
                                            ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))'
                                            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                        opacity: activeIndex !== null && !isActive ? 0.6 : 1,
                                    }}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                                />
                            );
                        })}

                        {/* Center circle for donut effect */}
                        <circle
                            cx="100"
                            cy="100"
                            r="50"
                            fill="white"
                            className="drop-shadow-inner"
                        />

                        {/* Center text */}
                        <text
                            x="100"
                            y="92"
                            textAnchor="middle"
                            className="text-xs fill-gray-500 font-medium"
                        >
                            Total
                        </text>
                        <text
                            x="100"
                            y="112"
                            textAnchor="middle"
                            className="text-sm fill-gray-900 font-bold"
                        >
                            {formatCurrency(total)}
                        </text>
                    </svg>

                    {/* Hover tooltip */}
                    {activeIndex !== null && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl px-4 py-3 border border-gray-100 text-center min-w-[140px]">
                                <p className="text-xs text-gray-500 mb-1">
                                    {slices[activeIndex].percentage.toFixed(1)}%
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mb-0.5">
                                    {slices[activeIndex].item}
                                </p>
                                <p
                                    className="text-lg font-bold"
                                    style={{ color: slices[activeIndex].color.start }}
                                >
                                    {formatCurrency(slices[activeIndex].amount)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="flex-1 w-full">
                    <div className="space-y-2">
                        {slices.map((slice, index) => {
                            const isActive = activeIndex === index;

                            return (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${isActive
                                            ? 'bg-gray-100 shadow-sm scale-[1.02]'
                                            : 'hover:bg-gray-50'
                                        }`}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Color indicator */}
                                        <div
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${slice.color.start}, ${slice.color.end})`,
                                            }}
                                        />
                                        {/* Item name */}
                                        <span
                                            className={`font-medium transition-colors ${isActive ? 'text-gray-900' : 'text-gray-700'
                                                }`}
                                        >
                                            {slice.item}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Percentage */}
                                        <span
                                            className={`text-sm px-2 py-0.5 rounded-full transition-all ${isActive
                                                    ? 'bg-gray-200 text-gray-800'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}
                                        >
                                            {slice.percentage.toFixed(1)}%
                                        </span>
                                        {/* Amount */}
                                        <span
                                            className={`font-semibold transition-colors ${isActive ? 'text-gray-900' : 'text-gray-700'
                                                }`}
                                        >
                                            {formatCurrency(slice.amount)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Summary bar at bottom */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-100">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Fund Allocation</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
                </div>
                {/* Progress bar showing breakdown */}
                <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden flex">
                    {slices.map((slice, index) => (
                        <div
                            key={index}
                            className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                            style={{
                                width: `${slice.percentage}%`,
                                background: `linear-gradient(90deg, ${slice.color.start}, ${slice.color.end})`,
                                opacity: activeIndex !== null && activeIndex !== index ? 0.5 : 1,
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
