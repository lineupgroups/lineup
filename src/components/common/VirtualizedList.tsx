import { useState, useRef, useEffect, useCallback, memo, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface VirtualizedListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => ReactNode;
    itemHeight?: number;
    maxVisibleItems?: number;
    className?: string;
    emptyState?: ReactNode;
    showExpandButton?: boolean;
    expandThreshold?: number;
    keyExtractor: (item: T, index: number) => string;
}

/**
 * Virtualized List Component
 * Efficiently renders large lists with virtual scrolling
 * Falls back to simple expand/collapse for smaller lists
 */
function VirtualizedListInner<T>({
    items,
    renderItem,
    itemHeight = 68,
    maxVisibleItems = 15,
    className = '',
    emptyState,
    showExpandButton = true,
    expandThreshold = 15,
    keyExtractor
}: VirtualizedListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const shouldVirtualize = items.length > expandThreshold;
    const visibleItems = isExpanded ? items : items.slice(0, maxVisibleItems);

    // Calculate virtual scrolling parameters
    const totalHeight = shouldVirtualize && isExpanded ? items.length * itemHeight : visibleItems.length * itemHeight;
    const startIndex = shouldVirtualize && isExpanded ? Math.floor(scrollTop / itemHeight) : 0;
    const endIndex = shouldVirtualize && isExpanded
        ? Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 2, items.length)
        : visibleItems.length;
    const offsetY = shouldVirtualize && isExpanded ? startIndex * itemHeight : 0;

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        if (shouldVirtualize && isExpanded) {
            setScrollTop(e.currentTarget.scrollTop);
        }
    }, [shouldVirtualize, isExpanded]);

    // Measure container height
    useEffect(() => {
        if (containerRef.current) {
            const observer = new ResizeObserver((entries) => {
                setContainerHeight(entries[0].contentRect.height);
            });
            observer.observe(containerRef.current);
            return () => observer.disconnect();
        }
    }, []);

    // Toggle expansion
    const toggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev);
        setScrollTop(0);
    }, []);

    if (items.length === 0) {
        return <>{emptyState}</>;
    }

    const virtualizedItems = shouldVirtualize && isExpanded
        ? items.slice(startIndex, endIndex)
        : visibleItems;

    return (
        <div className={className}>
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className={`space-y-2 ${shouldVirtualize && isExpanded ? 'overflow-y-auto max-h-[400px]' : ''}`}
                style={shouldVirtualize && isExpanded ? { position: 'relative', height: Math.min(400, totalHeight) } : {}}
            >
                {shouldVirtualize && isExpanded ? (
                    <div style={{ height: totalHeight, position: 'relative' }}>
                        <div style={{ transform: `translateY(${offsetY}px)` }}>
                            {virtualizedItems.map((item, index) => (
                                <div
                                    key={keyExtractor(item, startIndex + index)}
                                    style={{ height: itemHeight }}
                                    className="flex items-center"
                                >
                                    {renderItem(item, startIndex + index)}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    virtualizedItems.map((item, index) => (
                        <div key={keyExtractor(item, index)}>
                            {renderItem(item, index)}
                        </div>
                    ))
                )}
            </div>

            {/* Expand/Collapse button */}
            {showExpandButton && items.length > maxVisibleItems && (
                <button
                    onClick={toggleExpand}
                    className="mt-3 w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    {isExpanded ? (
                        <>
                            Show Less <ChevronUp className="w-4 h-4" />
                        </>
                    ) : (
                        <>
                            Show {items.length - maxVisibleItems} More <ChevronDown className="w-4 h-4" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

// Memoized version
const VirtualizedList = memo(VirtualizedListInner) as typeof VirtualizedListInner;
export default VirtualizedList;

/**
 * Simple virtualized container for scroll-based virtualization
 */
export const VirtualizedContainer = memo(function VirtualizedContainer<T>({
    items,
    renderItem,
    itemHeight = 60,
    maxHeight = 400,
    className = '',
    emptyState,
    keyExtractor
}: {
    items: T[];
    renderItem: (item: T, index: number) => ReactNode;
    itemHeight?: number;
    maxHeight?: number;
    className?: string;
    emptyState?: ReactNode;
    keyExtractor: (item: T, index: number) => string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(maxHeight);

    const totalHeight = items.length * itemHeight;
    const buffer = 3;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + buffer * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    const offsetY = startIndex * itemHeight;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            setContainerHeight(containerRef.current.clientHeight);
        }
    }, []);

    if (items.length === 0) {
        return <>{emptyState}</>;
    }

    // Don't virtualize small lists
    if (items.length <= 15) {
        return (
            <div className={`space-y-2 ${className}`}>
                {items.map((item, index) => (
                    <div key={keyExtractor(item, index)}>
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className={`overflow-y-auto ${className}`}
            style={{ maxHeight, height: Math.min(totalHeight, maxHeight) }}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
                    {items.slice(startIndex, endIndex).map((item, index) => (
                        <div
                            key={keyExtractor(item, startIndex + index)}
                            style={{ height: itemHeight }}
                        >
                            {renderItem(item, startIndex + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});
