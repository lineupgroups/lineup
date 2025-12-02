import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserKYCData } from '../../types/kyc';
import { CheckCircle, XCircle, Clock, Eye, Search, Filter } from 'lucide-react';
import { approveKYC, rejectKYC } from '../../lib/kycService';
import toast from 'react-hot-toast';
import KYCDocumentViewer from './KYCDocumentViewer';

export default function AdminKYCReview() {
    const [kycSubmissions, setKycSubmissions] = useState<UserKYCData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedKYC, setSelectedKYC] = useState<UserKYCData | null>(null);
    const [showViewer, setShowViewer] = useState(false);

    useEffect(() => {
        fetchKYCSubmissions();
    }, [filter]);

    const fetchKYCSubmissions = async () => {
        try {
            setLoading(true);
            let q = query(collection(db, 'kyc_documents'), orderBy('submittedAt', 'desc'));

            if (filter !== 'all') {
                q = query(
                    collection(db, 'kyc_documents'),
                    where('status', '==', filter),
                    orderBy('submittedAt', 'desc')
                );
            }

            const snapshot = await getDocs(q);
            const submissions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as UserKYCData[];

            setKycSubmissions(submissions);
        } catch (error) {
            console.error('Error fetching KYC submissions:', error);
            toast.error('Failed to load KYC submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (kyc: UserKYCData) => {
        setSelectedKYC(kyc);
        setShowViewer(true);
    };

    const handleApprove = async (kycId: string, adminId: string) => {
        try {
            await approveKYC(kycId, adminId);
            toast.success('KYC approved successfully!');
            fetchKYCSubmissions();
            setShowViewer(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve KYC');
        }
    };

    const handleReject = async (kycId: string, adminId: string, reason: string) => {
        if (!reason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            await rejectKYC(kycId, adminId, reason);
            toast.success('KYC rejected');
            fetchKYCSubmissions();
            setShowViewer(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject KYC');
        }
    };

    const filteredSubmissions = kycSubmissions.filter(kyc =>
        searchTerm === '' ||
        kyc.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kyc.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
            under_review: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Under Review' },
            approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
            rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {badge.text}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">KYC Review Dashboard</h2>
                <p className="text-gray-600">Review and approve creator verification submissions</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by user ID or document ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['pending', 'under_review', 'approved', 'rejected'].map(status => {
                    const count = kycSubmissions.filter(k => k.status === status).length;
                    return (
                        <div key={status} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                                </div>
                                {getStatusBadge(status)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading submissions...</p>
                    </div>
                ) : filteredSubmissions.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-600">No KYC submissions found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Age</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredSubmissions.map(kyc => (
                                    <tr key={kyc.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-mono text-gray-900">{kyc.userId.slice(0, 8)}...</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">{kyc.creatorAge} years</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900 capitalize">{kyc.kycType.replace('_', ' ')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(kyc.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600">
                                                {kyc.submittedAt?.toDate().toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleView(kyc)}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Document Viewer Modal */}
            {showViewer && selectedKYC && (
                <KYCDocumentViewer
                    kyc={selectedKYC}
                    onClose={() => setShowViewer(false)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}
        </div>
    );
}
