import { useState, useCallback, useRef } from 'react';

interface UseRateLimitOptions {
    /** Minimum time between calls in milliseconds */
    minInterval?: number;
    /** Maximum calls allowed within the time window */
    maxCalls?: number;
    /** Time window for maxCalls in milliseconds */
    timeWindow?: number;
}

interface UseRateLimitResult {
    /** Execute the rate-limited function */
    execute: <T>(fn: () => Promise<T> | T) => Promise<T | null>;
    /** Whether currently rate limited */
    isRateLimited: boolean;
    /** Remaining time until next allowed call (ms) */
    remainingTime: number;
    /** Number of calls remaining in current window */
    remainingCalls: number;
    /** Reset the rate limit state */
    reset: () => void;
}

/**
 * Hook for rate limiting function calls
 * Prevents excessive API calls or user actions
 */
export function useRateLimit({
    minInterval = 2000,
    maxCalls = 5,
    timeWindow = 60000
}: UseRateLimitOptions = {}): UseRateLimitResult {
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [remainingCalls, setRemainingCalls] = useState(maxCalls);

    const lastCallTime = useRef<number>(0);
    const callTimestamps = useRef<number[]>([]);
    const cooldownTimer = useRef<NodeJS.Timeout | null>(null);

    const reset = useCallback(() => {
        setIsRateLimited(false);
        setRemainingTime(0);
        setRemainingCalls(maxCalls);
        lastCallTime.current = 0;
        callTimestamps.current = [];
        if (cooldownTimer.current) {
            clearTimeout(cooldownTimer.current);
            cooldownTimer.current = null;
        }
    }, [maxCalls]);

    const execute = useCallback(async <T,>(fn: () => Promise<T> | T): Promise<T | null> => {
        const now = Date.now();

        // Check minimum interval
        const timeSinceLastCall = now - lastCallTime.current;
        if (timeSinceLastCall < minInterval && lastCallTime.current > 0) {
            const waitTime = minInterval - timeSinceLastCall;
            setIsRateLimited(true);
            setRemainingTime(waitTime);

            // Auto-reset after wait time
            if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
            cooldownTimer.current = setTimeout(() => {
                setIsRateLimited(false);
                setRemainingTime(0);
            }, waitTime);

            return null;
        }

        // Clean old timestamps outside time window
        callTimestamps.current = callTimestamps.current.filter(
            ts => now - ts < timeWindow
        );

        // Check max calls in time window
        if (callTimestamps.current.length >= maxCalls) {
            const oldestCall = callTimestamps.current[0];
            const waitTime = timeWindow - (now - oldestCall);

            setIsRateLimited(true);
            setRemainingTime(waitTime);
            setRemainingCalls(0);

            // Auto-reset after wait time
            if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
            cooldownTimer.current = setTimeout(() => {
                setIsRateLimited(false);
                setRemainingTime(0);
                callTimestamps.current = callTimestamps.current.filter(
                    ts => Date.now() - ts < timeWindow
                );
                setRemainingCalls(maxCalls - callTimestamps.current.length);
            }, waitTime);

            return null;
        }

        // Execute the function
        lastCallTime.current = now;
        callTimestamps.current.push(now);
        setRemainingCalls(maxCalls - callTimestamps.current.length);

        try {
            const result = await fn();
            return result;
        } catch (error) {
            throw error;
        }
    }, [minInterval, maxCalls, timeWindow]);

    return {
        execute,
        isRateLimited,
        remainingTime,
        remainingCalls,
        reset
    };
}

/**
 * Simple debounce hook for non-async functions
 */
export function useDebounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            fn(...args);
        }, delay);
    }, [fn, delay]);
}

/**
 * Throttle hook - ensures function is called at most once per interval
 */
export function useThrottle<T extends (...args: any[]) => any>(
    fn: T,
    interval: number
): (...args: Parameters<T>) => void {
    const lastCallTime = useRef<number>(0);
    const pendingArgs = useRef<Parameters<T> | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback((...args: Parameters<T>) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime.current;

        if (timeSinceLastCall >= interval) {
            lastCallTime.current = now;
            fn(...args);
        } else {
            // Store args for trailing call
            pendingArgs.current = args;

            if (!timeoutRef.current) {
                timeoutRef.current = setTimeout(() => {
                    if (pendingArgs.current) {
                        lastCallTime.current = Date.now();
                        fn(...pendingArgs.current);
                        pendingArgs.current = null;
                    }
                    timeoutRef.current = null;
                }, interval - timeSinceLastCall);
            }
        }
    }, [fn, interval]);
}
