import { useEffect, useState, useRef } from 'react';

interface CountUpProps {
    end: number;
    start?: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    decimals?: number;
}

export default function CountUp({
    end,
    start = 0,
    duration = 2000,
    prefix = '',
    suffix = '',
    className = '',
    decimals = 0
}: CountUpProps) {
    const [count, setCount] = useState(start);
    const countRef = useRef(start);
    const requestRef = useRef<number>();
    const startTimeRef = useRef<number>();

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }

            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

            // Easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const currentCount = start + (end - start) * easeProgress;
            countRef.current = currentCount;
            setCount(currentCount);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [end, start, duration]);

    const formattedCount = count.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return (
        <span className={className}>
            {prefix}{formattedCount}{suffix}
        </span>
    );
}
