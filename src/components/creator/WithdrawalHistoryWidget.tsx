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
 * Shows recent payout history with status indicators (Dark Brand UI)
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
                    color: 'text-emerald-400',
                    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
                    label: 'Completed'
                };
            case 'processing':
                return {
                    icon: RefreshCw,
                    color: 'text-sky-400',
                    bgColor: 'bg-sky-500/10 border-sky-500/20',
                    label: 'Processing'
                };
            case 'failed':
                return {
                    icon: XCircle,
                    color: 'text-red-400',
                    bgColor: 'bg-red-500/10 border-red-500/20',
                    label: 'Failed'
                };
            default:
                return {
                    icon: Clock,
                    color: 'text-amber-400',
                    bgColor: 'bg-amber-500/10 border-amber-500/20',
                    label: 'Pending'
                };
        }
    };

    if (loading) {
        return (
            <div className={`bg-[#111] rounded-3xl border border-neutral-800 p-6 ${className}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-orange/10 rounded-lg border border-brand-orange/20">
                            <Wallet className="w-5 h-5 text-brand-orange" />
                        </div>
                        <h3 className="font-bold text-brand-white text-xl tracking-tight">Recent Withdrawals</h3>
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-neutral-900 rounded-xl">
                            <div className="w-10 h-10 bg-neutral-800 rounded-lg" />
                            <div className="flex-1">
                                <div className="h-4 bg-neutral-800 rounded w-24 mb-2" />
                                <div className="h-3 bg-neutral-800 rounded w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-[#111] rounded-3xl border border-neutral-800 p-6 ${className}`}>
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-[#111] rounded-3xl border border-neutral-800 p-6 flex flex-col ${className}`}>
            <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-orange/10 rounded-lg border border-brand-orange/20">
                        <Wallet className="w-5 h-5 text-brand-orange" />
                    </div>
                    <h3 className="font-bold text-brand-white text-xl tracking-tight">Recent Withdrawals</h3>
                </div>
                <Link
                    to="/dashboard/earnings?tab=history"
                    className="text-sm text-brand-orange hover:text-brand-white font-semibold flex items-center gap-1 transition-colors"
                >
                    View All
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            {payouts.length === 0 ? (
                <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto rounded-full bg-neutral-900 flex items-center justify-center mb-4 border border-neutral-800">
                        <Wallet className="w-6 h-6 text-neutral-500" />
                    </div>
                    <p className="text-brand-white font-bold">No withdrawals yet</p>
                    <p className="text-neutral-500 text-sm mt-1">
                        Your withdrawal history will appear here
                    </p>
                    <Link
                        to="/dashboard/earnings"
                        className="inline-block mt-5 px-5 py-2 text-sm text-brand-black bg-brand-orange hover:bg-[#ff7529] font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(255,91,0,0.2)]"
                    >
                        Go to Earnings →
                    </Link>
                </div>
            ) : (
                <div className="space-y-3 flex-grow">
                    {payouts.map(payout => {
                        const status = getStatusConfig(payout.status);
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={payout.id}
                                className="flex items-center gap-4 p-4 bg-neutral-900/50 rounded-2xl hover:bg-neutral-900 transition-colors border border-transparent hover:border-neutral-800 group"
                            >
                                <div className={`w-12 h-12 rounded-xl border ${status.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                    <StatusIcon className={`w-5 h-5 ${status.color} ${payout.status === 'processing' ? 'animate-spin' : ''}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-bold text-brand-white text-lg">
                                            {formatCurrency(payout.amount)}
                                        </p>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.bgColor} ${status.color} uppercase tracking-wide`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                                        <span>{formatDate(payout.createdAt)}</span>
                                        {payout.bankDetails && (
                                            <>
                                                <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
                                                <span className="text-neutral-400">****{payout.bankDetails.accountLast4}</span>
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
