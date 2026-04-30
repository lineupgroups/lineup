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
        return <div className="p-12 text-center text-neutral-500 font-medium">Loading donation history...</div>;
    }

    return (
        <div className="bg-[#111] rounded-3xl border border-neutral-800 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-neutral-800">
                <h2 className="text-2xl font-bold text-brand-white tracking-tight">Donation History</h2>
                <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-brand-acid transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by project or transaction ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 text-brand-white rounded-xl focus:outline-none focus:border-brand-acid focus:ring-1 focus:ring-brand-acid transition-all placeholder-neutral-500"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-1 focus-within:border-brand-orange focus-within:ring-1 focus-within:ring-brand-orange transition-all">
                        <Filter className="w-5 h-5 text-neutral-500" />
                        <select
                            value={filterAmount}
                            onChange={(e) => setFilterAmount(e.target.value)}
                            className="bg-transparent text-brand-white py-2 focus:outline-none appearance-none pr-8 cursor-pointer"
                        >
                            <option value="all" className="bg-neutral-900 text-brand-white">All Amounts</option>
                            <option value="under-1000" className="bg-neutral-900 text-brand-white">Under ₹1,000</option>
                            <option value="1000-5000" className="bg-neutral-900 text-brand-white">₹1,000 - ₹5,000</option>
                            <option value="over-5000" className="bg-neutral-900 text-brand-white">Over ₹5,000</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-neutral-900/50 border-b border-neutral-800">
                        <tr>
                            <th className="px-8 py-5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Date</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Project</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Amount</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                            <th className="px-8 py-5 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                        {filteredDonations.length > 0 ? (
                            filteredDonations.map((donation) => (
                                <tr key={donation.id} className="hover:bg-neutral-800/30 transition-colors group">
                                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-neutral-400 group-hover:text-neutral-300">
                                        {format(donation.backedAt.toDate(), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-base font-bold text-brand-white group-hover:text-brand-acid transition-colors">{donation.projectTitle}</span>
                                            <span className="text-xs font-medium text-neutral-500 mt-1 tracking-wide">ID: {donation.transactionId}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-base font-bold text-brand-white">
                                        ₹{donation.amount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className="px-3 py-1 text-xs font-bold rounded-md bg-brand-acid/10 text-brand-acid border border-brand-acid/20 uppercase tracking-wider">
                                            Completed
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDownloadReceipt(donation)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-brand-orange hover:bg-brand-orange/10 hover:text-[#ff7b33] transition-colors font-bold"
                                        >
                                            <Download className="w-4 h-4" />
                                            Receipt
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-8 py-16 text-center text-neutral-500 font-medium">
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
