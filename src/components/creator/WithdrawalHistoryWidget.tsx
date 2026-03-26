import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Payout {
    id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    bankDetails?: {
        bankName: string;
        accountLast4: string;
    };
}

interface WithdrawalHistoryWidgetProps {
    limit?: number;
    className?: string;
}

/**
 * Withdrawal History Quick View Widget
 * Shows recent payout history with status indicators
 */
function WithdrawalHistoryWidget({ limit: limitCount = 3, className = '' }: WithdrawalHistoryWidgetProps) {
    const { user } = useAuth();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const fetchPayouts = async () => {
            try {
                setLoading(true);
                setError(null);

                const payoutsRef = collection(db, 'payouts');
                const payoutsQuery = query(
                    payoutsRef,
                    where('creatorId', '==', user.uid),
                    orderBy('createdAt', 'desc'),
                    limit(limitCount)
                );

                const snapshot = await getDocs(payoutsQuery);
                const payoutsData: Payout[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        amount: data.amount || 0,
                        status: data.status || 'pending',
                        createdAt: data.createdAt?.toDate() || new Date(),
                        completedAt: data.completedAt?.toDate(),
                        bankDetails: data.bankDetails
                    };
                });

                setPayouts(payoutsData);
            } catch (err) {
                console.error('Error fetching payouts:', err);
                setError('Failed to load withdrawal history');
            } finally {
                setLoading(false);
            }
        };

        fetchPayouts();
    }, [user?.uid, limitCount]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusConfig = (status: Payout['status']) => {
        switch (status) {
            case 'completed':
                return {
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bgColor: 'bg-green-100',
                    label: 'Completed'
                };
            case 'processing':
                return {
                    icon: RefreshCw,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-100',
                    label: 'Processing'
                };
            case 'failed':
                return {
                    icon: XCircle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-100',
                    label: 'Failed'
                };
            default:
                return {
                    icon: Clock,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-100',
                    label: 'Pending'
                };
        }
    };

    if (loading) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-orange-500" />
                        <h3 className="font-semibold text-gray-900">Recent Withdrawals</h3>
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
                <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-900">Recent Withdrawals</h3>
                </div>
                <Link
                    to="/dashboard/earnings?tab=history"
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                >
                    View All
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {payouts.length === 0 ? (
                <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Wallet className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm">No withdrawals yet</p>
                    <p className="text-gray-500 text-xs mt-1">
                        Your withdrawal history will appear here
                    </p>
                    <Link
                        to="/dashboard/earnings"
                        className="inline-block mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                        Go to Earnings →
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {payouts.map(payout => {
                        const status = getStatusConfig(payout.status);
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={payout.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-lg ${status.bgColor} flex items-center justify-center`}>
                                    <StatusIcon className={`w-5 h-5 ${status.color} ${payout.status === 'processing' ? 'animate-spin' : ''}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(payout.amount)}
                                        </p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                        <span>{formatDate(payout.createdAt)}</span>
                                        {payout.bankDetails && (
                                            <>
                                                <span>•</span>
                                                <span>****{payout.bankDetails.accountLast4}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default memo(WithdrawalHistoryWidget);
