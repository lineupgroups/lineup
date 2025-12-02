import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, Filter, Search } from 'lucide-react';
import { DonationData, getUserDonations } from '../../lib/donationService';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generateReceipt } from '../../utils/receiptGenerator';

interface DonationWithProject extends DonationData {
    projectTitle: string;
}

export default function DonationHistory() {
    const { user } = useAuth();
    const [donations, setDonations] = useState<DonationWithProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAmount, setFilterAmount] = useState('all');

    useEffect(() => {
        const fetchDonations = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const userDonations = await getUserDonations(user.uid, { limitCount: 100 });

                // Fetch project titles
                const donationsWithTitles = await Promise.all(
                    userDonations.map(async (donation) => {
                        try {
                            const projectDoc = await getDoc(doc(db, 'projects', donation.projectId));
                            return {
                                ...donation,
                                projectTitle: projectDoc.exists() ? projectDoc.data().title : 'Unknown Project'
                            };
                        } catch (e) {
                            return { ...donation, projectTitle: 'Unknown Project' };
                        }
                    })
                );

                setDonations(donationsWithTitles);
            } catch (error) {
                console.error('Error fetching donation history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
    }, [user]);

    const filteredDonations = donations.filter(donation => {
        const matchesSearch = donation.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            donation.transactionId.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesAmount = true;
        if (filterAmount === 'under-1000') matchesAmount = donation.amount < 1000;
        if (filterAmount === '1000-5000') matchesAmount = donation.amount >= 1000 && donation.amount <= 5000;
        if (filterAmount === 'over-5000') matchesAmount = donation.amount > 5000;

        return matchesSearch && matchesAmount;
    });

    const handleDownloadReceipt = (donation: DonationWithProject) => {
        generateReceipt(donation, donation.projectTitle);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading donation history...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Donation History</h2>
                <div className="mt-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by project or transaction ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={filterAmount}
                            onChange={(e) => setFilterAmount(e.target.value)}
                            className="border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        >
                            <option value="all">All Amounts</option>
                            <option value="under-1000">Under ₹1,000</option>
                            <option value="1000-5000">₹1,000 - ₹5,000</option>
                            <option value="over-5000">Over ₹5,000</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredDonations.length > 0 ? (
                            filteredDonations.map((donation) => (
                                <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(donation.backedAt.toDate(), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{donation.projectTitle}</span>
                                            <span className="text-xs text-gray-500">ID: {donation.transactionId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ₹{donation.amount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                            Completed
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDownloadReceipt(donation)}
                                            className="text-orange-600 hover:text-orange-900 inline-flex items-center gap-1"
                                        >
                                            <Download className="w-4 h-4" />
                                            Receipt
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No donations found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
