/**
 * Loading skeleton for Updates page components
 */

export function UpdatesStatsSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-pulse">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                        <div>
                            <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                            <div className="h-4 w-48 bg-gray-200 rounded" />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                        <div className="h-6 w-16 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                                <div className="w-12 h-4 bg-gray-200 rounded" />
                            </div>
                            <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>

                {/* Best Performing Update Skeleton */}
                <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                        <div className="flex-1">
                            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                            <div className="h-5 w-64 bg-gray-200 rounded mb-2" />
                            <div className="flex items-center gap-4">
                                <div className="h-4 w-16 bg-gray-200 rounded" />
                                <div className="h-4 w-16 bg-gray-200 rounded" />
                                <div className="h-4 w-16 bg-gray-200 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function UpdateCardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                        <div className="flex items-center gap-4">
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                        </div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                </div>

                {/* Image placeholder */}
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />

                {/* Content */}
                <div className="space-y-2 mb-4">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                </div>

                {/* Engagement Stats */}
                <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-6">
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function UpdatesListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: count }).map((_, i) => (
                <UpdateCardSkeleton key={i} />
            ))}
        </div>
    );
}

export default UpdatesListSkeleton;
